import OpenAI from "openai";
import * as cheerio from "cheerio";
import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { assertUrlIsSafe, MAX_REDIRECTS } from "@/lib/ssrf";

// Vercel: allow up to 60s for OpenAI calls (requires Pro plan; hobby cap is 10s)
export const maxDuration = 60;

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_WEBSITE_API_KEY || process.env.OPENAI_API_KEY });
  return _openai;
}

const AI_ANALYSIS_ENABLED = !["0", "false", "no", "off"].includes(
  String(process.env.AI_ANALYSIS_ENABLED || "true").toLowerCase()
);
const KILL_SWITCH = ["1", "true", "yes", "on"].includes(
  String(process.env.NEUTRALEYE_KILL_SWITCH || "").toLowerCase()
);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 5);
const MIN_TEXT_LENGTH = Number(process.env.MIN_TEXT_LENGTH || 200);
const MIN_EXTRACTED_TEXT_LENGTH = Number(process.env.MIN_EXTRACTED_TEXT_LENGTH || 300);
const MAX_ANALYSIS_TEXT_LENGTH = Number(process.env.MAX_ANALYSIS_TEXT_LENGTH || 100_000);
const MAX_EXTRACTED_TEXT_LENGTH = Number(process.env.MAX_EXTRACTED_TEXT_LENGTH || 100_000);

// In-memory stores — reset on cold start (acceptable for serverless)
const inMemoryCache = new Map();
const rateLimitStore = new Map();

// ── Logging ────────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function logEvent(level, event, meta = {}) {
  const line = JSON.stringify({ timestamp: nowIso(), event, ...meta });
  if (level === "error") { console.error(line); return; }
  if (level === "warn") { console.warn(line); return; }
  console.info(line);
}

// Genuine bugs/operational failures worth alerting on — excludes expected,
// user-driven outcomes (validation, rate limits, "not an article").
const SENTRY_CAPTURE_CODES = new Set(["OPENAI_ERROR", "INTERNAL_ERROR", "URL_EXTRACTION_ERROR"]);

function reportToSentry(error, errorCode) {
  if (error?._sentryReported) return;
  if (SENTRY_CAPTURE_CODES.has(errorCode)) {
    Sentry.captureException(error);
  }
  if (error && typeof error === "object") error._sentryReported = true;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function errResponse(status, error, code, details = "") {
  return Response.json({ error, code, details }, { status });
}

function getClientIp(request) {
  const forwarded = String(request.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  return forwarded || "unknown";
}

function isWebClient(request) {
  const client = String(request.headers.get("x-client") || "").toLowerCase();
  return client === "web" || client === "web-dashboard" || client.includes("neutraleye-web");
}

function safeTrim(text, maxChars = 8000) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text;
}

function cleanWhitespace(s) {
  return String(s || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateTextInput(value) {
  if (typeof value !== "string") return "Invalid or missing 'text' in request body.";
  const trimmed = value.trim();
  if (!trimmed) return "Empty 'text' provided.";
  if (trimmed.length < MIN_TEXT_LENGTH)
    return `Text is too short. Provide at least ${MIN_TEXT_LENGTH} characters.`;
  if (trimmed.length > 100_000) return "Text is too long. Max 100000 characters.";
  return "";
}

function validateUrlInput(value) {
  if (typeof value !== "string") return "Invalid or missing 'url' in request body.";
  const trimmed = value.trim();
  if (!trimmed) return "Empty 'url' provided.";
  if (trimmed.length > 2048) return "URL is too long.";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return "Invalid 'url'. Must start with http:// or https://.";
  } catch {
    return "Invalid 'url'. Must start with http:// or https://.";
  }
  return "";
}

// ── URL extraction ─────────────────────────────────────────────────────────

const FETCH_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

async function fetchHtml(url, timeoutMs = 12000) {
  let currentUrl = url;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertUrlIsSafe(currentUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": FETCH_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
        currentUrl = new URL(response.headers.get("location"), currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        const error = new Error(`Fetch failed with status ${response.status}`);
        error.code = "URL_FETCH_FAILED";
        error.status = response.status;
        throw error;
      }
      return await response.text();
    } catch (error) {
      if (error?.name === "AbortError") {
        const e = new Error("Timed out while fetching URL content.");
        e.code = "URL_FETCH_TIMEOUT";
        throw e;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const error = new Error("Too many redirects while fetching URL content.");
  error.code = "URL_FETCH_FAILED";
  error.status = 502;
  throw error;
}

function extractPageTitle($) {
  const og = $('meta[property="og:title"]').attr("content");
  if (og?.trim()) return og.trim();
  const tw = $('meta[name="twitter:title"]').attr("content");
  if (tw?.trim()) return tw.trim();
  const tag = $("title").first().text();
  if (tag?.trim()) return tag.trim();
  const h1 = $("h1").first().text();
  if (h1?.trim()) return h1.trim();
  return null;
}

async function extractArticleTextFromUrl(url) {
  const html = await fetchHtml(url, 12000);
  const $ = cheerio.load(html);
  const pageTitle = extractPageTitle($);

  $("script, style, noscript, svg, canvas, iframe").remove();
  $('[class*="ad-"],[class*="-ad"],[id*="ad-"],[class*="advertisement"],[class*="sponsored"],[class*="promo-"]').remove();
  $('[class*="cookie"],[class*="gdpr"],[class*="consent"],[class*="cc-banner"],[role="dialog"],[class*="overlay"],[class*="modal"]').remove();
  $('[class*="share-"],[class*="-share"],[class*="social-links"],[class*="addthis"],[class*="follow-us"]').remove();
  $('[class*="newsletter"],[class*="subscribe"],[class*="signup-"]').remove();
  $('[class*="comment"],[id*="comment"],[id="disqus_thread"],[class*="respond"],[class*="replies"]').remove();
  $('[class*="related-"],[class*="recommended"],[class*="more-stories"],[class*="also-read"],[class*="trending"]').remove();
  $('[class*="author-bio"],[class*="about-author"],[class*="tag-list"],[class*="category-list"]').remove();
  $('[class*="pull-quote"],[class*="pullquote"],[class*="blockquote--pull"]').remove();
  $("figcaption").remove();
  $('[class*="video-"],[class*="-video"],[class*="embed-"],[class*="multimedia"]').remove();
  $('[class*="callout"],[class*="highlight-box"],[class*="info-box"]').remove();
  $('[class*="promoted"],[class*="partner-content"],[class*="outbrain"],[class*="taboola"],[class*="revcontent"]').remove();
  $('[data-ad],[data-advertisement],[data-sponsored]').remove();
  $(".wp-caption,.image-caption,.wp-block-image").remove();
  $('[class*="paywall"],[class*="subscribe-wall"],[class*="metered"]').remove();

  const articleEl = $("article");
  const mainEl = $("main");
  let root = articleEl.length ? articleEl.first() : mainEl.length ? mainEl.first() : $("body");

  root.find("nav,footer,header,aside,form,button,figure,picture,table,[class*='caption'],[class*='byline'],[class*='author'],[rel='author'],[class*='credit'],[class*='dateline'],[class*='breadcrumb'],[class*='toolbar'],[class*='pagination']").remove();

  const parts = [];
  root.find("h1,h2,h3,p,li").each((_, el) => {
    const cleaned = cleanWhitespace($(el).text());
    if (cleaned && cleaned.length >= 25) parts.push(cleaned);
  });

  const seen = new Set();
  const deduped = parts.filter((p) => {
    const key = p.slice(0, 80).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let text = deduped.join("\n\n");
  if (!text || text.length < 300) text = cleanWhitespace(root.text());
  return { text: safeTrim(cleanWhitespace(text), MAX_EXTRACTED_TEXT_LENGTH), title: pageTitle };
}

// ── OpenAI calls ───────────────────────────────────────────────────────────

async function detectIfArticle(text, requestId) {
  logEvent("info", "openai.call.start", { requestId, operation: "detectIfArticle" });
  const prompt = `You are an article detector.
Classify the text below as either an "article" (news, blog post, opinion piece, feature story)
or "not article" (email, dashboard, homepage, chat, social feed, code, random text).

Respond with ONLY one word: "article" or "not article".

Text:
"""${safeTrim(text, Math.min(MAX_ANALYSIS_TEXT_LENGTH, 4000))}"""`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });
    const verdict = completion.choices?.[0]?.message?.content?.trim().toLowerCase() || "not article";
    logEvent("info", "openai.call.end", { requestId, operation: "detectIfArticle", outcome: verdict });
    return verdict;
  } catch (error) {
    logEvent("error", "openai.call.error", {
      requestId,
      operation: "detectIfArticle",
      errorCode: error?.code || "OPENAI_ERROR",
      message: String(error?.message || error),
    });
    reportToSentry(error, "OPENAI_ERROR");
    throw error;
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function generateBiasAnalysis(text, requestId, sourceUrl = null) {
  logEvent("info", "openai.call.start", { requestId, operation: "generateBiasAnalysis" });
  const sourceDomain = sourceUrl ? extractDomain(sourceUrl) : null;
  const prompt = `You are an impartial, evidence-first media analyst. Analyze the article text below for bias.

SCOPE & CONTEXT
- Base conclusions primarily on the TEXT_FOR_ANALYSIS.
- You may apply limited, widely-accepted background reasoning only to evaluate framing, omission, or attribution.
- Do NOT introduce new factual claims or assume outside events unless the article explicitly references them.
- Do NOT speculate about author intent.

EVIDENCE SOURCE RULES — CRITICAL
- You are analyzing the JOURNALIST'S writing — their framing, word choices, structure, emphasis, and omissions — NOT the views of people quoted in the article.
- Do NOT treat direct quotes from interview subjects, officials, politicians, spokespeople, witnesses, or anyone being covered in the story as evidence of the article's bias. A quoted person's loaded language reflects that person's bias, not the journalist's.
- A sentence that is inside quotation marks and attributed to a named person or source (e.g., "X said", "according to Y") is NEVER eligible as a biased_phrase, no matter how loaded it sounds.
- Only the journalist's own narration, framing sentences, descriptions, and editorial choices (what to include, omit, or emphasize) count as evidence.

CONTENT TYPE CLASSIFICATION
- First classify the article's content type as one of: "news", "opinion", or "analysis".
  - "news": straight news reporting — primarily describes events, statements, or developments through factual reporting.
  - "opinion": an op-ed, editorial, column, or piece that explicitly argues for the author's own viewpoint or position.
  - "analysis": an analysis, explainer, or commentary piece that interprets or contextualizes events without being a pure opinion column.
- Use signals such as section labels ("Opinion", "Editorial", "Analysis", "Perspective"), first-person argumentation ("I believe", "we should", "in my view"), and overall structure (argument-driven vs. event-driven) to classify.
- This classification changes how bias should be evaluated:
  - "opinion": a clear personal stance, persuasive language, and arguing for a position are EXPECTED and must NOT by themselves be flagged as bias. Only flag bias if the piece misrepresents facts, omits critical context in a misleading way, or presents false claims as established fact.
  - "analysis": interpretation and informed perspective are expected. Apply a moderately relaxed standard — flag only one-sided framing, unsupported claims presented as fact, or omissions that materially mislead.
  - "news": apply the full bias standard described below with no relaxation.

BIAS TAXONOMY (use for the "why" field — applies only to the journalist's own writing)
- "framing": the journalist's selective emphasis, ordering, or omission that alters interpretation.
- "language": the journalist's own loaded, emotive, or judgmental wording presented as fact (not wording inside a quote from a source).
- "source": the journalist's sourcing choices — one-sided sourcing without meaningful countervailing perspectives.
- "attribution": claims the journalist presents as fact without clear attribution.

ANALYSIS RULES
- Only flag bias when the journalist's own writing clearly and meaningfully shapes how a reader would perceive the story.
- Apply a minimum-impact threshold: if any bias signals are minor, isolated, purely stylistic, or would not meaningfully change a reader's perception, set bias_level to "none" rather than flagging it.
- Reserve "slight", "moderate", and "heavy" for cases where the journalist's framing, emphasis, omissions, or word choices would meaningfully shape a reader's interpretation.
- If evidence is weak or ambiguous, set bias_level to "none" or "uncertain" and set analysis_confidence below 0.4.
- When flagging bias, include exact quoted excerpts of the JOURNALIST'S OWN SENTENCES only — never a quote attributed to a person in the article.
- Scores above 0.85 should be rare and reserved for clear, repeated, text-explicit bias in the journalist's own writing.

SUGGESTED_SOURCES RULES
- Only include specific article URLs you are reasonably confident exist and that directly cover the SAME main topic.
- Do NOT provide homepage links or general topic pages.
- If you cannot verify relevant specific articles, use an empty array for suggested_sources.${sourceDomain ? `\n- Do NOT suggest ${sourceDomain} as a source — the article being analyzed is already from that outlet.` : ""}

OUTPUT
Respond with ONLY a valid JSON object. No prose, no markdown, no commentary outside the JSON.

Required schema:
{
  "content_type": "news" | "opinion" | "analysis",
  "bias_level": "none" | "slight" | "moderate" | "heavy" | "uncertain",
  "direction": "toward <entity>" | "against <entity>" | "non-directional framing bias" | "unknown",
  "analysis_confidence": <number 0.00–1.00>,
  "summary": "<one or two neutral sentences. If bias_level is 'none', state plainly that the writing itself is neutral/clean. If bias_level is not 'none', state plainly that the journalist's writing shows meaningful bias and briefly why.>",
  "biased_phrases": [
    { "quote": "<exact excerpt of the journalist's own writing — never a quote attributed to a person in the article>", "why": "framing|language|source|attribution" }
  ],
  "suggested_sources": [
    { "title": "Article title here", "url": "https://outlet.com/article-path", "outlet": "Outlet Name" }
  ],
  "recommendations": ["<procedural verification or reading suggestion>"],
  "explanation": "<1–3 sentence rationale>"
}

Rules:
- If bias_level is "none", biased_phrases must be an empty array.
- If you cannot confidently verify a source URL exists and covers this exact topic, suggested_sources must be an empty array.

TEXT_FOR_ANALYSIS:
"""${safeTrim(text, MAX_ANALYSIS_TEXT_LENGTH)}"""`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    });
    const content = (completion.choices?.[0]?.message?.content || "").trim();
    logEvent("info", "openai.call.end", { requestId, operation: "generateBiasAnalysis" });
    return content;
  } catch (error) {
    logEvent("error", "openai.call.error", {
      requestId,
      operation: "generateBiasAnalysis",
      errorCode: error?.code || "OPENAI_ERROR",
      message: String(error?.message || error),
    });
    reportToSentry(error, "OPENAI_ERROR");
    throw error;
  }
}

// ── Response normalization ─────────────────────────────────────────────────

function standardizeOutput(rawText) {
  if (!rawText) return "";
  let text = String(rawText);
  text = text.replace(/JSON_OUTPUT:\s*/gi, "");
  text = text.replace(/\(\s*(?:start_char|end_char)[^)]+\)/gi, "");
  text = text.replace(/\|\s*null/gi, "");
  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  if (text.toLowerCase().includes("no significant bias detected"))
    return "✅ No significant bias detected. Please feel free to continue reading.";
  return text;
}

function buildRawResult(json) {
  if (!json) return "";
  const biasLevel = String(json.bias_level || "").trim();
  const direction = String(json.direction || "").trim();
  const summary = String(json.summary || "").trim();
  const explanation = String(json.explanation || "").trim();
  const confidence = Number(json.analysis_confidence);
  const phrases = Array.isArray(json.biased_phrases) ? json.biased_phrases : [];
  const sources = Array.isArray(json.suggested_sources) ? json.suggested_sources : [];
  const recs = Array.isArray(json.recommendations) ? json.recommendations : [];

  if (biasLevel === "none")
    return "✅ No significant bias detected. Please feel free to continue reading.";

  const parts = [];
  const levelLabel = biasLevel ? `${biasLevel.charAt(0).toUpperCase()}${biasLevel.slice(1)} bias` : "Bias detected";
  const directionText = direction && direction !== "unknown" ? ` ${direction}` : "";
  parts.push(`**Bias Level**\n${levelLabel}${directionText}.`);
  if (summary) parts.push(`**Summary of Bias**\n${summary}`);
  if (explanation && explanation !== summary) parts.push(explanation);
  if (phrases.length) {
    const exLines = phrases.map((p) => `- "${String(p.quote || "").trim()}" — ${String(p.why || "").trim()}`).join("\n");
    parts.push(`**Examples of Bias**\n${exLines}`);
  }
  if (sources.length) {
    const srcLines = sources.map((s) => {
      const title = String(s.title || "").trim();
      const url = String(s.url || "").trim();
      const outlet = String(s.outlet || "").trim();
      return `- ${[title, outlet].filter(Boolean).join(" — ")}${url ? ` — ${url}` : ""}`;
    }).join("\n");
    parts.push(`**Suggested Unbiased Sources**\n${srcLines}`);
  }
  if (recs.length) parts.push(`**Recommendations**\n${recs.map((r) => `- ${r}`).join("\n")}`);
  if (Number.isFinite(confidence)) parts.push(`**Analysis Confidence**\n${confidence.toFixed(2)}`);
  return parts.join("\n\n");
}

function listFromBlock(text) {
  return String(text || "").split(/\n+/).map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

function sectionValue(markdown, heading, fallbackHeading) {
  const titles = [heading, fallbackHeading].filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!titles.length) return "";
  const allHeadings = ["Bias Level","Direction","Summary of Bias","Summary","Examples of Bias","Examples","Suggested Unbiased Sources","Suggested unbiased sources","Recommendations","Recommendations to look up","Analysis Confidence","Confidence level"].map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(?:^|\\s)\\*\\*(?:${titles.join("|")})\\*\\*\\s*([\\s\\S]*?)(?=(?:\\s|\\n)\\*\\*(?:${allHeadings.join("|")})\\*\\*|$)`, "i");
  const match = String(markdown || "").match(pattern);
  return match ? match[1].trim() : "";
}

function parseHumanReadableSections(humanText) {
  const human = String(humanText || "").trim();
  if (!human) return { directionLabel: "", summary: "", examples: [], sources: [], recommendations: [], confidence: null };
  const directionLabel = sectionValue(human, "Bias Level", "Direction");
  const summary = sectionValue(human, "Summary of Bias", "Summary");
  const examples = listFromBlock(sectionValue(human, "Examples of Bias", "Examples"))
    .map((item) => item.replace(/\s*\(start_char:\s*[^)]*\)/gi, "").trim())
    .filter(Boolean)
    .map((quote) => ({ quote, label: "Bias signal", explanation: "Model-detected bias signal.", highlights: [] }));
  const sources = listFromBlock(sectionValue(human, "Suggested Unbiased Sources", "Suggested unbiased sources"))
    .filter((item) => !/^no verified specific urls available/i.test(item))
    .map((item) => {
      const urlMatch = item.match(/https?:\/\/\S+/i);
      const url = urlMatch ? urlMatch[0].replace(/[),.]+$/, "") : "";
      const name = item.replace(url, "").replace(/\s+—\s+$/g, "").trim() || url;
      return name || url ? { name, url } : null;
    })
    .filter(Boolean);
  const recommendations = listFromBlock(sectionValue(human, "Recommendations", "Recommendations to look up"));
  const confidenceText = sectionValue(human, "Analysis Confidence", "Confidence level");
  const confidenceMatch = confidenceText.match(/(\d+(?:\.\d+)?)\s*%?/);
  const confidence = confidenceMatch
    ? Math.max(0, Math.min(Number(confidenceMatch[1]) > 1 ? Number(confidenceMatch[1]) / 100 : Number(confidenceMatch[1]), 1))
    : null;
  return { directionLabel, summary, examples, sources, recommendations, confidence };
}

function titleCase(value) {
  return String(value || "").split(/[\s_-]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function driverLabelFromReason(reason) {
  const n = String(reason || "").trim().toLowerCase();
  if (n === "language") return "Loaded wording";
  if (n === "framing") return "Framing";
  if (n === "source") return "Source imbalance";
  if (n === "attribution") return "Attribution gaps";
  // AI sometimes returns descriptive labels (e.g. "LOADED PHRASING") — title-case them
  const raw = String(reason || "").trim();
  if (raw) return raw.split(/[\s_-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return "Bias signal";
}

function explanationFromReason(reason) {
  const n = String(reason || "").trim().toLowerCase();
  if (n === "language") return "Loaded or emotive wording shifts how the claim is perceived.";
  if (n === "framing") return "Selective emphasis or omission changes the reader's interpretation.";
  if (n === "source") return "The sourcing appears one-sided or lacks meaningful counterbalance.";
  if (n === "attribution") return "Claims are presented with weak attribution or unclear sourcing.";
  return "Model-detected bias signal.";
}

function scoreFromBiasLevel(biasLevel, direction) {
  const magnitudeMap = { none: 0, slight: 0.24, moderate: 0.52, heavy: 0.82, uncertain: 0.12 };
  const magnitude = magnitudeMap[String(biasLevel || "").trim().toLowerCase()] ?? 0;
  if (!magnitude) return 0;
  const nd = String(direction || "").trim().toLowerCase();
  if (nd.startsWith("against ")) return -magnitude;
  if (nd.startsWith("toward ")) return magnitude;
  return 0;
}

function directionLabelFromAiJson(aiJson, humanText) {
  const biasLevel = String(aiJson?.bias_level || "").trim().toLowerCase();
  const direction = String(aiJson?.direction || "").trim();
  const nd = direction.toLowerCase();
  if (biasLevel === "none" || String(humanText || "").toLowerCase().includes("no significant bias detected"))
    return "No significant bias detected";
  if (biasLevel === "uncertain" || nd === "non-directional framing bias" || nd === "unknown")
    return "Uncertain bias (non-directional)";
  if (biasLevel && direction) return `${titleCase(biasLevel)} bias ${direction}`;
  if (biasLevel) return `${titleCase(biasLevel)} bias detected`;
  return "Analysis complete";
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean))];
}

function contentTypeFromAiJson(aiJson) {
  const raw = String(aiJson?.content_type || "").trim().toLowerCase();
  return raw === "opinion" || raw === "analysis" ? raw : "news";
}

function normalizeAiResult(parsed) {
  const human = String(parsed?.human || "").trim();
  const aiJson = parsed?.json || null;
  const humanSections = parseHumanReadableSections(human);
  const examples = Array.isArray(aiJson?.biased_phrases)
    ? aiJson.biased_phrases.map((item) => {
        const quote = String(item?.quote || "").trim();
        const why = String(item?.why || "").trim().toLowerCase();
        if (!quote) return null;
        return { quote, label: driverLabelFromReason(why), explanation: explanationFromReason(why), highlights: [] };
      }).filter(Boolean)
    : humanSections.examples;
  const drivers = uniqueStrings(examples.map((item) => item.label));
  const sources = Array.isArray(aiJson?.suggested_sources)
    ? aiJson.suggested_sources.map((item) => {
        const title = String(item?.title || "").trim();
        const url = String(item?.url || "").trim();
        const outlet = String(item?.outlet || "").trim();
        if (!title && !url && !outlet) return null;
        return { name: [title, outlet].filter(Boolean).join(" - ") || url, url };
      }).filter(Boolean)
    : humanSections.sources;
  const recommendations = Array.isArray(aiJson?.recommendations)
    ? aiJson.recommendations.map((item) => String(item).trim()).filter(Boolean)
    : humanSections.recommendations;
  const summary = String(aiJson?.summary || aiJson?.explanation || humanSections.summary || human || "").trim() || "No summary returned.";
  const confidenceValue = Number(aiJson?.analysis_confidence);
  const confidence = Number.isFinite(confidenceValue)
    ? Math.max(0, Math.min(confidenceValue > 1 ? confidenceValue / 100 : confidenceValue, 1))
    : humanSections.confidence !== null ? humanSections.confidence
    : human.toLowerCase().includes("no significant bias detected") ? 0.65
    : 0.5;
  const directionLabel = aiJson ? directionLabelFromAiJson(aiJson, human) : humanSections.directionLabel || directionLabelFromAiJson(aiJson, human);
  return {
    contentType: contentTypeFromAiJson(aiJson),
    directionLabel,
    score: scoreFromBiasLevel(aiJson?.bias_level, aiJson?.direction),
    confidence,
    drivers: drivers.length ? drivers : ["Loaded wording", "Framing", "Source imbalance", "Attribution gaps"],
    summary,
    examples,
    sources,
    recommendations,
    rawResult: human,
  };
}

function parseAiResponse(aiResponse) {
  let parsedJson = null;
  try { parsedJson = JSON.parse(String(aiResponse || "").trim()); } catch { parsedJson = null; }
  return {
    human: parsedJson ? buildRawResult(parsedJson) : standardizeOutput(aiResponse),
    json: parsedJson,
  };
}

// ── Analysis pipeline ──────────────────────────────────────────────────────

async function runAnalysisPipeline(text, requestId, sourceUrl = null, pageTitle = null) {
  const verdict = await detectIfArticle(text, requestId);
  if (verdict !== "article") {
    const error = new Error("Submitted content does not look like a readable article.");
    error.status = 422;
    error.code = "ARTICLE_VALIDATION_FAILED";
    throw error;
  }
  const aiResponse = await generateBiasAnalysis(text, requestId, sourceUrl);
  const parsed = parseAiResponse(aiResponse);
  const normalized = normalizeAiResult(parsed);
  return {
    contentType: normalized.contentType,
    directionLabel: normalized.directionLabel,
    score: normalized.score,
    confidence: normalized.confidence,
    drivers: normalized.drivers,
    summary: normalized.summary,
    examples: normalized.examples,
    sources: normalized.sources,
    recommendations: normalized.recommendations,
    result: normalized.rawResult,
    json: parsed.json,
    extractedText: text,
    title: pageTitle || null,
  };
}

// ── Rate limiting ──────────────────────────────────────────────────────────

function checkRateLimit(ip) {
  return checkRedisRateLimit(ip, {
    prefix: "ne:web",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    fallbackStore: rateLimitStore,
  });
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const ip = getClientIp(request);

  if (!AI_ANALYSIS_ENABLED || KILL_SWITCH) {
    logEvent("warn", "analysis.unavailable", { requestId, ip });
    return errResponse(503, "Analysis is temporarily unavailable.", "AI_DISABLED");
  }

  const retryAfter = await checkRateLimit(ip);
  if (retryAfter !== null) {
    logEvent("warn", "rate_limit.exceeded", { requestId, ip, retryAfter });
    return Response.json(
      { error: "Too many requests. Please retry shortly.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errResponse(400, "Request body must be valid JSON.", "INVALID_BODY");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errResponse(400, "Request body must be a JSON object.", "INVALID_BODY");
  }

  const hasText = typeof body.text === "string" && body.text.trim().length > 0;
  const hasUrl = typeof body.url === "string" && body.url.trim().length > 0;

  try {
    // Text mode
    if (hasText) {
      const textError = validateTextInput(body.text);
      if (textError) return errResponse(400, textError, "VALIDATION_ERROR");

      const text = body.text.trim();
      const key = `text:${text.slice(0, 500)}`;
      if (inMemoryCache.has(key)) {
        logEvent("info", "cache.hit", { requestId, mode: "text" });
        return Response.json(inMemoryCache.get(key));
      }

      logEvent("info", "analysis.start", { requestId, mode: "text", inputLength: text.length, ip });
      const result = await runAnalysisPipeline(text, requestId);
      inMemoryCache.set(key, result);
      return Response.json(result);
    }

    // URL mode
    if (hasUrl) {
      if (!isWebClient(request)) {
        return errResponse(400, "URL mode is only allowed for website clients.", "URL_MODE_NOT_ALLOWED");
      }

      const urlError = validateUrlInput(body.url);
      if (urlError) return errResponse(400, urlError, "VALIDATION_ERROR");

      const url = body.url.trim();
      const key = `url:${url}`;
      if (inMemoryCache.has(key)) {
        logEvent("info", "cache.hit", { requestId, mode: "url" });
        return Response.json(inMemoryCache.get(key));
      }

      logEvent("info", "analysis.start", { requestId, mode: "url", url, ip });

      let extracted = "";
      let pageTitle = null;
      try {
        const extraction = await extractArticleTextFromUrl(url);
        extracted = extraction.text;
        pageTitle = extraction.title;
        logEvent("info", "url.extraction.success", { requestId, url, extractedTextLength: extracted.length });
      } catch (error) {
        logEvent("warn", "url.extraction.failure", { requestId, url, errorCode: error?.code, message: String(error?.message) });
        if (error?.code === "URL_BLOCKED")
          return errResponse(400, "This URL cannot be analyzed.", "URL_BLOCKED");
        if (error?.code === "URL_FETCH_TIMEOUT")
          return errResponse(504, "Timed out while fetching URL content.", "URL_FETCH_TIMEOUT");
        if (error?.code === "URL_FETCH_FAILED")
          return errResponse(502, "Could not fetch the requested URL.", "URL_FETCH_FAILED", `status=${error?.status}`);
        reportToSentry(error, "URL_EXTRACTION_ERROR");
        return errResponse(502, "Unexpected error fetching URL.", "URL_EXTRACTION_ERROR");
      }

      if (!extracted || extracted.length < MIN_EXTRACTED_TEXT_LENGTH) {
        return errResponse(422, "Could not extract enough readable article text from that URL.", "URL_EXTRACTION_TOO_SHORT");
      }

      const result = await runAnalysisPipeline(extracted, requestId, url, pageTitle);
      inMemoryCache.set(key, result);
      return Response.json(result);
    }

    return errResponse(400, "Request must include non-empty 'text' or 'url'.", "VALIDATION_ERROR");
  } catch (error) {
    const errorCode = error?.code || "INTERNAL_ERROR";
    logEvent("error", "analysis.failure", {
      requestId,
      ip,
      errorCode,
      message: String(error?.message || error),
    });
    reportToSentry(error, errorCode);
    if (error?.status && error?.code) {
      return errResponse(error.status, error.message, error.code);
    }
    return errResponse(500, "Error checking bias.", "INTERNAL_ERROR");
  }
}

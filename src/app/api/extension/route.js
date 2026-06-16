import OpenAI from "openai";
import * as cheerio from "cheerio";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { assertUrlIsSafe, MAX_REDIRECTS } from "@/lib/ssrf";

// Vercel: allow up to 60s for OpenAI calls (requires Pro plan; hobby cap is 10s)
export const maxDuration = 60;

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_EXTENSION_API_KEY || process.env.OPENAI_API_KEY });
  return _openai;
}

const AI_ANALYSIS_ENABLED = !["0", "false", "no", "off"].includes(
  String(process.env.AI_ANALYSIS_ENABLED || "true").toLowerCase()
);
const KILL_SWITCH = ["1", "true", "yes", "on"].includes(
  String(process.env.NEUTRALEYE_KILL_SWITCH || "").toLowerCase()
);
const RATE_LIMIT_WINDOW_MS = Number(process.env.EXT_RATE_LIMIT_WINDOW_MS || process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.EXT_RATE_LIMIT_MAX || process.env.RATE_LIMIT_MAX || 5);
const MAX_ANALYSIS_TEXT_LENGTH = Number(process.env.MAX_ANALYSIS_TEXT_LENGTH || 100_000);

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

// ── CORS ───────────────────────────────────────────────────────────────────
// Chrome extensions send an Origin like chrome-extension://<id>.
// Accept any chrome-extension:// origin — the ID changes between unpacked
// and published installs, and rate-limiting already guards the endpoint.

function makeSupabase(accessToken = null) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
    }
  );
}

function parseToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

async function resolveAuthUser(token) {
  if (!token) return null;
  try {
    const { data: { user } } = await makeSupabase().auth.getUser(token);
    return user || null;
  } catch {
    return null;
  }
}

async function incrementUserDailyUsage(supabase, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();
  if (existing) {
    await supabase.from("daily_usage").update({ count: existing.count + 1 }).eq("user_id", userId).eq("usage_date", today);
  } else {
    await supabase.from("daily_usage").insert({ user_id: userId, usage_date: today, count: 1 });
  }
}

async function saveAnalysisToCloud(supabase, userId, parsedJson, inputUrl, headline) {
  if (!parsedJson) return;
  const drivers = [...new Set((parsedJson.biased_phrases || []).map((p) => String(p.why || "")).filter(Boolean))];
  await supabase.from("analyses").insert({
    id: randomUUID(),
    user_id: userId,
    created_at: new Date().toISOString(),
    input_type: inputUrl ? "url" : "text",
    url: inputUrl || null,
    title: headline || null,
    direction: parsedJson.direction || "unknown",
    direction_label: parsedJson.direction || "unknown",
    confidence: parsedJson.analysis_confidence ?? 0,
    score: parsedJson.analysis_confidence ?? 0,
    summary: parsedJson.summary || "",
    drivers,
    examples: (parsedJson.biased_phrases || []).map((p) => ({ quote: p.quote, why: p.why })),
    sources: parsedJson.suggested_sources || [],
    recommendations: parsedJson.recommendations || [],
    request_meta: null,
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = origin.startsWith("chrome-extension://") ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-client, x-request-id, Authorization",
  };
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getClientIp(request) {
  return String(request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

function safeTrim(text, maxChars = 25000) {
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

function isValidHttpUrl(u) {
  try {
    const parsed = new URL(String(u));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ── Rate limiting ──────────────────────────────────────────────────────────

function checkRateLimit(ip) {
  return checkRedisRateLimit(ip, {
    prefix: "ne:ext",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    fallbackStore: rateLimitStore,
  });
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

      if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
      return await response.text();
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Timed out fetching URL.");
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Too many redirects while fetching URL content.");
}

async function extractArticleTextFromUrl(url) {
  const html = await fetchHtml(url, 12000);
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, canvas, iframe").remove();
  $('[class*="ad-"],[class*="-ad"],[id*="ad-"],[class*="advertisement"],[class*="sponsored"]').remove();
  $('[class*="cookie"],[class*="gdpr"],[class*="consent"],[role="dialog"],[class*="modal"]').remove();
  $('[class*="newsletter"],[class*="subscribe"],[class*="comment"],[id*="comment"]').remove();
  $('[class*="related-"],[class*="recommended"],[class*="more-stories"]').remove();
  $("figcaption").remove();

  const articleEl = $("article");
  const mainEl = $("main");
  let root = articleEl.length ? articleEl.first() : mainEl.length ? mainEl.first() : $("body");

  root.find("nav, footer, header, aside, form, button, figure, picture, [class*='caption'], [class*='byline'], [class*='author'], [rel='author'], [class*='credit'], [class*='dateline']").remove();

  const parts = [];
  root.find("h1,h2,h3,p,li").each((_, el) => {
    const cleaned = cleanWhitespace($(el).text());
    if (cleaned && cleaned.length >= 20) parts.push(cleaned);
  });

  let text = parts.join("\n\n");
  if (!text || text.length < 300) text = cleanWhitespace(root.text());
  return safeTrim(cleanWhitespace(text), 25000);
}

// ── OpenAI calls ───────────────────────────────────────────────────────────

async function detectIfArticle(text) {
  const prompt = `You are an article detector.
Classify the text below as either an "article" (news, blog post, opinion piece, feature story)
or "not article" (email, dashboard, homepage, chat, social feed, code, random text).

Respond with ONLY one word: "article" or "not article".

Text:
"""${safeTrim(text, Math.min(MAX_ANALYSIS_TEXT_LENGTH, 4000))}"""`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });
  return completion.choices[0].message.content.trim().toLowerCase();
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function contentTypeFromAiJson(aiJson) {
  const raw = String(aiJson?.content_type || "").trim().toLowerCase();
  return raw === "opinion" || raw === "analysis" ? raw : "news";
}

async function generateBiasAnalysis(text, sourceUrl = null) {
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

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    response_format: { type: "json_object" },
  });
  return (completion.choices?.[0]?.message?.content || "").trim();
}

// ── Format response for extension ──────────────────────────────────────────
// The extension frontend expects { result: "<human readable text>" }
// We build that from the JSON response.

function buildHumanResult(json) {
  if (!json) return "";
  const biasLevel = String(json.bias_level || "").trim();
  const direction = String(json.direction || "").trim();
  const summary = String(json.summary || "").trim();
  const explanation = String(json.explanation || "").trim();
  const confidence = Number(json.analysis_confidence);
  const phrases = Array.isArray(json.biased_phrases) ? json.biased_phrases : [];
  const sources = Array.isArray(json.suggested_sources) ? json.suggested_sources : [];
  const recs = Array.isArray(json.recommendations) ? json.recommendations : [];

  if (biasLevel === "none") {
    return "✅ No significant bias detected. Please feel free to continue reading.";
  }

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

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const ip = getClientIp(request);
  const headers = corsHeaders(request);

  if (!AI_ANALYSIS_ENABLED || KILL_SWITCH) {
    logEvent("warn", "analysis.unavailable", { requestId, ip });
    return Response.json(
      { error: "Analysis is temporarily unavailable.", code: "AI_DISABLED" },
      { status: 503, headers }
    );
  }

  // IP rate limit applied to all requests (authenticated and anonymous)
  const retryAfter = await checkRateLimit(ip);
  if (retryAfter !== null) {
    logEvent("warn", "rate_limit.exceeded", { requestId, ip, retryAfter });
    return Response.json(
      { error: "Too many requests. Please retry shortly.", code: "RATE_LIMITED" },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } }
    );
  }

  // Resolve authenticated user from Bearer token (if present)
  const token = parseToken(request);
  const authUser = await resolveAuthUser(token);
  const authedSupabase = authUser ? makeSupabase(token) : null;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400, headers });
  }

  let { text, url, headline } = body;

  const clientHeader = String(request.headers.get("x-client") || "").toLowerCase();
  const isWebClient = clientHeader === "web";

  const hasText = typeof text === "string" && text.trim().length > 0;
  const hasUrl = typeof url === "string" && url.trim().length > 0;

  try {
    // URL mode — website clients only
    if (!hasText && hasUrl) {
      if (!isWebClient) {
        return Response.json({ error: "Text is required. Submit the article text directly." }, { status: 400, headers });
      }
      if (!isValidHttpUrl(url.trim())) {
        return Response.json({ error: "Invalid URL. Must start with http:// or https://." }, { status: 400, headers });
      }

      const cacheKey = `url:${url.trim()}`;
      if (inMemoryCache.has(cacheKey)) {
        return Response.json(inMemoryCache.get(cacheKey), { headers });
      }

      let extracted;
      try {
        extracted = await extractArticleTextFromUrl(url.trim());
      } catch (error) {
        if (error?.code === "URL_BLOCKED") {
          return Response.json({ error: "This URL cannot be analyzed.", code: "URL_BLOCKED" }, { status: 400, headers });
        }
        throw error;
      }
      if (!extracted || extracted.length < 300) {
        return Response.json(
          { result: "⚠️ Could not extract readable article text from that URL. Try a different article page." },
          { headers }
        );
      }
      text = extracted;
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "Invalid or missing 'text' in request body." }, { status: 400, headers });
    }

    text = text.trim();

    const cacheKey = hasUrl ? `url:${url}` : `text:${text.slice(0, 500)}`;
    if (!authUser && inMemoryCache.has(cacheKey)) {
      return Response.json(inMemoryCache.get(cacheKey), { headers });
    }

    const verdict = await detectIfArticle(text);
    if (verdict !== "article") {
      const payload = { result: "⚠️ Could not analyze this page. Please open a real article and try again." };
      inMemoryCache.set(cacheKey, payload);
      return Response.json(payload, { headers });
    }

    const aiResponse = await generateBiasAnalysis(text, hasUrl ? url : null);
    let parsedJson = null;
    try { parsedJson = JSON.parse(aiResponse); } catch { parsedJson = null; }

    const humanResult = buildHumanResult(parsedJson) || aiResponse;
    const contentType = contentTypeFromAiJson(parsedJson);
    const payload = { result: humanResult, contentType };
    inMemoryCache.set(cacheKey, payload);

    // Save to cloud history and track usage for authenticated users
    if (authUser) {
      await Promise.all([
        saveAnalysisToCloud(authedSupabase, authUser.id, parsedJson, hasUrl ? url : null, headline || null),
        incrementUserDailyUsage(authedSupabase, authUser.id),
      ]);
    }

    return Response.json({ ...payload, saved: Boolean(authUser) }, { headers });
  } catch (error) {
    const errorCode = error?.code || "INTERNAL_ERROR";
    logEvent("error", "analysis.failure", {
      requestId,
      ip,
      errorCode,
      message: String(error?.message || error),
    });
    reportToSentry(error, errorCode);
    return Response.json({ error: "Error checking bias.", code: "INTERNAL_ERROR" }, { status: 500, headers });
  }
}

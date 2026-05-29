import OpenAI from "openai";
import * as cheerio from "cheerio";

// Vercel: allow up to 60s for OpenAI calls (requires Pro plan; hobby cap is 10s)
export const maxDuration = 60;

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_EXTENSION_API_KEY || process.env.OPENAI_API_KEY });
  return _openai;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

// In-memory stores — reset on cold start (acceptable for serverless)
const inMemoryCache = new Map();
const rateLimitStore = new Map();

// ── CORS ───────────────────────────────────────────────────────────────────
// Chrome extensions send an Origin like chrome-extension://<id>
// We allow any chrome-extension:// origin so the route works before the
// extension ID is known. Lock this down to your specific extension ID once
// it's published: e.g. "chrome-extension://abcdefghijklmnopqrstuvwxyz123456"

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = origin.startsWith("chrome-extension://") ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-client, x-request-id",
  };
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getClientIp(request) {
  return String(request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
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
  const now = Date.now();
  const bucket = rateLimitStore.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  }
  return null;
}

// ── URL extraction ─────────────────────────────────────────────────────────

async function fetchHtml(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
    return await response.text();
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Timed out fetching URL.");
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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

  root.find("nav, footer, header, aside, form, button").remove();

  const parts = [];
  root.find("h1,h2,h3,p,li").each((_, el) => {
    const cleaned = cleanWhitespace($(el).text());
    if (cleaned && cleaned.length >= 20) parts.push(cleaned);
  });

  let text = parts.join("\n\n");
  if (!text || text.length < 300) text = cleanWhitespace(root.text());
  return safeTrim(cleanWhitespace(text), 8000);
}

// ── OpenAI calls ───────────────────────────────────────────────────────────

async function detectIfArticle(text) {
  const prompt = `You are an article detector.
Classify the text below as either an "article" (news, blog post, opinion piece, feature story)
or "not article" (email, dashboard, homepage, chat, social feed, code, random text).

Respond with ONLY one word: "article" or "not article".

Text:
"""${safeTrim(text, 2000)}"""`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });
  return completion.choices[0].message.content.trim().toLowerCase();
}

async function generateBiasAnalysis(text) {
  const prompt = `You are an impartial, evidence-first media analyst. Analyze the article text below for bias.

SCOPE & CONTEXT
- Base conclusions primarily on the TEXT_FOR_ANALYSIS.
- You may apply limited, widely-accepted background reasoning only to evaluate framing, omission, or attribution.
- Do NOT introduce new factual claims or assume outside events unless the article explicitly references them.
- Do NOT speculate about author intent.

BIAS TAXONOMY (use for the "why" field)
- "framing": selective emphasis or omission that alters interpretation.
- "language": loaded, emotive, or judgmental wording presented as fact.
- "source": one-sided sourcing without meaningful countervailing perspectives.
- "attribution": claims presented as fact without clear attribution.

ANALYSIS RULES
- Only flag bias when clearly supported by the text. If evidence is weak or ambiguous, set bias_level to "none" or "uncertain" and set analysis_confidence below 0.4.
- Scores above 0.85 should be rare and reserved for clear, repeated, text-explicit bias.

OUTPUT
Respond with ONLY a valid JSON object. No prose, no markdown, no commentary outside the JSON.

Required schema:
{
  "bias_level": "none" | "slight" | "moderate" | "heavy" | "uncertain",
  "direction": "toward <entity>" | "against <entity>" | "non-directional framing bias" | "unknown",
  "analysis_confidence": <number 0.00–1.00>,
  "summary": "<one or two neutral sentences>",
  "biased_phrases": [
    { "quote": "<exact excerpt>", "why": "framing|language|source|attribution" }
  ],
  "suggested_sources": [
    { "title": "<article title>", "url": "<https://...>", "outlet": "<Outlet Name>" }
  ],
  "recommendations": ["<procedural verification or reading suggestion>"],
  "explanation": "<1–3 sentence rationale>"
}

Rules:
- If bias_level is "none", biased_phrases must be an empty array.
- Do NOT fabricate or guess URLs. If uncertain, omit the source entirely.

TEXT_FOR_ANALYSIS:
"""${safeTrim(text, 8000)}"""`;

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
  const biasLevel = String(json.bias_level || "").trim().toLowerCase();

  if (biasLevel === "none") {
    return "✅ No significant bias detected. Please feel free to continue reading.";
  }

  const direction = String(json.direction || "").trim();
  const summary = String(json.summary || "").trim();
  const explanation = String(json.explanation || "").trim();
  const phrases = Array.isArray(json.biased_phrases) ? json.biased_phrases : [];
  const sources = Array.isArray(json.suggested_sources) ? json.suggested_sources : [];
  const recs = Array.isArray(json.recommendations) ? json.recommendations : [];
  const confidence = Number(json.analysis_confidence);

  const parts = [];
  const levelLabel = `${biasLevel.charAt(0).toUpperCase()}${biasLevel.slice(1)} bias`;
  const directionText = direction && direction !== "unknown" ? ` ${direction}` : "";
  parts.push(`**Bias Level**\n${levelLabel}${directionText}.`);

  parts.push(`**Summary of Bias**\n${summary || "No summary returned."}`);

  if (explanation && explanation !== summary) parts.push(explanation);

  const exLines = phrases.length
    ? phrases.map((p) => `- "${String(p.quote || "").trim()}" — ${String(p.why || "").trim()}`).join("\n")
    : "No strong language or framing examples crossed the threshold in this pass.";
  parts.push(`**Examples of Bias**\n${exLines}`);

  const srcLines = sources.length
    ? sources.map((s) => {
        const title = String(s.title || "").trim();
        const url = String(s.url || "").trim();
        const outlet = String(s.outlet || "").trim();
        return `- ${[title, outlet].filter(Boolean).join(" — ")}${url ? ` — ${url}` : ""}`;
      }).join("\n")
    : "- No specific comparison sources required. Cross-checking with Reuters or AP News is always useful.";
  parts.push(`**Suggested Unbiased Sources**\n${srcLines}`);

  const recLines = recs.length
    ? recs.map((r) => `- ${r}`).join("\n")
    : "- Continue reading with normal judgment. For high-stakes topics, compare with one additional source.";
  parts.push(`**Recommendations**\n${recLines}`);

  if (Number.isFinite(confidence)) parts.push(`**Analysis Confidence**\n${confidence.toFixed(2)}`);
  return parts.join("\n\n");
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request) {
  const ip = getClientIp(request);
  const headers = corsHeaders(request);

  const retryAfter = checkRateLimit(ip);
  if (retryAfter !== null) {
    return Response.json(
      { error: "Too many requests. Please retry shortly." },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400, headers });
  }

  let { text, url } = body;

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
        return Response.json({ result: inMemoryCache.get(cacheKey) }, { headers });
      }

      const extracted = await extractArticleTextFromUrl(url.trim());
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
    if (inMemoryCache.has(cacheKey)) {
      return Response.json({ result: inMemoryCache.get(cacheKey) }, { headers });
    }

    const verdict = await detectIfArticle(text);
    if (verdict !== "article") {
      const message = "⚠️ Could not analyze this page. Please open a real article and try again.";
      inMemoryCache.set(cacheKey, message);
      return Response.json({ result: message }, { headers });
    }

    const aiResponse = await generateBiasAnalysis(text);
    let parsedJson = null;
    try { parsedJson = JSON.parse(aiResponse); } catch { parsedJson = null; }

    const humanResult = buildHumanResult(parsedJson) || aiResponse;
    inMemoryCache.set(cacheKey, humanResult);

    return Response.json({ result: humanResult }, { headers });
  } catch (error) {
    console.error("Extension analysis error:", String(error?.message || error));
    return Response.json({ error: "Error checking bias." }, { status: 500, headers });
  }
}

import OpenAI from "openai";
import { randomUUID } from "crypto";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { DAILY_ANALYSIS_LIMIT, checkIpDailyLimit, getUserDailyCount, incrementUserDailyUsage } from "@/lib/dailyLimit";
import { createClient } from "@/lib/supabase/server";
import { logEvent, getClientIp, reportToSentry } from "@/lib/apiLog";
import {
  detectIfArticle,
  generateBiasAnalysis,
  extractArticleTextFromUrl,
  buildHumanResult,
  contentTypeFromAiJson,
} from "@/lib/analysis";

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

// In-memory stores — reset on cold start (acceptable for serverless)
const inMemoryCache = new Map();
const rateLimitStore = new Map();
const dailyLimitStore = new Map();

// ── Helpers ────────────────────────────────────────────────────────────────

function errResponse(status, error, code, details = "") {
  return Response.json({ error, code, details }, { status });
}

function isWebClient(request) {
  const client = String(request.headers.get("x-client") || "").toLowerCase();
  return client === "web" || client === "web-dashboard" || client.includes("neutraleye-web");
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
    human: parsedJson ? buildHumanResult(parsedJson) : standardizeOutput(aiResponse),
    json: parsedJson,
  };
}

// ── Analysis pipeline ──────────────────────────────────────────────────────

async function runAnalysisPipeline(text, requestId, sourceUrl = null, pageTitle = null) {
  const verdict = await detectIfArticle(getOpenAI(), text, requestId);
  if (verdict !== "article") {
    const error = new Error("Submitted content does not look like a readable article.");
    error.status = 422;
    error.code = "ARTICLE_VALIDATION_FAILED";
    throw error;
  }
  const aiResponse = await generateBiasAnalysis(getOpenAI(), text, requestId, sourceUrl);
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

  // Daily cap — checked before any OpenAI spend. Signed-in users are counted
  // per account (daily_usage table); anonymous users per IP (rolling 24h).
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (authUser) {
    const dailyCount = await getUserDailyCount(supabase, authUser.id);
    if (dailyCount >= DAILY_ANALYSIS_LIMIT) {
      logEvent("warn", "daily_limit.reached", { requestId, userId: authUser.id, dailyCount });
      return errResponse(
        429,
        `You've reached today's limit of ${DAILY_ANALYSIS_LIMIT} analyses. Your limit resets tomorrow.`,
        "DAILY_LIMIT_REACHED"
      );
    }
  } else {
    const dailyRetryAfter = await checkIpDailyLimit(ip, dailyLimitStore);
    if (dailyRetryAfter !== null) {
      logEvent("warn", "daily_limit.reached", { requestId, ip, anonymous: true });
      return Response.json(
        {
          error: `You've reached today's limit of ${DAILY_ANALYSIS_LIMIT} analyses. Your limit resets tomorrow.`,
          code: "DAILY_LIMIT_REACHED",
        },
        { status: 429, headers: { "Retry-After": String(dailyRetryAfter) } }
      );
    }
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
      if (authUser) {
        await incrementUserDailyUsage(supabase, authUser.id).catch(() => {});
      }
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
      if (authUser) {
        await incrementUserDailyUsage(supabase, authUser.id).catch(() => {});
      }
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

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
} from "@/lib/analysis";
import { normalizeAiResult, parseAiResponse } from "@/lib/normalizeAiResult";

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

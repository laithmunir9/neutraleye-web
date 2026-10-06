import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "crypto";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { DAILY_ANALYSIS_LIMIT, checkIpDailyLimit, getUserDailyCount, incrementUserDailyUsage } from "@/lib/dailyLimit";
import { logEvent, getClientIp, reportToSentry } from "@/lib/apiLog";
import {
  detectIfArticle,
  generateBiasAnalysis,
  extractArticleTextFromUrl,
  buildHumanResult,
  contentTypeFromAiJson,
  composeAnalysisText,
} from "@/lib/analysis";
import { analysisMetaFields } from "@/lib/analysisMeta";
import { isNoBiasLevel, isNonDirectional, NO_BIAS_LABEL } from "@/lib/biasLevel";
import { createAnalysisCache, textCacheKey, urlCacheKey } from "@/lib/analysisCache";

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

// In-memory stores — reset on cold start (acceptable for serverless)
const inMemoryCache = createAnalysisCache();
const rateLimitStore = new Map();
const dailyLimitStore = new Map();

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
    const { data: { user }, error } = await makeSupabase().auth.getUser(token);
    if (error) logEvent("warn", "auth.getUser.error", { message: error.message });
    return user || null;
  } catch (e) {
    logEvent("warn", "auth.getUser.exception", { message: String(e?.message || e) });
    return null;
  }
}

function buildDirectionLabel(parsedJson) {
  const biasLevel = String(parsedJson?.bias_level || "").trim().toLowerCase();
  const direction = String(parsedJson?.direction || "").trim();
  const nd = direction.toLowerCase();
  if (isNoBiasLevel(biasLevel)) return NO_BIAS_LABEL;
  // A legacy "non-directional framing bias" is shown as the current wording.
  if (isNonDirectional(direction)) return "Non-directional framing";
  if (biasLevel === "uncertain" || nd === "unknown") return direction || "unknown";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (biasLevel && direction) return `${cap(biasLevel)} framing ${direction}`;
  if (biasLevel) return `${cap(biasLevel)} framing detected`;
  return direction || "unknown";
}

async function saveAnalysisToCloud(supabase, userId, parsedJson, inputUrl, headline) {
  if (!parsedJson) return;
  const drivers = [...new Set((parsedJson.biased_phrases || []).map((p) => String(p.why || "")).filter(Boolean))];
  const { error } = await supabase.from("analyses").insert({
    id: randomUUID(),
    user_id: userId,
    created_at: new Date().toISOString(),
    input_type: inputUrl ? "url" : "text",
    url: inputUrl || null,
    title: headline || null,
    direction: parsedJson.direction || "unknown",
    direction_label: buildDirectionLabel(parsedJson),
    confidence: parsedJson.analysis_confidence ?? 0,
    score: parsedJson.analysis_confidence ?? 0,
    summary: parsedJson.summary || "",
    drivers,
    examples: (parsedJson.biased_phrases || []).map((p) => ({ quote: p.quote, why: p.why })),
    sources: parsedJson.suggested_sources || [],
    recommendations: parsedJson.recommendations || [],
    request_meta: { source: "extension", ...analysisMetaFields(parsedJson) },
  });
  if (error) {
    logEvent("error", "save.analysis.error", { userId, message: error.message, code: error.code });
    throw error;
  }
  logEvent("info", "save.analysis.success", { userId });
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
  const tokenExpired = Boolean(token && !authUser);
  logEvent("info", "auth.resolved", { requestId, hasToken: Boolean(token), userId: authUser?.id || null, tokenExpired });

  // Daily cap — checked before any OpenAI spend. Returned as a normal result
  // (HTTP 200) so the currently shipped popup renders it as a readable message.
  if (authUser) {
    let dailyCount;
    try {
      dailyCount = await getUserDailyCount(authedSupabase, authUser.id);
    } catch (error) {
      reportToSentry(error, "DAILY_USAGE_ERROR");
      return Response.json({ error: "Usage is temporarily unavailable.", code: "DAILY_USAGE_ERROR" }, { status: 503, headers });
    }
    if (dailyCount >= DAILY_ANALYSIS_LIMIT) {
      logEvent("warn", "daily_limit.reached", { requestId, userId: authUser.id, dailyCount });
      return Response.json(
        {
          result: `⚠️ You've reached today's limit of ${DAILY_ANALYSIS_LIMIT} analyses. Your limit resets tomorrow.`,
          code: "DAILY_LIMIT_REACHED",
          limited: true,
          saved: false,
          tokenExpired,
        },
        { headers }
      );
    }
  } else {
    const dailyRetryAfter = await checkIpDailyLimit(ip, dailyLimitStore);
    if (dailyRetryAfter !== null) {
      logEvent("warn", "daily_limit.reached", { requestId, ip, anonymous: true });
      return Response.json(
        {
          result: `⚠️ You've reached today's limit of ${DAILY_ANALYSIS_LIMIT} analyses. Your limit resets tomorrow.`,
          code: "DAILY_LIMIT_REACHED",
          limited: true,
        },
        { headers }
      );
    }
  }

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

      const cacheKey = urlCacheKey(url.trim());
      const cached = !authUser && inMemoryCache.get(cacheKey);
      if (cached) {
        return Response.json(cached, { headers });
      }

      let extracted;
      try {
        extracted = (await extractArticleTextFromUrl(url.trim())).text;
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

    // Only for client-supplied text (the extension). In the URL branch above, text
    // came from extractArticleTextFromUrl, which already opens with the <h1> —
    // prepending there would duplicate the headline. hasText is captured before
    // that branch reassigns text, so it still reflects what the client actually sent.
    if (hasText) text = composeAnalysisText(headline, text);

    // The extension sends both text and its source URL. Only URL mode, which
    // actually fetches that page, may use a URL cache entry.
    const cacheKey = hasText ? textCacheKey(text, hasUrl ? url.trim() : "") : urlCacheKey(url.trim());
    const cached = !authUser && inMemoryCache.get(cacheKey);
    if (cached) {
      return Response.json(cached, { headers });
    }

    const verdict = await detectIfArticle(getOpenAI(), text, requestId);
    if (verdict !== "article") {
      const payload = { result: "⚠️ Could not analyze this page. Please open a real article and try again." };
      if (!authUser) inMemoryCache.set(cacheKey, payload);
      return Response.json(payload, { headers });
    }

    if (authUser) {
      try {
        await incrementUserDailyUsage(authedSupabase);
      } catch (error) {
        if (error?.code === "DAILY_LIMIT_REACHED") {
          return Response.json({ result: `⚠️ ${error.message}`, code: error.code, limited: true, saved: false, tokenExpired }, { headers });
        }
        logEvent("error", "daily_usage.reserve_failed", { requestId, userId: authUser.id, message: String(error?.cause?.message || error?.message || error) });
        reportToSentry(error, "DAILY_USAGE_ERROR");
        return Response.json({ error: "Usage is temporarily unavailable.", code: "DAILY_USAGE_ERROR" }, { status: 503, headers });
      }
    }

    const aiResponse = await generateBiasAnalysis(getOpenAI(), text, requestId, hasUrl ? url : null);
    let parsedJson = null;
    try { parsedJson = JSON.parse(aiResponse); } catch { parsedJson = null; }

    const humanResult = buildHumanResult(parsedJson) || aiResponse;
    const contentType = contentTypeFromAiJson(parsedJson);
    const payload = { result: humanResult, contentType };
    if (!authUser) inMemoryCache.set(cacheKey, payload);

    // Save to cloud history and track usage for authenticated users.
    // A failed save must not discard the analysis the user already paid the
    // wait (and we paid the OpenAI cost) for — return the result with saved: false.
    let saved = false;
    if (authUser) {
      try {
        await saveAnalysisToCloud(authedSupabase, authUser.id, parsedJson, hasUrl ? url : null, headline || null);
        saved = true;
      } catch (error) {
        logEvent("error", "save.analysis.nonfatal", { requestId, userId: authUser.id, message: String(error?.message || error) });
        reportToSentry(error, "INTERNAL_ERROR");
      }
    }

    return Response.json({ ...payload, saved, tokenExpired }, { headers });
  } catch (error) {
    const errorCode = error?.code || "INTERNAL_ERROR";
    logEvent("error", "analysis.failure", {
      requestId,
      ip,
      errorCode,
      message: String(error?.message || error),
    });
    reportToSentry(error, errorCode);
    return Response.json({ error: "Error analyzing framing.", code: "INTERNAL_ERROR" }, { status: 500, headers });
  }
}

import { normalizeConfidence, normalizeScore, scoreToDirection } from "./score.js";

const IS_DEV = process.env.NODE_ENV !== "production";

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

class ApiError extends Error {
  constructor(message, { status, code, requestId, endpoint, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status || 0;
    this.code = code || "API_ERROR";
    this.requestId = requestId || "";
    this.endpoint = endpoint || "";
    this.details = details || "";
  }
}

function devLog(message, meta) {
  if (!IS_DEV) return;
  if (meta !== undefined) {
    console.info(`[neutraleye:web] ${message}`, meta);
    return;
  }
  console.info(`[neutraleye:web] ${message}`);
}

function listFromBlock(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function sectionValue(markdown, heading, fallbackHeading) {
  const titles = [heading, fallbackHeading].filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const knownHeadings = [
    "Bias Level",
    "Direction",
    "Summary of Bias",
    "Summary",
    "Examples of Bias",
    "Examples",
    "Suggested Unbiased Sources",
    "Suggested unbiased sources",
    "Recommendations",
    "Recommendations to look up",
    "Analysis Confidence",
    "Confidence level"
  ].map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(
    `(?:^|\\s)\\*\\*(${titles.join("|")})\\*\\*\\s*([\\s\\S]*?)(?=(?:\\s|\\n)\\*\\*(?:${knownHeadings.join("|")})\\*\\*|$)`,
    "i"
  );
  const match = String(markdown || "").match(pattern);
  return match ? match[2].trim() : "";
}

function parseLegacyMarkdown(raw) {
  const markdown = String(raw || "").trim();
  if (!markdown) return {};

  const direction = sectionValue(markdown, "Bias Level", "Direction");
  const summary = sectionValue(markdown, "Summary of Bias", "Summary");
  const examples = listFromBlock(sectionValue(markdown, "Examples of Bias", "Examples")).map((item) => ({
    quote: item,
    label: "Bias signal",
    explanation: "Legacy response item."
  }));
  const sources = listFromBlock(sectionValue(markdown, "Suggested Unbiased Sources", "Suggested unbiased sources"))
    .filter((item) => !/^no verified specific urls available/i.test(item));
  const recommendations = listFromBlock(sectionValue(markdown, "Recommendations", "Recommendations to look up"));

  const confidenceText = sectionValue(markdown, "Analysis Confidence", "Confidence level");
  const match = confidenceText.match(/(\d+(?:\.\d+)?)\s*%?/);
  const confidence = match ? normalizeConfidence(Number(match[1]) > 1 ? Number(match[1]) / 100 : Number(match[1])) : 0.5;

  return {
    directionLabel: direction || undefined,
    confidence,
    score: undefined,
    summary: summary || "",
    drivers: [],
    examples,
    sources,
    recommendations
  };
}

function looksLikeSectionedMarkdown(value) {
  return /\*\*(Bias Level|Summary of Bias|Examples of Bias|Suggested Unbiased Sources|Recommendations|Analysis Confidence)\*\*/i.test(
    String(value || "")
  );
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSource(item) {
  if (typeof item === "string") {
    const value = item.trim();
    return value ? value : null;
  }

  const name = String(item?.name || item?.title || item?.outlet || "").trim();
  const url = String(item?.url || "").trim();
  if (!name && !url) return null;

  return {
    name: name || url,
    url
  };
}

function normalizeExample(item) {
  const quote = String(item?.quote || item || "").trim();
  if (!quote) return null;

  return {
    quote,
    label: String(item?.label || "Evidence").trim() || "Evidence",
    explanation: String(item?.explanation || "Model-detected signal.").trim() || "Model-detected signal.",
    highlights: toArray(item?.highlights).map((value) => String(value).trim()).filter(Boolean)
  };
}

function firstTextBlock(markdown) {
  return String(markdown || "")
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !/^#{1,6}\s/.test(block) && !/^\*\*[^*]+\*\*$/.test(block))
    || "";
}

function compactSummaryFromMixedResult(markdown) {
  const text = String(markdown || "").trim();
  if (!text) return "";
  const fromSection = sectionValue(text, "Summary of Bias", "Summary");
  if (fromSection) return fromSection;

  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\*\*[^*]+\*\*$/.test(line) && !/^[-*]\s+/.test(line))
    .slice(0, 3)
    .join(" ")
    .slice(0, 600);
}

function stringOrFallback(value, fallback) {
  const next = String(value || "").trim();
  return next || fallback;
}

function isGenericDirectionLabel(value) {
  return /^(analysis\s+complete|complete|completed|success|ok)$/i.test(String(value || "").trim());
}

function normalizeResponse(data, inputType, requestMeta = {}) {
  const raw = data || {};
  const sectionedText = looksLikeSectionedMarkdown(raw.summary) ? raw.summary : raw.result;
  const legacy = parseLegacyMarkdown(sectionedText);
  const fallbackSummary = compactSummaryFromMixedResult(sectionedText) || firstTextBlock(sectionedText);

  const score = normalizeScore(raw.score ?? raw.biasScore ?? legacy.score ?? 0);
  const rawDirectionLabel = raw.directionLabel || raw.direction || raw.biasLevel;
  const directionLabel = isGenericDirectionLabel(rawDirectionLabel)
    ? legacy.directionLabel || scoreToDirection(score)
    : rawDirectionLabel || legacy.directionLabel || scoreToDirection(score);
  const createdAt = new Date().toISOString();
  const requestTimestamp = requestMeta.requestStartedAt || createdAt;
  const rawExamples = toArray(raw.examples).length ? raw.examples : legacy.examples;
  const rawSources = toArray(raw.sources).length ? raw.sources : legacy.sources;
  const rawRecommendations = toArray(raw.recommendations).length ? raw.recommendations : legacy.recommendations;
  const normalizedExamples = toArray(rawExamples).map(normalizeExample).filter(Boolean);
  const normalizedSources = toArray(rawSources).map(normalizeSource).filter(Boolean);
  const normalizedRecommendations = toArray(rawRecommendations)
    .map((item) => String(item).trim())
    .filter(Boolean);
  const normalizedDrivers = toArray(raw.drivers).map((item) => String(item).trim()).filter(Boolean).slice(0, 6);

  const normalized = {
    id: randomId(),
    createdAt,
    inputType,
    url: requestMeta.url,
    title: raw.title || requestMeta.title || requestMeta.url,
    direction: String(directionLabel || "Neutral"),
    directionLabel: String(directionLabel || "Neutral"),
    confidence: normalizeConfidence(raw.confidence ?? raw.confidenceValue ?? legacy.confidence ?? 0.5),
    score,
    summary: stringOrFallback(looksLikeSectionedMarkdown(raw.summary) ? legacy.summary : raw.summary || legacy.summary || fallbackSummary, "No summary returned."),
    drivers: normalizedDrivers,
    examples: normalizedExamples,
    sources: normalizedSources,
    recommendations: normalizedRecommendations,
    extractedText: String(raw.extractedText || raw.extracted || ""),
    requestMeta: {
      requestId: String(requestMeta.requestId || ""),
      requestStartedAt: requestTimestamp,
      requestCompletedAt: createdAt,
      status: Number(requestMeta.status || 200),
      endpoint: String(requestMeta.endpoint || "")
    }
  };

  if (!normalized.drivers.length) {
    normalized.drivers = normalized.examples.length
      ? [...new Set(normalized.examples.map((item) => item.label))].slice(0, 6)
      : ["Loaded wording", "Framing", "Source imbalance", "Attribution gaps"];
  }

  return normalized;
}

async function request(endpoint, payload, inputType, requestMeta) {
  const requestId = randomId();
  const requestStartedAt = new Date().toISOString();
  const target = endpoint;
  devLog(`request start ${endpoint}`, { requestId, payload });

  let response;
  const timeoutMs = Number(requestMeta?.timeoutMs || 30000);
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client": "web", "x-request-id": requestId },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (error) {
    globalThis.clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      devLog(`request timeout ${endpoint}`, { requestId, timeoutMs });
      throw new ApiError("Request timed out while contacting the analysis service.", {
        status: 0,
        code: "TIMEOUT",
        requestId,
        endpoint
      });
    }
    devLog(`request network error ${endpoint}`, { requestId, error: String(error?.message || error) });
    throw new ApiError("Network error: could not reach analysis service.", {
      status: 0,
      code: "NETWORK_ERROR",
      requestId,
      endpoint
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  let data = {};
  let rawText = "";
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      rawText = String(await response.text() || "").trim();
    }
  } catch {
    data = {};
  }
  devLog(`request complete ${endpoint}`, { requestId, status: response.status, ok: response.ok, body: data });

  if (!response.ok) {
    const message = String(data?.error || data?.message || rawText || "Analysis request failed.");
    const details = String(data?.details || rawText || "");
    throw new ApiError(message, {
      status: response.status,
      code: String(data?.code || `HTTP_${response.status}`),
      requestId,
      endpoint,
      details
    });
  }

  return normalizeResponse(data, inputType, { ...requestMeta, requestId, requestStartedAt, status: response.status, endpoint });
}

export async function analyzeText(text) {
  return request("/api/analyze", { text }, "text", { timeoutMs: 30000 });
}

export async function analyzeUrl(url) {
  return request("/api/analyze", { url }, "url", { url, timeoutMs: 45000 });
}

export async function analyzeInput({ text, url }) {
  const hasText = typeof text === "string" && text.trim().length > 0;
  const hasUrl = typeof url === "string" && url.trim().length > 0;
  const payload = hasText ? { text: text.trim() } : { url: String(url || "").trim() };
  const inputType = hasText ? "text" : "url";
  const requestMeta = hasUrl ? { url: String(url || "").trim(), timeoutMs: 45000 } : { timeoutMs: 30000 };
  return request("/api/analyze", payload, inputType, requestMeta);
}

export { ApiError, normalizeResponse };

import * as Sentry from "@sentry/nextjs";

// Shared API-route helpers: structured logging, client IP, Sentry reporting.

export function logEvent(level, event, meta = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), event, ...meta });
  if (level === "error") { console.error(line); return; }
  if (level === "warn") { console.warn(line); return; }
  console.info(line);
}

export function getClientIp(request) {
  // Vercel sets x-real-ip to the true connecting IP; a client cannot forge it.
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  // Fall back to the RIGHTMOST x-forwarded-for entry — the hop appended by the
  // trusted proxy. The leftmost entry is client-controlled and spoofable, so
  // using it would let anyone reset their own rate-limit / daily-cap bucket.
  const forwarded = String(request.headers.get("x-forwarded-for") || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwarded.length) return forwarded[forwarded.length - 1];
  return "unknown";
}

// Genuine bugs/operational failures worth alerting on — excludes expected,
// user-driven outcomes (validation, rate limits, "not an article").
const SENTRY_CAPTURE_CODES = new Set(["OPENAI_ERROR", "INTERNAL_ERROR", "URL_EXTRACTION_ERROR"]);

export function reportToSentry(error, errorCode) {
  if (error?._sentryReported) return;
  if (SENTRY_CAPTURE_CODES.has(errorCode)) {
    Sentry.captureException(error);
  }
  if (error && typeof error === "object") error._sentryReported = true;
}

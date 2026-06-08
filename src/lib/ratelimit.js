import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const limiters = new Map();

function getWindowSecs(windowMs) {
  return Math.max(1, Math.round(Number(windowMs) / 1000));
}

export function getRatelimiter({ prefix, max, windowMs }) {
  const key = `${prefix}:${max}:${windowMs}`;
  if (limiters.has(key)) return limiters.get(key);

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    limiters.set(key, null);
    return null;
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(Number(max), `${getWindowSecs(windowMs)} s`),
    prefix,
  });

  limiters.set(key, limiter);
  return limiter;
}

export async function checkRedisRateLimit(ip, { prefix, max, windowMs, fallbackStore }) {
  const limiter = getRatelimiter({ prefix, max, windowMs });

  if (limiter) {
    const { success, reset } = await limiter.limit(ip);
    if (!success) return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return null;
  }

  // In-memory fallback for local dev (no Upstash env vars set)
  const now = Date.now();
  const bucket = fallbackStore.get(ip);
  if (!bucket || now > bucket.resetAt) {
    fallbackStore.set(ip, { count: 1, resetAt: now + Number(windowMs) });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > Number(max)) {
    return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  }
  return null;
}

import { checkRedisRateLimit } from "./ratelimit";

// Shared daily analysis cap. Signed-in users are counted per account via the
// daily_usage table; anonymous users are counted per IP over a rolling 24h
// window in Upstash (prefix ne:day).
export const DAILY_ANALYSIS_LIMIT = Number(process.env.DAILY_ANALYSIS_LIMIT || 10);

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns retry-after seconds when the anonymous IP cap is exceeded, else null.
// Note: this consumes one unit per call, so only call it once per request.
export async function checkIpDailyLimit(ip, fallbackStore) {
  return checkRedisRateLimit(ip, {
    prefix: "ne:day",
    max: DAILY_ANALYSIS_LIMIT,
    windowMs: DAY_MS,
    fallbackStore,
  });
}

// Current calendar-day (UTC) usage count for a signed-in user.
export async function getUserDailyCount(supabase, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();
  if (error) throw error;
  return data?.count ?? 0;
}

export async function incrementUserDailyUsage(supabase) {
  const { data, error } = await supabase.rpc("increment_daily_usage");
  if (error) throw error;
  return data;
}

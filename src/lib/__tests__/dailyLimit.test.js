// dailyLimit imports ratelimit, which imports @upstash/redis (ESM-only
// transitive dep Jest won't parse). Stub the Upstash modules; the fallback
// path used here never constructs them.
jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: class {} }));

// Minimal chainable stand-in for the read-only usage query.
function makeSupabaseMock({ existing, error = null }) {
  const builder = {
    from: () => builder,
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => ({ data: existing ?? null, error }),
  };
  return builder;
}

describe("checkIpDailyLimit", () => {
  let checkIpDailyLimit;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.DAILY_ANALYSIS_LIMIT = "2";
    ({ checkIpDailyLimit } = require("@/lib/dailyLimit"));
  });

  test("caps an anonymous IP at DAILY_ANALYSIS_LIMIT", async () => {
    const store = new Map();
    expect(await checkIpDailyLimit("9.9.9.9", store)).toBeNull();
    expect(await checkIpDailyLimit("9.9.9.9", store)).toBeNull();
    expect(await checkIpDailyLimit("9.9.9.9", store)).not.toBeNull();
  });
});

describe("getUserDailyCount", () => {
  beforeEach(() => jest.resetModules());

  test("returns the stored count when a row exists", async () => {
    const { getUserDailyCount } = require("@/lib/dailyLimit");
    const supabase = makeSupabaseMock({ existing: { count: 5 } });
    expect(await getUserDailyCount(supabase, "u1")).toBe(5);
  });

  test("returns 0 when no row exists", async () => {
    const { getUserDailyCount } = require("@/lib/dailyLimit");
    const supabase = makeSupabaseMock({ existing: null });
    expect(await getUserDailyCount(supabase, "u1")).toBe(0);
  });

  test("fails closed when the usage query fails", async () => {
    const { getUserDailyCount } = require("@/lib/dailyLimit");
    const error = new Error("database unavailable");
    await expect(getUserDailyCount(makeSupabaseMock({ existing: null, error }), "u1")).rejects.toThrow(error);
  });
});

describe("incrementUserDailyUsage", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.DAILY_ANALYSIS_LIMIT = "10";
  });

  test("uses the atomic account-scoped RPC", async () => {
    const { incrementUserDailyUsage } = require("@/lib/dailyLimit");
    const supabase = { rpc: jest.fn().mockResolvedValue({ data: 5, error: null }) };
    expect(await incrementUserDailyUsage(supabase)).toBe(5);
    expect(supabase.rpc).toHaveBeenCalledWith("increment_daily_usage", { p_limit: 10 });
  });

  test("surfaces accounting failures", async () => {
    const { incrementUserDailyUsage } = require("@/lib/dailyLimit");
    const error = new Error("RPC unavailable");
    const supabase = { rpc: jest.fn().mockResolvedValue({ data: null, error }) };
    await expect(incrementUserDailyUsage(supabase)).rejects.toMatchObject({ code: "DAILY_USAGE_ERROR", status: 503 });
  });

  test("maps an atomic reservation refusal to the daily limit response", async () => {
    const { incrementUserDailyUsage } = require("@/lib/dailyLimit");
    const supabase = { rpc: jest.fn().mockResolvedValue({ data: null, error: { code: "P4290" } }) };
    await expect(incrementUserDailyUsage(supabase)).rejects.toMatchObject({ code: "DAILY_LIMIT_REACHED", status: 429 });
  });
});

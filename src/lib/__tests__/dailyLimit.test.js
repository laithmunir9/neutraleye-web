// dailyLimit imports ratelimit, which imports @upstash/redis (ESM-only
// transitive dep Jest won't parse). Stub the Upstash modules; the fallback
// path used here never constructs them.
jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: class {} }));

// Minimal chainable stand-in for the Supabase client. Every builder method
// returns the builder; maybeSingle() resolves to { data }; update()/insert()
// record their payloads. The builder is thenable so `await ...eq().eq()` and
// `await ...insert()` resolve like a real query.
function makeSupabaseMock({ existing }) {
  const calls = { updates: [], inserts: [] };
  const builder = {
    from: () => builder,
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => ({ data: existing ?? null }),
    update: (payload) => { calls.updates.push(payload); return builder; },
    insert: (payload) => { calls.inserts.push(payload); return builder; },
    then: (resolve) => resolve({ data: null, error: null }),
  };
  return { supabase: builder, calls };
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
    const { supabase } = makeSupabaseMock({ existing: { count: 5 } });
    expect(await getUserDailyCount(supabase, "u1")).toBe(5);
  });

  test("returns 0 when no row exists", async () => {
    const { getUserDailyCount } = require("@/lib/dailyLimit");
    const { supabase } = makeSupabaseMock({ existing: null });
    expect(await getUserDailyCount(supabase, "u1")).toBe(0);
  });
});

describe("incrementUserDailyUsage", () => {
  beforeEach(() => jest.resetModules());

  test("increments an existing row by one", async () => {
    const { incrementUserDailyUsage } = require("@/lib/dailyLimit");
    const { supabase, calls } = makeSupabaseMock({ existing: { count: 4 } });
    await incrementUserDailyUsage(supabase, "u1");
    expect(calls.updates).toEqual([{ count: 5 }]);
    expect(calls.inserts).toHaveLength(0);
  });

  test("inserts a new row with count 1 when none exists", async () => {
    const { incrementUserDailyUsage } = require("@/lib/dailyLimit");
    const { supabase, calls } = makeSupabaseMock({ existing: null });
    await incrementUserDailyUsage(supabase, "u1");
    expect(calls.inserts).toHaveLength(1);
    expect(calls.inserts[0]).toMatchObject({ user_id: "u1", count: 1 });
    expect(calls.updates).toHaveLength(0);
  });
});

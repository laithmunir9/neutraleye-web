// @upstash/redis ships an ESM-only transitive dep Jest won't parse; stub both
// Upstash modules so the import resolves. They're never instantiated here — the
// fallback path returns before any Redis/Ratelimit is constructed.
jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: class {} }));

// Exercises the in-memory fallback path — the branch that runs when Upstash env
// vars are absent (local dev). The Upstash-backed path is a thin adapter over
// @upstash/ratelimit and is intentionally left to that library's own tests.
describe("checkRedisRateLimit (in-memory fallback)", () => {
  let checkRedisRateLimit;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    ({ checkRedisRateLimit } = require("@/lib/ratelimit"));
  });

  test("allows requests up to the max, then blocks with a retry-after", async () => {
    const store = new Map();
    const opts = { prefix: "test", max: 3, windowMs: 60_000, fallbackStore: store };
    expect(await checkRedisRateLimit("1.1.1.1", opts)).toBeNull();
    expect(await checkRedisRateLimit("1.1.1.1", opts)).toBeNull();
    expect(await checkRedisRateLimit("1.1.1.1", opts)).toBeNull();
    const retry = await checkRedisRateLimit("1.1.1.1", opts);
    expect(typeof retry).toBe("number");
    expect(retry).toBeGreaterThan(0);
  });

  test("tracks a separate bucket per IP", async () => {
    const store = new Map();
    const opts = { prefix: "test", max: 1, windowMs: 60_000, fallbackStore: store };
    expect(await checkRedisRateLimit("1.1.1.1", opts)).toBeNull();
    expect(await checkRedisRateLimit("2.2.2.2", opts)).toBeNull();
    expect(await checkRedisRateLimit("1.1.1.1", opts)).not.toBeNull();
  });

  test("resets the bucket once the window has elapsed", async () => {
    const store = new Map();
    const opts = { prefix: "test", max: 1, windowMs: 60_000, fallbackStore: store };
    expect(await checkRedisRateLimit("1.1.1.1", opts)).toBeNull();
    expect(await checkRedisRateLimit("1.1.1.1", opts)).not.toBeNull();
    // Force the window into the past so the next call starts a fresh bucket.
    store.get("1.1.1.1").resetAt = Date.now() - 1;
    expect(await checkRedisRateLimit("1.1.1.1", opts)).toBeNull();
  });
});

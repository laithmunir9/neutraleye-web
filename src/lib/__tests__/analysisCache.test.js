import { createAnalysisCache, textCacheKey, urlCacheKey } from "@/lib/analysisCache";

test("a shared 500-character prefix does not share a text result", () => {
  const prefix = "article ".repeat(63);
  const first = textCacheKey(`${prefix}private ending A`);
  const second = textCacheKey(`${prefix}private ending B`);
  expect(first).not.toBe(second);

  const cache = createAnalysisCache();
  cache.set(first, { extractedText: `${prefix}private ending A` });
  expect(cache.get(second)).toBeNull();
});

test("text submitted with a URL cannot populate the fetched URL cache key", () => {
  const source = "https://example.com/article";
  expect(textCacheKey("attacker text", source)).not.toBe(urlCacheKey(source));
});

test("cache entries expire and the oldest entry is evicted at capacity", () => {
  jest.useFakeTimers();
  try {
    const cache = createAnalysisCache();
    for (let index = 0; index <= 100; index++) cache.set(`key:${index}`, index);
    expect(cache.get("key:0")).toBeNull();
    expect(cache.get("key:100")).toBe(100);
    jest.advanceTimersByTime(10 * 60 * 1000);
    expect(cache.get("key:100")).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

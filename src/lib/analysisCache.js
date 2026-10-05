import { createHash } from "node:crypto";

const MAX_ENTRIES = 100;
const TTL_MS = 10 * 60 * 1000;

export function textCacheKey(text, sourceUrl = "") {
  const digest = createHash("sha256")
    .update(sourceUrl)
    .update("\0")
    .update(text)
    .digest("hex");
  return `text:${digest}`;
}

export function urlCacheKey(url) {
  return `url:${new URL(url).toString()}`;
}

export function createAnalysisCache() {
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return null;
      }
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
      entries.set(key, { value, expiresAt: Date.now() + TTL_MS });
    },
  };
}

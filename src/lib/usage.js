const DAILY_LIMIT = 10;
const KEY = "neutraleye.usage.v1";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (stored.date !== todayStr()) return { date: todayStr(), count: 0 };
    return stored;
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

function writeStore(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export function checkLocalLimit() {
  const { count } = readStore();
  return { count, remaining: Math.max(0, DAILY_LIMIT - count), limited: count >= DAILY_LIMIT };
}

export function incrementLocalUsage() {
  const current = readStore();
  const updated = { date: todayStr(), count: current.count + 1 };
  writeStore(updated);
  return { count: updated.count, remaining: Math.max(0, DAILY_LIMIT - updated.count), limited: updated.count >= DAILY_LIMIT };
}

export { DAILY_LIMIT };

import { ANALYSIS_STORAGE_KEY } from "./types";
import { saveAnalysisToSupabase } from "./supabase/analyses";

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function hasWindow() {
  return typeof window !== "undefined";
}

function readAll() {
  if (!hasWindow()) return [];
  const parsed = safeParse(window.localStorage.getItem(ANALYSIS_STORAGE_KEY) || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

function writeAll(items) {
  if (!hasWindow()) return;
  window.localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(items));
}

export function saveAnalysis(record, user = null) {
  const items = readAll();
  const next = [record, ...items.filter((item) => item.id !== record.id)].slice(0, 200);
  writeAll(next);

  if (user?.id) {
    const tagged = { ...record, requestMeta: { ...(record.requestMeta || {}), source: "website" } };
    saveAnalysisToSupabase(tagged, user.id).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[neutraleye] supabase save failed", err);
      }
    });
  }

  return record;
}

export function listAnalyses() {
  return readAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAnalysis(id) {
  return readAll().find((item) => item.id === id) || null;
}

export function deleteAnalysis(id) {
  const items = readAll().filter((item) => item.id !== id);
  writeAll(items);
}

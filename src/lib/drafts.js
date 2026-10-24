import * as Sentry from "@sentry/nextjs";

/*
 * Write mode drafts: the kinds a draft can be held to, the rail's status line,
 * and the reads and writes. Every call takes the caller's Supabase client, so
 * it runs as the signed-in user and RLS decides what they can touch.
 *
 * Draft text never goes to Sentry or the console. Errors are reported by
 * action and Postgres code only.
 */

export const KINDS = [
  {
    id: "essay",
    label: "Essay",
    standard:
      "Essay: you can hold a view, but the reasoning should carry it. Flags claims stated as fact without support, and framing that leaves out the other side.",
  },
  {
    id: "opinion",
    label: "Opinion",
    standard:
      "Opinion: taking a side is the point. Flags claims stated as fact without support, and wording that does the arguing for you.",
  },
  {
    id: "news",
    label: "News",
    standard:
      "News: the reader expects the facts, not your view. Flags wording that takes a side, claims without a source, and missing context.",
  },
];

export function kindOf(id) {
  return KINDS.find((kind) => kind.id === id) || KINDS[0];
}

export const TARGET_SUGGESTIONS = [
  "The Economist, news analysis",
  "A New York Times op-ed",
  "An Atlantic feature",
  "A wire reporter",
];

// The columns the rail and the dashboard need. Content is fetched on its own,
// only for the draft that is open.
export const DRAFT_LIST_COLUMNS =
  "id, title, kind, target, topic, word_count, last_review, last_reviewed_at, created_at, updated_at";

export function countWords(text) {
  const trimmed = String(text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// What the writer sees for each finding label the review returns.
export const FINDING_LABEL_TEXT = {
  loaded_wording: "Loaded wording",
  needs_source: "Needs a source",
  one_sided: "One-sided",
  missing_context: "Missing context",
};

// A note in the status line is one finding; target notes are not counted.
export function notesCount(review) {
  return Array.isArray(review?.findings) ? review.findings.length : 0;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function checkedWhen(date, now) {
  if (sameDay(date, now)) return "today";
  const options = { month: "short", day: "numeric" };
  if (date.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return date.toLocaleDateString("en-US", options);
}

/** "Opinion · Checked today · 4 notes", or "Essay · Not checked yet". */
export function draftStatusLine(draft, now = new Date()) {
  const parts = [kindOf(draft.kind).label];
  if (!draft.last_reviewed_at) {
    parts.push("Not checked yet");
  } else {
    parts.push(`Checked ${checkedWhen(new Date(draft.last_reviewed_at), now)}`);
    const notes = notesCount(draft.last_review);
    parts.push(`${notes} ${notes === 1 ? "note" : "notes"}`);
  }
  return parts.join(" · ");
}

export function reportDraftError(error, action) {
  Sentry.captureException(new Error(`Draft ${action} failed`), {
    tags: { area: "write", draft_action: action, code: error?.code || "unknown" },
  });
}

export async function createDraft(supabase, { title, kind, target, topic }) {
  return supabase
    .from("drafts")
    .insert({
      title: title.trim() || "Untitled",
      kind,
      target: target.trim() || null,
      topic: topic.trim() || null,
    })
    .select(DRAFT_LIST_COLUMNS)
    .single();
}

export async function loadDraftContent(supabase, id) {
  return supabase.from("drafts").select("content").eq("id", id).single();
}

/** Saves `patch` and returns the row's new updated_at, for the rail's order. */
export async function updateDraft(supabase, id, patch) {
  return supabase.from("drafts").update(patch).eq("id", id).select("updated_at").single();
}

/** Runs "Check framing" on a saved draft. Returns { data } or { error: message }. */
export async function requestReview(draftId) {
  let response;
  try {
    response = await fetch("/api/write/review", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client": "web" },
      body: JSON.stringify({ draftId }),
    });
  } catch {
    return { error: "The check could not reach NeutralEye. Check your connection and try again." };
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.review) {
    return { error: data?.error || "The check could not be finished. Try again." };
  }
  return { data };
}

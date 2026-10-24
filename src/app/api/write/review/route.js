import OpenAI from "openai";
import { randomUUID } from "crypto";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { DAILY_ANALYSIS_LIMIT, getUserDailyCount, incrementUserDailyUsage } from "@/lib/dailyLimit";
import { createClient } from "@/lib/supabase/server";
import { logEvent, getClientIp, reportToSentry } from "@/lib/apiLog";
import { generateDraftReview } from "@/lib/draftReview";

// Vercel: allow up to 60s for the OpenAI call, as /api/analyze does.
export const maxDuration = 60;

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_WEBSITE_API_KEY || process.env.OPENAI_API_KEY });
  return _openai;
}

const AI_ANALYSIS_ENABLED = !["0", "false", "no", "off"].includes(
  String(process.env.AI_ANALYSIS_ENABLED || "true").toLowerCase()
);
const KILL_SWITCH = ["1", "true", "yes", "on"].includes(
  String(process.env.NEUTRALEYE_KILL_SWITCH || "").toLowerCase()
);
// The same per-minute bucket as /api/analyze, so Read and Write share it.
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 5);
const MIN_DRAFT_WORDS = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OWN_ERROR_CODES = new Set(["DAILY_LIMIT_REACHED", "DAILY_USAGE_ERROR", "REVIEW_UNPARSEABLE"]);

const rateLimitStore = new Map();

function errResponse(status, error, code) {
  return Response.json({ error, code }, { status });
}

/*
 * POST { draftId }: checks the framing of one of the signed-in user's drafts.
 * The draft is read and the result written through the user's own session,
 * so RLS decides what they can touch. One check counts against the same
 * daily limit as Read. Draft text is never logged.
 */
export async function POST(request) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const ip = getClientIp(request);

  if (!AI_ANALYSIS_ENABLED || KILL_SWITCH) {
    logEvent("warn", "analysis.unavailable", { requestId, route: "write.review" });
    return errResponse(503, "Checking is temporarily unavailable.", "AI_DISABLED");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errResponse(401, "Sign in to check a draft.", "UNAUTHENTICATED");

  const retryAfter = await checkRedisRateLimit(ip, {
    prefix: "ne:web",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    fallbackStore: rateLimitStore,
  });
  if (retryAfter !== null) {
    logEvent("warn", "rate_limit.exceeded", { requestId, ip, retryAfter, route: "write.review" });
    return Response.json(
      { error: "Too many checks at once. Try again in a minute.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errResponse(400, "Request body must be valid JSON.", "INVALID_BODY");
  }
  const draftId = body?.draftId;
  if (typeof draftId !== "string" || !UUID.test(draftId)) {
    return errResponse(400, "Missing or invalid draftId.", "VALIDATION_ERROR");
  }

  try {
    const dailyCount = await getUserDailyCount(supabase, user.id);
    if (dailyCount >= DAILY_ANALYSIS_LIMIT) {
      logEvent("warn", "daily_limit.reached", { requestId, userId: user.id, dailyCount, route: "write.review" });
      return errResponse(
        429,
        `You've reached today's limit of ${DAILY_ANALYSIS_LIMIT} checks. Your limit resets tomorrow.`,
        "DAILY_LIMIT_REACHED"
      );
    }
  } catch (error) {
    reportToSentry(error, "DAILY_USAGE_ERROR");
    return errResponse(503, "Usage is temporarily unavailable.", "DAILY_USAGE_ERROR");
  }

  const { data: draft, error: loadError } = await supabase
    .from("drafts")
    .select("id, kind, target, topic, content_text, word_count")
    .eq("id", draftId)
    .maybeSingle();
  if (loadError) {
    logEvent("error", "write.review.load_failed", { requestId, code: loadError.code });
    return errResponse(500, "This draft could not be loaded.", "DRAFT_LOAD_FAILED");
  }
  // Someone else's draft reads the same as a missing one: RLS returns no row.
  if (!draft) return errResponse(404, "Draft not found.", "DRAFT_NOT_FOUND");

  const text = draft.content_text || "";
  if (draft.word_count < MIN_DRAFT_WORDS || !text.trim()) {
    return errResponse(422, `Write at least ${MIN_DRAFT_WORDS} words before checking.`, "DRAFT_TOO_SHORT");
  }

  try {
    await incrementUserDailyUsage(supabase);
    logEvent("info", "write.review.start", { requestId, draftId, kind: draft.kind, words: draft.word_count });
    const review = await generateDraftReview(
      getOpenAI(),
      { text, kind: draft.kind, target: draft.target, topic: draft.topic },
      requestId
    );
    const stored = { ...review, kind: draft.kind, target: draft.target || null };
    const reviewedAt = new Date().toISOString();

    const { data: saved, error: saveError } = await supabase
      .from("drafts")
      .update({ last_review: stored, last_reviewed_at: reviewedAt })
      .eq("id", draft.id)
      .select("updated_at")
      .single();
    if (saveError) {
      // The writer still sees the review; only the rail's status line misses it.
      logEvent("error", "write.review.save_failed", { requestId, code: saveError.code });
    }
    logEvent("info", "write.review.end", { requestId, findings: review.findings.length, notes: review.target_notes.length });

    return Response.json({
      review: stored,
      last_reviewed_at: saveError ? null : reviewedAt,
      updated_at: saved?.updated_at || null,
    });
  } catch (error) {
    const errorCode = error?.code || "INTERNAL_ERROR";
    logEvent("error", "write.review.failure", { requestId, errorCode });
    if (errorCode !== "DAILY_LIMIT_REACHED") reportToSentry(error, errorCode === "REVIEW_UNPARSEABLE" ? "OPENAI_ERROR" : errorCode);
    // Only this app's own errors carry their message to the writer; an
    // OpenAI SDK error has a status and code too, but its message is not ours.
    if (OWN_ERROR_CODES.has(errorCode)) return errResponse(error.status, error.message, errorCode);
    return errResponse(500, "The check could not be finished. Try again.", "INTERNAL_ERROR");
  }
}

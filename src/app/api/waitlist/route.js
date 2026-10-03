import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/apiLog";

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 5);

const WAITLIST_SOURCES = new Set(["write"]);

// In-memory store — reset on cold start (acceptable for serverless)
const rateLimitStore = new Map();

function logEvent(level, event, meta = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), event, ...meta });
  if (level === "error") { console.error(line); return; }
  console.info(line);
}

export async function POST(req) {
  const ip = getClientIp(req);
  const retryAfter = await checkRedisRateLimit(ip, {
    prefix: "ne:waitlist",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    fallbackStore: rateLimitStore,
  });
  if (retryAfter !== null) {
    logEvent("info", "rate_limit.exceeded", { ip, route: "waitlist", retryAfter });
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, source } = body;
  // Allowlisted rather than passed through, so a caller cannot invent sources.
  const p_source = WAITLIST_SOURCES.has(source) ? source : null;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = await createClient();

  // Inserts go through the join_waitlist RPC (SECURITY DEFINER) rather than a
  // direct table insert — the table has no anon INSERT policy anymore. The
  // function itself de-dupes via ON CONFLICT DO NOTHING, so a repeat email is
  // just a normal success, not an error to catch here.
  const { error } = await supabase.rpc("join_waitlist", {
    p_email: email.trim().toLowerCase(),
    p_source,
  });

  if (error) {
    logEvent("error", "waitlist.insert.error", { error: error.message });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  logEvent("info", "waitlist.joined", { email: email.trim().toLowerCase(), source: p_source });
  return NextResponse.json({ ok: true });
}

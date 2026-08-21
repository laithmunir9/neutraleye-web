import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { getClientIp, logEvent } from "@/lib/apiLog";
import {
  AUTH_UNAVAILABLE_MESSAGE,
  isAuthTransportError,
  reportAuthError,
  safeAuthCall,
} from "@/lib/supabase/authErrors";

const RATE_LIMIT_WINDOW_MS = Number(process.env.EXT_RATE_LIMIT_WINDOW_MS || process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.EXT_RATE_LIMIT_MAX || process.env.RATE_LIMIT_MAX || 5);

// In-memory store — reset on cold start (acceptable for serverless)
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  return checkRedisRateLimit(ip, {
    prefix: "ne:ext-auth",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    fallbackStore: rateLimitStore,
  });
}

function makeSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = origin.startsWith("chrome-extension://") ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request) {
  const headers = corsHeaders(request);
  const ip = getClientIp(request);

  const retryAfter = await checkRateLimit(ip);
  if (retryAfter !== null) {
    logEvent("warn", "rate_limit.exceeded", { ip, route: "extension-auth", retryAfter });
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly.", code: "RATE_LIMITED" },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400, headers });
  }

  const supabase = makeSupabase();
  const { data, error } = await safeAuthCall("extension_signin", () =>
    supabase.auth.signInWithPassword({ email, password })
  );

  // An unreachable auth service is not a wrong password. Saying so sends users to
  // reset a password that was never the problem, and hides the outage from us.
  if (isAuthTransportError(error)) {
    reportAuthError(error, "extension_signin", { route: "extension-auth" });
    logEvent("error", "auth.transport_failure", { route: "extension-auth", ip });
    return NextResponse.json(
      { error: AUTH_UNAVAILABLE_MESSAGE, code: "AUTH_UNAVAILABLE" },
      { status: 503, headers }
    );
  }

  if (error || !data?.session) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401, headers }
    );
  }

  return NextResponse.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    email: data.user.email,
    expiresAt: data.session.expires_at,
  }, { headers });
}

export async function DELETE(request) {
  return NextResponse.json({ success: true }, { headers: corsHeaders(request) });
}

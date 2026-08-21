import { createServerClient } from "@supabase/ssr";
import { logEvent } from "@/lib/apiLog";
import {
  AUTH_UNAVAILABLE_MESSAGE,
  isAuthTransportError,
  reportAuthError,
  safeAuthCall,
} from "@/lib/supabase/authErrors";

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request) {
  const headers = corsHeaders(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400, headers });
  }

  const { refreshToken } = body;
  if (!refreshToken) {
    return Response.json({ error: "Refresh token required." }, { status: 400, headers });
  }

  const supabase = makeSupabase();
  const { data, error } = await safeAuthCall("token_refresh", () =>
    supabase.auth.refreshSession({ refresh_token: refreshToken })
  );

  // Returning 401 here would tell the extension to discard a perfectly valid refresh
  // token and force a re-login, purely because our backend was unreachable. 503 says
  // "try again later" instead of destroying the session.
  if (isAuthTransportError(error)) {
    reportAuthError(error, "token_refresh", { route: "extension-refresh" });
    logEvent("error", "auth.transport_failure", { route: "extension-refresh" });
    return Response.json(
      { error: AUTH_UNAVAILABLE_MESSAGE, code: "AUTH_UNAVAILABLE" },
      { status: 503, headers }
    );
  }

  if (error || !data?.session) {
    return Response.json({ error: "Session expired. Please sign in again." }, { status: 401, headers });
  }

  return Response.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    email: data.user.email,
    expiresAt: data.session.expires_at,
  }, { headers });
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
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

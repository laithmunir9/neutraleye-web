import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function logEvent(level, event, meta = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), event, ...meta });
  if (level === "error") { console.error(line); return; }
  console.info(line);
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("waitlist")
    .insert({ email: email.trim().toLowerCase() });

  if (error) {
    // Unique violation — already on the list, treat as success
    if (error.code === "23505") {
      logEvent("info", "waitlist.duplicate", { email: email.trim().toLowerCase() });
      return NextResponse.json({ ok: true });
    }
    logEvent("error", "waitlist.insert.error", { error: error.message });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  logEvent("info", "waitlist.joined", { email: email.trim().toLowerCase() });
  return NextResponse.json({ ok: true });
}

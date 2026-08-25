import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/apiLog";

// Prevents the Supabase free-tier project from auto-pausing after 7 days of
// inactivity. Runs one trivial read — the response contents don't matter,
// only that a query reaches the database.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("waitlist").select("id").limit(1);
    if (error) throw error;

    const timestamp = new Date().toISOString();
    logEvent("info", "keepalive.success", { timestamp });
    return NextResponse.json({ ok: true, timestamp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logEvent("error", "keepalive.failure", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

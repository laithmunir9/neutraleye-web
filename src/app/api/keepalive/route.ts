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
    // public.keepalive() reads no tables and returns now(). The previous query
    // was `select id from waitlist limit 1`, which anon has never had permission
    // to run, so this cron has been failing since it was added. Fixing it by
    // granting anon SELECT on waitlist would have published signup emails to
    // anyone holding the public key; a function that touches nothing keeps the
    // project awake without widening access to anything.
    const { error } = await supabase.rpc("keepalive");
    if (error) throw error;

    const timestamp = new Date().toISOString();
    logEvent("info", "keepalive.success", { timestamp });
    return NextResponse.json({ ok: true, timestamp });
  } catch (err) {
    // Supabase hands back a plain PostgrestError object, not an Error instance,
    // so `err instanceof Error` was false on exactly the failure this route
    // exists to catch and every real fault logged as "Unknown error". A
    // keepalive that cannot say why it failed is a keepalive nobody can fix.
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null
          ? [
              (err as { message?: string }).message,
              (err as { code?: string }).code && `code ${(err as { code?: string }).code}`,
              (err as { hint?: string }).hint,
            ]
              .filter(Boolean)
              .join(", ") || JSON.stringify(err)
          : String(err);

    logEvent("error", "keepalive.failure", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

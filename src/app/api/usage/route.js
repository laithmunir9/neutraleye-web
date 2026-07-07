import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DAILY_ANALYSIS_LIMIT } from "@/lib/dailyLimit";

function usagePayload(count) {
  return {
    count,
    remaining: Math.max(0, DAILY_ANALYSIS_LIMIT - count),
    limited: count >= DAILY_ANALYSIS_LIMIT,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ count: 0, remaining: null, limited: false });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  const count = data?.count ?? 0;
  return NextResponse.json(usagePayload(count));
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  let newCount;
  if (existing) {
    newCount = existing.count + 1;
    await supabase
      .from("daily_usage")
      .update({ count: newCount })
      .eq("user_id", user.id)
      .eq("usage_date", today);
  } else {
    newCount = 1;
    await supabase
      .from("daily_usage")
      .insert({ user_id: user.id, usage_date: today, count: 1 });
  }

  return NextResponse.json(usagePayload(newCount));
}

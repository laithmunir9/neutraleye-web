import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DAILY_ANALYSIS_LIMIT, getUserDailyCount } from "@/lib/dailyLimit";

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

  try {
    const count = await getUserDailyCount(supabase, user.id);
    return NextResponse.json(usagePayload(count));
  } catch {
    return NextResponse.json({ error: "Usage is temporarily unavailable." }, { status: 503 });
  }
}

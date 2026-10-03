import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { reportAuthError, safeAuthCall } from "@/lib/supabase/authErrors";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await safeAuthCall("code_exchange", () =>
      supabase.auth.exchangeCodeForSession(code)
    );
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Otherwise a confirmation link that failed only because the backend was down
    // is indistinguishable from an expired or tampered link.
    reportAuthError(error, "code_exchange", { route: "auth-callback" });
  }

  return NextResponse.redirect(`${origin}/?auth=signin&notice=auth_failed`);
}

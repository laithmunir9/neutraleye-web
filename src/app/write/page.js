import { redirect } from "next/navigation";
import SiteShell from "@/components/SiteShell/SiteShell";
import WriteDashboard from "@/components/Write/WriteDashboard";
import { createClient } from "@/lib/supabase/server";
import { DRAFT_LIST_COLUMNS } from "@/lib/drafts";
import { logEvent } from "@/lib/apiLog";

export const metadata = {
  title: "Write | NeutralEye",
  robots: { index: false },
};

/* The writing dashboard, behind sign-in. Checked on the server so a
   signed-out visitor never sees it, only the sign-in overlay on the homepage.
   The draft list is read with the visitor's own session, so RLS limits it to
   their rows. Content is not fetched here; the open draft loads its own. */
export default async function WritePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/?auth=signin");

  const { data: drafts, error } = await supabase
    .from("drafts")
    .select(DRAFT_LIST_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) logEvent("error", "write.drafts.list_failed", { code: error.code });

  return (
    <SiteShell app>
      <WriteDashboard initialDrafts={drafts ?? []} loadError={Boolean(error)} />
    </SiteShell>
  );
}

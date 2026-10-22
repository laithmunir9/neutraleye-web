import { redirect } from "next/navigation";
import SiteShell from "@/components/SiteShell/SiteShell";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata = {
  title: "Write | NeutralEye",
  robots: { index: false },
};

/* Placeholder for the writing dashboard, behind sign-in. Checked on the
   server so a signed-out visitor never sees the page, only the sign-in
   overlay on the homepage. */
export default async function WritePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/?auth=signin");

  return (
    <SiteShell>
      <main className={styles.placeholder}>
        <p>Dashboard coming next</p>
      </main>
    </SiteShell>
  );
}

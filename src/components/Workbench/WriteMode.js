"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/AuthProvider";
import AuthDialog from "@/components/AuthDialog/AuthDialog";
import styles from "./Workbench.module.css";

const DASHBOARD = "/write";

/*
 * The Write tab is a door, not a tool: the prompt line above it is the whole
 * pitch, and the one button leads to the dashboard. Signed-out readers get the
 * sign-in overlay instead, worded for where it leads, and land on the
 * dashboard once they are in. While the session is still loading the button
 * goes straight to /write, which sends signed-out visitors back to sign in.
 */
export default function WriteMode() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  function handleClick() {
    if (user || loading) router.push(DASHBOARD);
    else setAuthOpen(true);
  }

  return (
    <div className={styles.writeEntry}>
      <button type="button" className={styles.primary} onClick={handleClick}>
        Take me to dashboard
      </button>
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="signin"
        next={DASHBOARD}
        subtitle="Sign in to open your writing dashboard."
      />
    </div>
  );
}

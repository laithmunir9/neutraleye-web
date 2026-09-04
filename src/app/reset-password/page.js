"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { createClient } from "@/lib/supabase/client";
import { reportAuthError, safeAuthCall } from "@/lib/supabase/authErrors";
import shell from "../marketing.module.css";
import form from "@/components/AuthDialog/AuthDialog.module.css";
import styles from "../login/page.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // A transport failure here must not look like "no recovery session" — that would
    // bounce the user back to /login mid-reset with no explanation.
    safeAuthCall("get_session", () => supabase.auth.getSession()).then(({ data, error }) => {
      if (error) {
        setError(reportAuthError(error, "get_session"));
        setReady(true);
        return;
      }
      if (!data?.session) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await safeAuthCall("password_update", () =>
      supabase.auth.updateUser({ password })
    );
    if (authError) {
      setError(reportAuthError(authError, "password_update"));
      setLoading(false);
    } else {
      router.push("/login?reset=success");
    }
  }

  if (!ready) return null;

  return (
    <MarketingShell>
      <main className={shell.page}>
        <section className={styles.wrap}>
          <h1 className={styles.title}>Set a new password</h1>
          <p className={styles.blurb}>
            Choose a new password for your account. It needs to be at least eight characters.
          </p>

          {error && <p className={form.error}>{error}</p>}

          <form className={form.form} onSubmit={handleSubmit}>
            <label className={form.field}>
              <span className={form.label}>New password</span>
              <input
                name="password"
                type="password"
                className={form.input}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label className={form.field}>
              <span className={form.label}>Confirm new password</span>
              <input
                name="confirm"
                type="password"
                className={form.input}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <button type="submit" className={form.submit} disabled={loading}>
              {loading ? "Working" : "Update password"}
            </button>
          </form>

          <div className={form.foot}>
            <button type="button" className={form.switch} onClick={() => router.push("/login")}>
              Back to sign in
            </button>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}

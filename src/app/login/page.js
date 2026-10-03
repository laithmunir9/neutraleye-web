"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteShell from "@/components/SiteShell/SiteShell";
import { createClient } from "@/lib/supabase/client";
import { classifySignUpResult, reportAuthError, safeAuthCall } from "@/lib/supabase/authErrors";
import shell from "../marketing.module.css";
import form from "@/components/AuthDialog/AuthDialog.module.css";
import styles from "./page.module.css";

/**
 * The split-panel layout this page used has been retired in favour of the
 * AuthDialog overlay, which is now the primary way in. This route stays because
 * the Supabase recovery flow redirects here and because ?mode, ?callbackUrl,
 * ?error and ?reset are all live deep links. The auth logic below is unchanged;
 * only the presentation moved onto the shared system.
 */
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const authError = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(
    authError === "auth_failed" ? "Authentication failed. Please try again." : ""
  );
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  function switchMode(next) {
    setMode(next);
    setError("");
    setEmail("");
    setForgotSent(false);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const emailValue = String(new FormData(e.currentTarget).get("email") || "");
    setEmail(emailValue);
    const supabase = createClient();
    const { error: err } = await safeAuthCall("password_reset_request", () =>
      supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
    );
    setLoading(false);
    if (err) setError(reportAuthError(err, "password_reset_request"));
    else setForgotSent(true);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const emailValue = String(fd.get("email") || "");
    const supabase = createClient();
    const result = await safeAuthCall("signup", () =>
      supabase.auth.signUp({
        email: emailValue,
        password: String(fd.get("password") || ""),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      })
    );
    const { showConfirmationScreen, message } = classifySignUpResult(result);
    if (!showConfirmationScreen) {
      setError(message);
      setLoading(false);
      return;
    }
    setEmail(emailValue);
    setConfirmed(true);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error: err } = await safeAuthCall("signin", () =>
      supabase.auth.signInWithPassword({
        email: String(fd.get("email") || ""),
        password: String(fd.get("password") || ""),
      })
    );
    if (err) {
      setError(reportAuthError(err, "signin"));
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  let title = "Sign in";
  let blurb =
    "Signing in saves your tools history across devices, so you can go back to an article you ran last week. The tools work without an account either way.";
  if (isSignup) {
    title = "Create an account";
  } else if (isForgot) {
    title = "Reset your password";
    blurb = "Enter the address you signed up with and a reset link will be sent to it.";
  }
  if (confirmed) {
    title = "Check your email";
    blurb = `A confirmation link is on its way to ${email}. The link is good for one hour.`;
  } else if (isForgot && forgotSent) {
    title = "Reset link sent";
    blurb = `If an account exists for ${email}, a reset link is on its way. The link is good for one hour.`;
  } else if (resetSuccess && !error) {
    title = "Password updated";
    blurb = "You can now sign in with your new password.";
  }

  const done = confirmed || (isForgot && forgotSent);

  return (
    <SiteShell>
      <main className={shell.page}>
        <section className={styles.wrap}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.blurb}>{blurb}</p>

          {error && <p className={form.error}>{error}</p>}

          {done ? (
            <button type="button" className={form.switch} onClick={() => { setConfirmed(false); switchMode("signin"); }}>
              Back to sign in
            </button>
          ) : (
            <form
              className={form.form}
              onSubmit={isForgot ? handleForgotPassword : isSignup ? handleSignUp : handleSignIn}
            >
              <label className={form.field}>
                <span className={form.label}>Email</span>
                <input name="email" type="email" className={form.input} autoComplete="email" required />
              </label>

              {!isForgot && (
                <label className={form.field}>
                  <span className={form.label}>Password</span>
                  <input
                    name="password"
                    type="password"
                    className={form.input}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={8}
                    required
                  />
                </label>
              )}

              <button type="submit" className={form.submit} disabled={loading}>
                {loading ? "Working" : isForgot ? "Send reset link" : isSignup ? "Create account" : "Sign in"}
              </button>
            </form>
          )}

          {!done && (
            <div className={form.foot}>
              {isForgot ? (
                <button type="button" className={form.switch} onClick={() => switchMode("signin")}>
                  Back to sign in
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={form.switch}
                    onClick={() => switchMode(isSignup ? "signin" : "signup")}
                  >
                    {isSignup ? "Already have an account? Sign in" : "No account? Create one"}
                  </button>
                  {!isSignup && (
                    <button type="button" className={form.switch} onClick={() => switchMode("forgot")}>
                      Forgot your password?
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <p className={styles.back}>
            <Link href="/" className={form.switch}>Back to NeutralEye</Link>
          </p>
        </section>
      </main>
    </SiteShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

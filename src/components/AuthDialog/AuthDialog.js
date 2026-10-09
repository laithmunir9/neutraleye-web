"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { classifySignUpResult, reportAuthError, safeAuthCall } from "@/lib/supabase/authErrors";
import styles from "./AuthDialog.module.css";

/**
 * Sign in, create an account and reset a password, as a surface over whatever
 * page the reader is on rather than a page of its own. Closing it (the X, the
 * backdrop, Escape) leaves them exactly where they were.
 *
 * Built on the native <dialog>, so focus trapping, Escape and the inert page
 * behind it come from the platform. The auth calls are the ones the retired
 * /login page made, unchanged; /login now redirects here.
 *
 * `notice` carries the states that arrive from outside: "reset" after a
 * password change, "auth_failed" when an email link could not be exchanged.
 */
const NOTICES = {
  reset: { title: "Password updated", blurb: "You can now sign in with your new password." },
};

export default function AuthDialog({ open, onClose, initialMode = "signin", notice = null }) {
  const ref = useRef(null);
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [activeNotice, setActiveNotice] = useState(notice);

  // Each opening starts clean, in the mode it was opened in. Adjusted during
  // render rather than in an effect, per the codebase's set-state rule.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode(initialMode);
      setError(notice === "auth_failed" ? "That link could not be used. Sign in, or request a new one." : "");
      setConfirmed(false);
      setForgotSent(false);
      setLoading(false);
      setActiveNotice(notice);
    }
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  function switchMode(next) {
    setMode(next);
    setError("");
    setForgotSent(false);
    setConfirmed(false);
    setActiveNotice(null);
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
    // The confirmation link brings the reader back to the page they signed up on.
    const back = `${window.location.pathname}${window.location.search}` || "/";
    const result = await safeAuthCall("signup", () =>
      supabase.auth.signUp({
        email: emailValue,
        password: String(fd.get("password") || ""),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(back)}`,
        },
      })
    );
    const { showConfirmationScreen, message } = classifySignUpResult(result);
    setLoading(false);
    if (!showConfirmationScreen) {
      setError(message);
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
    setLoading(false);
    if (err) setError(reportAuthError(err, "signin"));
    else onClose?.();
  }

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const done = confirmed || (isForgot && forgotSent);

  let title = isSignup ? "Create an account" : isForgot ? "Reset your password" : "Sign in";
  let blurb = isForgot
    ? "Enter the address you signed up with and we will send a reset link to it."
    : "Saves your reads across devices. NeutralEye works without an account either way.";
  if (confirmed) {
    title = "Check your email";
    // Covers both outcomes without saying which happened. For an address that
    // already has an account Supabase sends nothing (a decoy response, see
    // classifySignUpResult), so this must give existing users a way forward
    // without confirming to a stranger that the address is taken.
    blurb = `If ${email} is new to NeutralEye, a confirmation link is on its way (check spam too); it works for one hour. If you already have an account with this address, no email is sent: sign in instead.`;
  } else if (isForgot && forgotSent) {
    title = "Reset link sent";
    blurb = `If an account exists for ${email}, a reset link is on its way. It works for one hour.`;
  } else if (activeNotice && NOTICES[activeNotice]) {
    ({ title, blurb } = NOTICES[activeNotice]);
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={() => onClose?.()}
      onKeyDown={(e) => {
        // A Radix layer elsewhere on the page can swallow the native Escape,
        // so close explicitly rather than depending on the default.
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose?.();
        }
      }}
      onClick={(e) => {
        // The backdrop closes; clicks inside the panel do not.
        if (e.target === ref.current) onClose?.();
      }}
      aria-labelledby="auth-dialog-title"
    >
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={() => onClose?.()} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 id="auth-dialog-title" className={styles.title}>{title}</h2>
        <p className={styles.sub}>{blurb}</p>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        {done ? (
          <button type="button" className={styles.switch} onClick={() => switchMode("signin")}>
            Back to sign in
          </button>
        ) : (
          <form
            key={mode}
            className={styles.form}
            onSubmit={isForgot ? handleForgotPassword : isSignup ? handleSignUp : handleSignIn}
          >
            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input name="email" type="email" className={styles.input} autoComplete="email" autoFocus required />
            </label>

            {!isForgot && (
              <label className={styles.field}>
                <span className={styles.label}>Password</span>
                <input
                  name="password"
                  type="password"
                  className={styles.input}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
              </label>
            )}

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Working" : isForgot ? "Send reset link" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        {!done && (
          <div className={styles.foot}>
            {isForgot ? (
              <button type="button" className={styles.switch} onClick={() => switchMode("signin")}>
                Back to sign in
              </button>
            ) : (
              <>
                <button type="button" className={styles.switch} onClick={() => switchMode(isSignup ? "signin" : "signup")}>
                  {isSignup ? "Already have an account? Sign in" : "No account? Create one"}
                </button>
                {!isSignup && (
                  <button type="button" className={styles.switch} onClick={() => switchMode("forgot")}>
                    Forgot your password?
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}

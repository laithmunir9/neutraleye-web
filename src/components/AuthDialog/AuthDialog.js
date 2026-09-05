"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/AuthProvider";
import styles from "./AuthDialog.module.css";

/**
 * Sign in and sign up as an overlay rather than a page.
 *
 * Built on the native <dialog> element, so focus trapping, Escape to close,
 * and inertness of the page behind it come from the platform rather than from
 * hand-rolled key handlers.
 *
 * The /login route is deliberately left in place: the Supabase password
 * recovery flow redirects there, and it is a valid deep link.
 */
export default function AuthDialog({ open, onClose, mode: initialMode = "signin" }) {
  const ref = useRef(null);
  const { supabase } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setSent(false);
    }
  }, [open, initialMode]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy || !supabase) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSent(true);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onClose?.();
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === "signup";

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={() => onClose?.()}
      onKeyDown={(e) => {
        // Radix's dismissable layer preventDefaults the Escape keydown at the
        // document level, so the dialog never gets its native close. Handle it
        // here rather than depending on that default surviving.
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose?.();
        }
      }}
      onClick={(e) => {
        // Clicking the backdrop closes; clicks inside the panel do not.
        if (e.target === ref.current) onClose?.();
      }}
      aria-labelledby="auth-dialog-title"
    >
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={() => onClose?.()} aria-label="Close">
          &times;
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/neutraleye-mark.svg" alt="" width={32} height={32} className={styles.mark} />

        <h2 id="auth-dialog-title" className={styles.title}>
          {signup ? "Create an account" : "Sign in"}
        </h2>
        <p className={styles.sub}>
          Saves your history across devices. The tools work without an account either way.
        </p>

        {sent ? (
          <p className={styles.notice}>
            Check your email for a confirmation link. You can close this and carry on using the
            tools in the meantime.
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Password</span>
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? "Working" : signup ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        <div className={styles.foot}>
          <button
            type="button"
            className={styles.switch}
            onClick={() => {
              setMode(signup ? "signin" : "signup");
              setError(null);
              setSent(false);
            }}
          >
            {signup ? "Already have an account? Sign in" : "No account? Create one"}
          </button>
          {!signup && (
            <Link href="/login" className={styles.switch} onClick={() => onClose?.()}>
              Forgot your password?
            </Link>
          )}
        </div>
      </div>
    </dialog>
  );
}

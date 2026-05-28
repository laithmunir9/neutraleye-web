"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/analyze";
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(authError === "auth_failed" ? "Authentication failed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isSignup = mode === "signup";

  function switchMode(next) {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
  }

  async function handleEmailAuth(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setConfirmed(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    }
  }

  async function handleGoogleAuth() {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      },
    });
    if (error) setError(error.message);
  }

  if (confirmed) {
    return (
      <MarketingShell>
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.confirmBox}>
              <div className={styles.confirmIcon} aria-hidden="true">✉</div>
              <h1 className={styles.title}>Check your email</h1>
              <p className={styles.confirmText}>
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and start saving analyses.
              </p>
              <button
                type="button"
                className={styles.switchLink}
                onClick={() => { setConfirmed(false); switchMode("signin"); }}
              >
                Back to sign in
              </button>
            </div>
          </div>
        </main>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.heading}>
            <h1 className={styles.title}>{isSignup ? "Create account" : "Sign in"}</h1>
            <p className={styles.subtitle}>
              {isSignup ? "Save and sync your analysis history across devices." : "Welcome back to NeutralEye."}
            </p>
          </div>

          {error && <p className={styles.errorBanner}>{error}</p>}

          <form onSubmit={handleEmailAuth} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={isSignup ? 8 : undefined}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 8 characters" : "••••••••"}
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? (isSignup ? "Creating account…" : "Signing in…")
                : (isSignup ? "Create account" : "Sign in")}
            </button>
          </form>

          <div className={styles.divider}><span>or</span></div>

          <button type="button" className={styles.googleBtn} onClick={handleGoogleAuth}>
            {GOOGLE_ICON}
            Continue with Google
          </button>

          <p className={styles.switchPrompt}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              className={styles.switchLink}
              onClick={() => switchMode(isSignup ? "signin" : "signup")}
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </main>
    </MarketingShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

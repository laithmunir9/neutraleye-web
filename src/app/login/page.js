"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { SignInPage, SignUpPage, CheckEmailPage, ForgotPasswordPage, PasswordResetSentPage } from "@/components/ui/sign-in";
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
  const resetSuccess = searchParams.get("reset") === "success";

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(authError === "auth_failed" ? "Authentication failed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  function switchMode(next) {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    setForgotSent(false);
  }

  // TODO(post-launch): Integrate Resend for branded transactional emails
  // (signup confirmation, password reset) sent from contact@tryneutraleye.com,
  // replacing Supabase's default auth email provider.
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

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get("email") || "");
    setEmail(emailValue);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setForgotSent(true);
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
      <CheckEmailPage
        email={email}
        onBack={() => { setConfirmed(false); switchMode("signin"); }}
      />
    );
  }

  if (isForgot && forgotSent) {
    return (
      <PasswordResetSentPage
        email={email}
        onBack={() => switchMode("signin")}
      />
    );
  }

  if (isForgot) {
    return (
      <ForgotPasswordPage
        description={error ? <span style={{ color: "#8a443c", fontSize: "0.85rem" }}>{error}</span> : undefined}
        onSubmit={handleForgotPassword}
        onBack={() => switchMode("signin")}
        loading={loading}
      />
    );
  }

  // Sign-up mode — new SignUpPage UI
  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setConfirmed(true);
    }
  }

  if (isSignup) {
    return (
      <SignUpPage
        description={error ? <span style={{ color: "#8a443c", fontSize: "0.85rem" }}>{error}</span> : undefined}
        onSignUp={handleSignUp}
        onGoogleSignIn={handleGoogleAuth}
        onSignIn={() => switchMode("signin")}
      />
    );
  }

  // Sign-in mode — new SignInPage UI
  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <SignInPage
      title={resetSuccess && !error ? "Password updated." : undefined}
      description={
        error
          ? <span style={{ color: "#8a443c", fontSize: "0.85rem" }}>{error}</span>
          : resetSuccess && !error
          ? "You can now sign in with your new password."
          : undefined
      }
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleAuth}
      onResetPassword={() => switchMode("forgot")}
      onCreateAccount={() => switchMode("signup")}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

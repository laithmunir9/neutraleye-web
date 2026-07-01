"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { SignInPage, SignUpPage, CheckEmailPage, ForgotPasswordPage, PasswordResetSentPage } from "@/components/ui/sign-in";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";


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

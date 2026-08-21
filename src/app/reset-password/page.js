"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SetNewPasswordPage } from "@/components/ui/sign-in";
import { createClient } from "@/lib/supabase/client";
import { reportAuthError, safeAuthCall } from "@/lib/supabase/authErrors";

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
    const confirm  = String(formData.get("confirm")  || "");

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
    <SetNewPasswordPage
      description={error
        ? <span style={{ color: "#8a443c", fontSize: "0.85rem" }}>{error}</span>
        : undefined}
      onSubmit={handleSubmit}
      onBack={() => router.push("/login")}
      loading={loading}
    />
  );
}

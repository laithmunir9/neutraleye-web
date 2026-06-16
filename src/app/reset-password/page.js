"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SetNewPasswordPage } from "@/components/ui/sign-in";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
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
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setError(authError.message);
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

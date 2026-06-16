"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { checkLocalLimit, incrementLocalUsage } from "@/lib/usage";

export function useAnalysisLimit() {
  const { user, loading } = useAuth();
  const [state, setState] = useState({ count: 0, remaining: null, limited: false, ready: false });

  const fetchRemote = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      const data = await res.json();
      setState({ ...data, ready: true });
    } catch {
      setState((s) => ({ ...s, ready: true }));
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      fetchRemote();
    } else {
      setState({ ...checkLocalLimit(), ready: true });
    }
  }, [user, loading, fetchRemote]);

  const increment = useCallback(async () => {
    if (user) {
      try {
        const res = await fetch("/api/usage", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setState({ ...data, ready: true });
        }
      } catch {}
    } else {
      setState({ ...incrementLocalUsage(), ready: true });
    }
  }, [user]);

  return { ...state, increment };
}

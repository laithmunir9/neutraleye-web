"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { checkLocalLimit, incrementLocalUsage } from "@/lib/usage";

async function fetchRemoteUsage() {
  const res = await fetch("/api/usage");
  if (!res.ok) return null;
  return res.json();
}

export function useAnalysisLimit() {
  const { user, loading } = useAuth();
  const [state, setState] = useState({ count: 0, remaining: null, limited: false, ready: false });

  // Resolves what `state` should become without setting it — the effect and
  // increment() both commit the result via setState in their own callback,
  // so this itself is never called directly with a setState in its body.
  const resolveLimit = useCallback(async () => {
    if (!user) return { ...checkLocalLimit(), ready: true };
    try {
      const data = await fetchRemoteUsage();
      return data ? { ...data, ready: true } : { ready: true };
    } catch {
      return { ready: true };
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    let ignore = false;
    resolveLimit().then((next) => {
      if (!ignore) setState((s) => ({ ...s, ...next }));
    });
    return () => {
      ignore = true;
    };
  }, [loading, resolveLimit]);

  const increment = useCallback(async () => {
    if (user) {
      // The server increments daily_usage during /api/analyze — just refetch.
      const next = await resolveLimit();
      setState((s) => ({ ...s, ...next }));
    } else {
      setState({ ...incrementLocalUsage(), ready: true });
    }
  }, [user, resolveLimit]);

  return { ...state, increment };
}

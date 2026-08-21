"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "./client";
import { reportAuthError, safeAuthCall } from "./authErrors";

const AuthContext = createContext({ user: null, session: null, loading: true, supabase: null });

export function AuthProvider({ children }) {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Without safeAuthCall a rejected getSession() leaves loading stuck true forever,
    // so the whole app sits in a spinner instead of rendering signed-out.
    safeAuthCall("get_session", () => supabase.auth.getSession()).then(({ data, error }) => {
      if (error) reportAuthError(error, "get_session");
      const nextSession = data?.session ?? null;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

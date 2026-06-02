"use client";

import { useAuth } from "./AuthProvider";

export function useProAccess() {
  const { user, loading } = useAuth();
  // When Stripe is wired up, check user.app_metadata.plan === 'pro'
  const isPro = false;
  return { isPro, loading };
}

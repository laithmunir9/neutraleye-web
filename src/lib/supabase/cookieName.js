/*
 * The sign-in cookie's name, fixed. Left alone, Supabase names it after the
 * first label of NEXT_PUBLIC_SUPABASE_URL, so moving the API from
 * hkxtymihsyegrmqnvdvn.supabase.co to the custom auth domain
 * (auth.tryneutraleye.com) would rename it to sb-auth-auth-token and sign
 * every reader out. Pinning it to today's name keeps sessions across the
 * switch. Every client that reads the session from cookies must pass this.
 */
export const AUTH_COOKIE_OPTIONS = { name: "sb-hkxtymihsyegrmqnvdvn-auth-token" };

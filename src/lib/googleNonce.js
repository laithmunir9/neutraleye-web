/*
 * A one-time value that ties Google's ID token to this sign-in attempt, so a
 * token lifted from elsewhere cannot be replayed. Google is given the SHA-256
 * hash and writes it into the token; Supabase is given the raw value, hashes
 * it itself and checks the two match.
 */
export async function createGoogleNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

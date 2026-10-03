import { redirect } from "next/navigation";

/*
 * Sign-in is an overlay on the homepage now, not a page. This route stays only
 * because addresses outside the site still point at it: the auth callback's
 * failure redirect, the reset-password flow, /signup, and any old bookmark.
 * Each is translated into the homepage with the overlay open.
 */
export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("auth", params?.mode === "signup" ? "signup" : "signin");
  if (params?.reset === "success") query.set("notice", "reset");
  if (params?.error === "auth_failed") query.set("notice", "auth_failed");
  redirect(`/?${query.toString()}`);
}

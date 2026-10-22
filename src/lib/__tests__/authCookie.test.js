/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

jest.mock("@supabase/ssr", () => ({ createBrowserClient: jest.fn(() => ({})) }));

import { createBrowserClient } from "@supabase/ssr";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookieName";
import { createClient } from "@/lib/supabase/client";

// What @supabase/supabase-js derives on its own: sb-<first label of the API host>-auth-token.
const derived = (url) => `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;

describe("the sign-in cookie name is pinned", () => {
  test("to the name every existing session already uses", () => {
    expect(AUTH_COOKIE_OPTIONS.name).toBe(derived("https://hkxtymihsyegrmqnvdvn.supabase.co"));
  });

  test("which a custom auth domain would otherwise change, signing everyone out", () => {
    expect(derived("https://auth.tryneutraleye.com")).not.toBe(AUTH_COOKIE_OPTIONS.name);
  });

  test("the browser client passes it to Supabase", () => {
    createClient();
    expect(createBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      expect.objectContaining({ cookieOptions: AUTH_COOKIE_OPTIONS })
    );
  });

  // Every client that reads the session from cookies. The extension routes
  // authenticate with a bearer token and keep no cookies, so they are not here.
  test.each([
    "src/lib/supabase/client.js",
    "src/lib/supabase/server.js",
    "src/middleware.js",
    "src/app/auth/callback/route.js",
  ])("%s uses it", (file) => {
    const src = readFileSync(join(process.cwd(), file), "utf8");
    expect(src).toMatch(/cookieOptions:\s*AUTH_COOKIE_OPTIONS/);
  });
});

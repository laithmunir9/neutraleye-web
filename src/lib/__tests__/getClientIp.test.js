import { getClientIp } from "@/lib/apiLog";

// Build a minimal Request-like object with a Headers-style get().
function req(headers) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return { headers: { get: (name) => lower[name.toLowerCase()] ?? null } };
}

describe("getClientIp", () => {
  test("prefers x-real-ip (Vercel-set, not client-forgeable)", () => {
    expect(getClientIp(req({ "x-real-ip": "203.0.113.5" }))).toBe("203.0.113.5");
  });

  test("x-real-ip wins over x-forwarded-for", () => {
    const r = req({
      "x-real-ip": "203.0.113.5",
      "x-forwarded-for": "1.2.3.4, 203.0.113.5",
    });
    expect(getClientIp(r)).toBe("203.0.113.5");
  });

  test("ignores a spoofed leftmost x-forwarded-for entry, uses the rightmost", () => {
    // Attacker prepends a fake IP; the trusted proxy appends the real one last.
    const r = req({ "x-forwarded-for": "6.6.6.6, 203.0.113.5" });
    expect(getClientIp(r)).toBe("203.0.113.5");
  });

  test("handles a single x-forwarded-for value", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.5" }))).toBe("203.0.113.5");
  });

  test("returns 'unknown' when no forwarding headers are present", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});

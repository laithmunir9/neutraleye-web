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

  describe("behind Cloudflare", () => {
    test("uses cf-connecting-ip when the connection comes from Cloudflare", () => {
      // The three addresses one visitor arrived from in production, 24 Oct 2026.
      for (const edge of ["162.158.193.201", "172.71.247.144", "172.71.142.52", "2a06:98c0:3600::103"]) {
        expect(getClientIp(req({ "x-real-ip": edge, "cf-connecting-ip": "203.0.113.5" }))).toBe("203.0.113.5");
      }
    });

    test("ignores cf-connecting-ip from anyone connecting to Vercel directly", () => {
      const r = req({ "x-real-ip": "198.51.100.9", "cf-connecting-ip": "203.0.113.5" });
      expect(getClientIp(r)).toBe("198.51.100.9");
    });

    test("ignores a cf-connecting-ip that is not an address", () => {
      const r = req({ "x-real-ip": "162.158.193.201", "cf-connecting-ip": "anything, 1.2.3.4" });
      expect(getClientIp(r)).toBe("162.158.193.201");
    });

    test("an IPv6 visitor through Cloudflare is counted by their own address", () => {
      const r = req({ "x-real-ip": "172.71.142.52", "cf-connecting-ip": "2001:db8::1" });
      expect(getClientIp(r)).toBe("2001:db8::1");
    });
  });

  test("returns 'unknown' when no forwarding headers are present", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});

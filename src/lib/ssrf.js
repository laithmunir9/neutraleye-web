import dns from "node:dns";
import { isIP } from "node:net";

// ── SSRF guard ───────────────────────────────────────────────────────────
// Used before any server-side fetch of a user-supplied URL (e.g. article
// extraction) to block requests to loopback, link-local, private, and
// cloud-metadata addresses.
//
// Note: this re-checks on every redirect hop, but does not pin the resolved
// IP for the actual connection — a DNS-rebinding attacker who can change a
// hostname's resolution between this check and the fetch itself could still
// bypass it. That requires attacker-controlled DNS with a very short TTL and
// precise timing; closing it fully would require a custom fetch dispatcher
// that connects directly to the validated IP.

export const MAX_REDIRECTS = 5;

function ipv4ToLong(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function ipv4InRange(ip, base, bits) {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToLong(ip) & mask) === (ipv4ToLong(base) & mask);
}

function isBlockedIpv4(ip) {
  return (
    ipv4InRange(ip, "0.0.0.0", 8) ||      // "this network"
    ipv4InRange(ip, "10.0.0.0", 8) ||     // private
    ipv4InRange(ip, "100.64.0.0", 10) ||  // shared/carrier-grade NAT
    ipv4InRange(ip, "127.0.0.0", 8) ||    // loopback
    ipv4InRange(ip, "169.254.0.0", 16) || // link-local incl. 169.254.169.254 cloud metadata
    ipv4InRange(ip, "172.16.0.0", 12) ||  // private
    ipv4InRange(ip, "192.168.0.0", 16)    // private
  );
}

function isBlockedIpv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true; // loopback / unspecified
  if (/^fe[89ab][0-9a-f]:/.test(normalized)) return true; // link-local fe80::/10
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // unique local fc00::/7
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  return false;
}

export function isBlockedIp(ip) {
  const version = isIP(ip);
  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);
  return true; // not a valid IP literal — treat as unsafe
}

function blockedError() {
  const error = new Error("This URL points to a disallowed network address.");
  error.code = "URL_BLOCKED";
  return error;
}

// Throws (code: "URL_BLOCKED") if the URL's protocol isn't http/https, or if
// the hostname resolves to (or is) a blocked IP address.
export async function assertUrlIsSafe(rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw blockedError();
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  let addresses;
  if (isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      addresses = (await dns.promises.lookup(hostname, { all: true, verbatim: true })).map((r) => r.address);
    } catch {
      throw blockedError();
    }
  }

  if (!addresses.length || addresses.some(isBlockedIp)) {
    throw blockedError();
  }
}

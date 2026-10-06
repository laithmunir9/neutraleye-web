import dns from "node:dns";
import { isIP } from "node:net";

// ── SSRF guard ───────────────────────────────────────────────────────────
// Used before any server-side fetch of a user-supplied URL (e.g. article
// extraction) to block requests to loopback, link-local, private, and
// cloud-metadata addresses.
//
// The caller uses the returned address for the actual connection, so DNS
// cannot change the destination between validation and the request.

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
  const mappedDotted = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mappedDotted) return isBlockedIpv4(mappedDotted[1]);
  // WHATWG URL canonicalizes IPv4-mapped literals to hexadecimal groups.
  const mappedHex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = parseInt(mappedHex[1], 16);
    const low = parseInt(mappedHex[2], 16);
    return isBlockedIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
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
export async function resolveSafeAddress(rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw blockedError();
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  let addresses;
  if (isIP(hostname)) {
    addresses = [{ address: hostname, family: isIP(hostname) }];
  } else {
    try {
      addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw blockedError();
    }
  }

  if (!addresses.length || addresses.some(({ address }) => isBlockedIp(address))) {
    throw blockedError();
  }
  return addresses[0];
}

export async function assertUrlIsSafe(rawUrl) {
  await resolveSafeAddress(rawUrl);
}

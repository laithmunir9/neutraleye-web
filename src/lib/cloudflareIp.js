import { BlockList, isIP } from "node:net";

/*
 * Cloudflare's edge ranges, from https://www.cloudflare.com/ips-v4 and
 * https://www.cloudflare.com/ips-v6 (fetched 24 October 2026). The site is
 * proxied through Cloudflare, so Vercel sees a Cloudflare server as the
 * connecting IP, and a different one from request to request. A request that
 * arrives from one of these ranges carries the visitor's real address in
 * cf-connecting-ip, which Cloudflare sets and overwrites. One from anywhere
 * else (someone connecting to Vercel directly) does not get that header
 * trusted, so it cannot be forged to dodge a limit.
 *
 * Cloudflare rarely changes these. If it adds a range, requests through it
 * fall back to being counted per Cloudflare server: limits get looser, never
 * wrong for a real visitor.
 */
export const CLOUDFLARE_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

const family = (ip) => (isIP(ip) === 6 ? "ipv6" : "ipv4");

const cloudflare = new BlockList();
for (const range of CLOUDFLARE_RANGES) {
  const [address, prefix] = range.split("/");
  cloudflare.addSubnet(address, Number(prefix), family(address));
}

export function isCloudflareIp(ip) {
  return isIP(ip) !== 0 && cloudflare.check(ip, family(ip));
}

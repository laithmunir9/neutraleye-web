import { assertUrlIsSafe, isBlockedIp, resolveSafeAddress } from "@/lib/ssrf";

describe("isBlockedIp", () => {
  test.each([
    ["127.0.0.1", true],
    ["127.255.255.255", true],
    ["169.254.169.254", true], // cloud metadata
    ["169.254.0.1", true],
    ["10.0.0.5", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["192.168.1.1", true],
    ["100.64.0.1", true],
    ["0.0.0.0", true],
    ["::1", true],
    ["fe80::1", true],
    ["fc00::1", true],
    ["fd12:3456::1", true],
    ["::ffff:127.0.0.1", true],
    ["::ffff:7f00:1", true],
    ["::ffff:a00:5", true],
    ["::ffff:c0a8:101", true],
    ["::ffff:808:808", false],
    // public addresses
    ["1.1.1.1", false],
    ["8.8.8.8", false],
    ["172.32.0.1", false], // just outside 172.16.0.0/12
    ["172.15.255.255", false], // just below 172.16.0.0/12
    ["2606:4700:4700::1111", false],
  ])("isBlockedIp(%s) === %s", (ip, expected) => {
    expect(isBlockedIp(ip)).toBe(expected);
  });
});

describe("assertUrlIsSafe", () => {
  test("allows a normal public https URL", async () => {
    await expect(assertUrlIsSafe("https://1.1.1.1/")).resolves.toBeUndefined();
    await expect(resolveSafeAddress("https://1.1.1.1/")).resolves.toEqual({ address: "1.1.1.1", family: 4 });
  });

  test("rejects loopback IP literals", async () => {
    await expect(assertUrlIsSafe("http://127.0.0.1/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
  });

  test("rejects cloud metadata address", async () => {
    await expect(assertUrlIsSafe("http://169.254.169.254/latest/meta-data/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
  });

  test("rejects private network IP literals", async () => {
    await expect(assertUrlIsSafe("http://10.0.0.5/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
    await expect(assertUrlIsSafe("http://192.168.1.1/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
  });

  test("rejects hostnames that resolve to loopback (e.g. localhost)", async () => {
    await expect(assertUrlIsSafe("http://localhost/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
  });

  test("rejects non-http(s) protocols", async () => {
    await expect(assertUrlIsSafe("file:///etc/passwd")).rejects.toMatchObject({ code: "URL_BLOCKED" });
    await expect(assertUrlIsSafe("ftp://example.com/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
  });

  test("rejects bracketed IPv6 loopback literal", async () => {
    await expect(assertUrlIsSafe("http://[::1]/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
    await expect(assertUrlIsSafe("http://[::ffff:7f00:1]/")).rejects.toMatchObject({ code: "URL_BLOCKED" });
  });
});

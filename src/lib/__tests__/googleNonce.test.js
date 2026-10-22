/**
 * @jest-environment node
 */
import { createHash } from "node:crypto";
import { createGoogleNonce } from "@/lib/googleNonce";

describe("createGoogleNonce", () => {
  test("Google's copy is the hex SHA-256 of the raw value Supabase checks", async () => {
    const { raw, hashed } = await createGoogleNonce();
    expect(hashed).toBe(createHash("sha256").update(raw).digest("hex"));
  });

  test("is different every time", async () => {
    const [a, b] = await Promise.all([createGoogleNonce(), createGoogleNonce()]);
    expect(a.raw).not.toBe(b.raw);
  });
});

/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:3000/analyze"}
 */

describe("resolveApiBase", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("returns empty string when NEXT_PUBLIC_NEUTRALEYE_API_URL is empty", () => {
    process.env.NEXT_PUBLIC_NEUTRALEYE_API_URL = "";
    const { resolveApiBase } = require("@/lib/api");
    expect(resolveApiBase()).toBe("");
  });

  test("returns configured URL when window is undefined", () => {
    process.env.NEXT_PUBLIC_NEUTRALEYE_API_URL = "http://localhost:8000";
    const savedWindow = global.window;
    delete global.window;
    try {
      const { resolveApiBase } = require("@/lib/api");
      expect(resolveApiBase()).toBe("http://localhost:8000");
    } finally {
      global.window = savedWindow;
    }
  });

  test("returns current host URL when both hostnames are local with matching ports and protocols", () => {
    // jsdom URL is http://localhost:3000/analyze (via @jest-environment-options).
    // The configured API URL uses 127.0.0.1 — both are local, same port & protocol.
    process.env.NEXT_PUBLIC_NEUTRALEYE_API_URL = "http://127.0.0.1:3000/api";
    const { resolveApiBase } = require("@/lib/api");
    expect(resolveApiBase()).toBe("http://localhost:3000");
  });

  test("returns configured URL when URL parsing throws an error", () => {
    process.env.NEXT_PUBLIC_NEUTRALEYE_API_URL = "http://localhost:3000";
    const { resolveApiBase } = require("@/lib/api");

    // Replace the global URL constructor so that all parsing throws.
    const OriginalURL = global.URL;
    global.URL = class BadURL {
      constructor() {
        throw new TypeError("Invalid URL");
      }
    };
    try {
      expect(resolveApiBase()).toBe("http://localhost:3000");
    } finally {
      global.URL = OriginalURL;
    }
  });
});

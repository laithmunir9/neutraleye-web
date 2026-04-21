/**
 * @jest-environment jsdom
 */

describe("normalizeResponse", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_NEUTRALEYE_API_URL = "http://localhost:8000";
  });

  test("splits sectioned markdown summary into structured result fields", () => {
    const { normalizeResponse } = require("@/lib/api");
    const sectionedSummary = [
      "**Bias Level** Moderate bias against Example.",
      "**Summary of Bias** The article uses selective emphasis.",
      "**Examples of Bias**",
      '- "Loaded phrase" — language',
      "**Suggested Unbiased Sources**",
      "No verified specific URLs available; see recommendations.",
      "**Recommendations**",
      "- Compare with wire-service reporting.",
      "**Analysis Confidence** 0.75"
    ].join("\n");

    const normalized = normalizeResponse(
      {
        summary: sectionedSummary,
        examples: [],
        sources: [],
        recommendations: []
      },
      "url"
    );

    expect(normalized.summary).toBe("The article uses selective emphasis.");
    expect(normalized.examples).toHaveLength(1);
    expect(normalized.examples[0].quote).toBe('"Loaded phrase" — language');
    expect(normalized.sources).toEqual([]);
    expect(normalized.recommendations).toEqual(["Compare with wire-service reporting."]);
    expect(normalized.confidence).toBe(0.75);
  });

  test("uses legacy bias level when raw direction is only a completion status", () => {
    const { normalizeResponse } = require("@/lib/api");
    const rawSummary = [
      "**Bias Level** Moderate bias against President Donald Trump.",
      "**Summary of Bias** The text exhibits selective emphasis and loaded framing.",
      "**Examples of Bias**",
      "- Public commentary is described as damaging — framing",
      "**Recommendations**",
      "- Compare with wire-service reporting.",
      "**Analysis Confidence** 0.75"
    ].join(" ");

    const normalized = normalizeResponse(
      {
        direction: "Analysis complete",
        summary: rawSummary,
        drivers: ["Loaded wording"]
      },
      "url"
    );

    expect(normalized.directionLabel).toBe("Moderate bias against President Donald Trump.");
    expect(normalized.summary).toBe("The text exhibits selective emphasis and loaded framing.");
    expect(normalized.examples[0].quote).toBe("Public commentary is described as damaging — framing");
    expect(normalized.recommendations).toEqual(["Compare with wire-service reporting."]);
    expect(normalized.confidence).toBe(0.75);
  });
});

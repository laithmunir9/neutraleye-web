/**
 * @jest-environment node
 */
// analysis.js imports cheerio, which only ships browser/ESM exports that the
// jsdom environment's default export-condition resolution can't require().
import { buildHumanResult, contentTypeFromAiJson } from "../analysis";

describe("contentTypeFromAiJson", () => {
  it("passes through 'opinion'", () => {
    expect(contentTypeFromAiJson({ content_type: "opinion" })).toBe("opinion");
  });

  it("passes through 'analysis'", () => {
    expect(contentTypeFromAiJson({ content_type: "analysis" })).toBe("analysis");
  });

  it("normalizes case", () => {
    expect(contentTypeFromAiJson({ content_type: "OPINION" })).toBe("opinion");
  });

  it("defaults everything else to 'news'", () => {
    expect(contentTypeFromAiJson({ content_type: "news" })).toBe("news");
    expect(contentTypeFromAiJson({ content_type: "satire" })).toBe("news");
    expect(contentTypeFromAiJson({})).toBe("news");
    expect(contentTypeFromAiJson(null)).toBe("news");
  });
});

describe("buildHumanResult", () => {
  it("returns empty string for falsy input", () => {
    expect(buildHumanResult(null)).toBe("");
  });

  it("returns the no-bias message when bias_level is 'none', ignoring other fields", () => {
    const result = buildHumanResult({
      bias_level: "none",
      direction: "toward someone",
      summary: "should not appear",
      biased_phrases: [{ quote: "x", why: "framing" }],
    });
    expect(result).toBe("✅ No significant framing detected. Please feel free to continue reading.");
  });

  it("assembles bias level, direction, and summary sections", () => {
    const result = buildHumanResult({
      bias_level: "moderate",
      direction: "against the mayor",
      summary: "The piece frames the mayor unfavorably.",
      analysis_confidence: 0.72,
    });
    expect(result).toContain("**Framing**\nModerate framing against the mayor.");
    expect(result).toContain("**Summary**\nThe piece frames the mayor unfavorably.");
    expect(result).toContain("**Analysis Confidence**\n0.72");
  });

  it("omits direction text when direction is 'unknown'", () => {
    const result = buildHumanResult({ bias_level: "slight", direction: "unknown" });
    expect(result).toContain("Slight framing.");
    expect(result).not.toContain("unknown");
  });

  it("includes explanation only when it differs from summary", () => {
    const same = buildHumanResult({ bias_level: "slight", summary: "Same text", explanation: "Same text" });
    expect(same.match(/Same text/g)).toHaveLength(1);

    const different = buildHumanResult({ bias_level: "slight", summary: "Summary text", explanation: "Different rationale" });
    expect(different).toContain("Different rationale");
  });

  it("renders biased_phrases as quote/why lines", () => {
    const result = buildHumanResult({
      bias_level: "heavy",
      biased_phrases: [{ quote: "the reckless plan", why: "language" }],
    });
    expect(result).toContain('**Examples**\n- "the reckless plan": language');
  });

  it("renders suggested_sources with title, outlet, and url", () => {
    const result = buildHumanResult({
      bias_level: "slight",
      suggested_sources: [{ title: "Some Article", outlet: "Outlet", url: "https://example.com/a" }],
    });
    expect(result).toContain("**Other Coverage**\n- Some Article, Outlet, https://example.com/a");
  });

  it("renders recommendations as a bullet list", () => {
    const result = buildHumanResult({ bias_level: "slight", recommendations: ["Check the primary source"] });
    expect(result).toContain("**Recommendations**\n- Check the primary source");
  });
});

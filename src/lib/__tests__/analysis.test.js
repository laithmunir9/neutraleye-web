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

describe("buildHumanResult direction wording", () => {
  const { buildHumanResult: build } = require("../analysis");

  test.each(["non-directional", "non-directional framing bias"])(
    "omits a %s direction from the framing line rather than printing it",
    (direction) => {
      const text = build({ bias_level: "moderate", direction, summary: "The framing leans on one source." });
      expect(text).toContain("**Framing**\nModerate framing.");
      expect(text).not.toMatch(/bias/i);
    }
  );
});

describe("reader wording backstop", () => {
  const { scrubReaderText, scrubReaderFields } = require("../analysis");

  // Sentences the model actually produced on 3 October 2026 despite the prompt rule.
  test.each([
    ["detailing the events without evident framing or bias.", "detailing the events without evident framing."],
    ["It does not show bias in its reporting.", "It does not show framing in its reporting."],
    ["The writing shows meaningful bias against one side.", "The writing shows meaningful framing against one side."],
    ["A biased account that relies on one source.", "A one-sided account that relies on one source."],
    ["Bias appears in the headline.", "Framing appears in the headline."],
    ["The report is free of bias.", "The report is free of loaded framing."],
    ["There is no clear bias here.", "There is no clear loaded framing here."],
    ["An unbiased summary of events.", "An even-handed summary of events."],
    ["Moderate framing bias toward the council.", "Moderate framing toward the council."],
  ])("%s", (input, expected) => {
    const { text, replaced } = scrubReaderText(input);
    expect(text).toBe(expected);
    expect(replaced).toBeGreaterThan(0);
    expect(text).not.toMatch(/\bbias/i);
  });

  test("leaves clean framing language untouched", () => {
    const input = "The journalist's framing favours one side through loaded wording.";
    expect(scrubReaderText(input)).toEqual({ text: input, replaced: 0 });
  });

  test("rewrites only reader-facing fields, never the article quotes or keys", () => {
    const json = {
      bias_level: "moderate",
      direction: "non-directional framing bias",
      summary: "The article is biased.",
      explanation: "Shows bias through omission.",
      recommendations: ["Compare with unbiased coverage."],
      biased_phrases: [{ quote: "a biased council stacked the vote", why: "language" }],
    };
    const counts = scrubReaderFields(json);
    expect(json.summary).toBe("The article is one-sided.");
    expect(json.explanation).toBe("Shows framing through omission.");
    expect(json.recommendations).toEqual(["Compare with even-handed coverage."]);
    expect(json.direction).toBe("non-directional framing");
    expect(json.biased_phrases[0].quote).toBe("a biased council stacked the vote");
    expect(json.bias_level).toBe("moderate");
    expect(counts.replaced).toBe(4);
  });
});

describe("unfilled direction placeholder", () => {
  const { stripDirectionPlaceholder, scrubReaderFields, buildHumanResult: build } = require("../analysis");

  test.each([
    ["against <entity>", ""],
    ["toward <entity>", ""],
    ["Towards <the group>", ""],
    ["against the city council", "against the city council"],
    ["non-directional", "non-directional"],
  ])("%s", (input, expected) => {
    expect(stripDirectionPlaceholder(input).text).toBe(expected);
  });

  test("the extension's framing line drops the placeholder instead of printing it", () => {
    const json = { bias_level: "moderate", direction: "against <entity>", summary: "One-sided sourcing." };
    const counts = scrubReaderFields(json);
    expect(counts.placeholder).toBe(1);
    const text = build(json);
    expect(text).toContain("**Framing**\nModerate framing.");
    expect(text).not.toMatch(/[<>]|entity/);
  });

  test("a filled direction is untouched", () => {
    const json = { bias_level: "slight", direction: "toward the mayor" };
    expect(scrubReaderFields(json).placeholder).toBe(0);
    expect(json.direction).toBe("toward the mayor");
  });
});

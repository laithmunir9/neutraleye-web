/**
 * @jest-environment node
 */
// normalizeAiResult.js re-exports from analysis.js, which imports cheerio —
// browser/ESM-only exports that jsdom's default export-condition resolution
// can't require().
import {
  normalizeAiResult,
  parseAiResponse,
  driverLabelFromReason,
  scoreFromBiasLevel,
} from "../normalizeAiResult";

describe("parseAiResponse + normalizeAiResult", () => {
  test("full AI JSON normalizes into the website response shape", () => {
    const aiResponse = JSON.stringify({
      content_type: "news",
      bias_level: "moderate",
      direction: "against the senator",
      analysis_confidence: 0.68,
      summary: "The piece frames the senator unfavorably.",
      biased_phrases: [
        { quote: "the senator's reckless plan", why: "language" },
        { quote: "critics were largely ignored", why: "source" },
      ],
      suggested_sources: [{ title: "Balanced Coverage", outlet: "Wire Service", url: "https://wire.example/a" }],
      recommendations: ["Compare with wire-service reporting."],
      explanation: "Word choice and one-sided sourcing shape reader perception.",
    });

    const normalized = normalizeAiResult(parseAiResponse(aiResponse));

    expect(normalized.contentType).toBe("news");
    expect(normalized.directionLabel).toBe("Moderate framing against the senator");
    expect(normalized.score).toBeCloseTo(-0.52);
    expect(normalized.confidence).toBeCloseTo(0.68);
    expect(normalized.drivers).toEqual(expect.arrayContaining(["Loaded wording", "Source imbalance"]));
    expect(normalized.examples).toHaveLength(2);
    expect(normalized.examples[0]).toMatchObject({ quote: "the senator's reckless plan", label: "Loaded wording" });
    expect(normalized.sources).toEqual([{ name: "Balanced Coverage - Wire Service", url: "https://wire.example/a" }]);
    expect(normalized.recommendations).toEqual(["Compare with wire-service reporting."]);
  });

  test("bias_level 'none' normalizes to zero score and the no-bias direction label", () => {
    const aiResponse = JSON.stringify({
      content_type: "news",
      bias_level: "none",
      direction: "unknown",
      analysis_confidence: 0.9,
      summary: "The writing itself is neutral and clean.",
      biased_phrases: [],
      suggested_sources: [],
      recommendations: [],
    });

    const normalized = normalizeAiResult(parseAiResponse(aiResponse));

    expect(normalized.score).toBe(0);
    expect(normalized.directionLabel).toBe("No significant framing detected");
    expect(normalized.examples).toEqual([]);
  });

  test("malformed JSON falls back to parsing the raw text instead of throwing", () => {
    const parsed = parseAiResponse("not valid json at all");
    expect(parsed.json).toBeNull();

    const normalized = normalizeAiResult(parsed);
    expect(normalized.contentType).toBe("news");
    expect(normalized.score).toBe(0);
    expect(typeof normalized.summary).toBe("string");
  });

  test("uncertain/non-directional bias produces the uncertain label with zero score", () => {
    const aiResponse = JSON.stringify({
      bias_level: "uncertain",
      direction: "non-directional framing bias",
      analysis_confidence: 0.3,
      summary: "Evidence is weak.",
    });

    const normalized = normalizeAiResult(parseAiResponse(aiResponse));
    expect(normalized.directionLabel).toBe("Unclear framing (non-directional)");
    expect(normalized.score).toBe(0);
  });
});

test("the current non-directional value gets the same label as the legacy one", () => {
  const normalized = normalizeAiResult(
    parseAiResponse(JSON.stringify({ bias_level: "moderate", direction: "non-directional", analysis_confidence: 0.6, summary: "x" }))
  );
  expect(normalized.directionLabel).toBe("Unclear framing (non-directional)");
  expect(normalized.directionLabel).not.toMatch(/bias/i);
  expect(scoreFromBiasLevel("moderate", "non-directional")).toBe(0);
});

describe("driverLabelFromReason", () => {
  test("maps known taxonomy values to display labels", () => {
    expect(driverLabelFromReason("language")).toBe("Loaded wording");
    expect(driverLabelFromReason("framing")).toBe("Framing");
    expect(driverLabelFromReason("source")).toBe("Source imbalance");
    expect(driverLabelFromReason("attribution")).toBe("Attribution gaps");
  });

  test("title-cases unrecognized values instead of collapsing to a generic fallback", () => {
    expect(driverLabelFromReason("LOADED PHRASING")).toBe("Loaded Phrasing");
  });

  test("falls back to a generic label when empty", () => {
    expect(driverLabelFromReason("")).toBe("Framing signal");
  });
});

describe("scoreFromBiasLevel", () => {
  test.each([
    ["none", "toward x", 0],
    ["slight", "toward x", 0.24],
    ["moderate", "toward x", 0.52],
    ["heavy", "toward x", 0.82],
    ["uncertain", "toward x", 0.12],
  ])("bias_level=%s direction=%s -> %d", (biasLevel, direction, expected) => {
    expect(scoreFromBiasLevel(biasLevel, direction)).toBeCloseTo(expected);
  });

  test("negates the magnitude for 'against' direction", () => {
    expect(scoreFromBiasLevel("moderate", "against x")).toBeCloseTo(-0.52);
  });

  test("returns 0 for non-directional or unknown direction", () => {
    expect(scoreFromBiasLevel("moderate", "non-directional framing bias")).toBe(0);
    expect(scoreFromBiasLevel("moderate", "unknown")).toBe(0);
  });
});

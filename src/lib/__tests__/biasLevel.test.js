/**
 * @jest-environment node
 */
import { isNoBiasLevel, isNoBiasRecord, textLooksNoBias, NO_BIAS_LABEL } from "@/lib/biasLevel";

describe("isNoBiasLevel", () => {
  it.each([["none", true], ["None", true], ["  none ", true], ["slight", false], ["moderate", false], ["heavy", false], ["uncertain", false], ["", false], [null, false]])(
    "%s -> %s", (level, expected) => expect(isNoBiasLevel(level)).toBe(expected)
  );
});

describe("isNoBiasRecord", () => {
  it("keys off the enum for records saved since the measurement change", () => {
    expect(isNoBiasRecord({ requestMeta: { biasLevel: "none" } })).toBe(true);
    expect(isNoBiasRecord({ requestMeta: { biasLevel: "moderate" } })).toBe(false);
  });

  // The whole point of the refactor. Before this, a record whose display copy
  // happened to contain the old phrase would be read as no-bias regardless of
  // what the model actually said. The enum must win.
  it("trusts the enum over contradictory display copy", () => {
    expect(isNoBiasRecord({
      requestMeta: { biasLevel: "heavy" },
      directionLabel: "No significant bias detected",
    })).toBe(false);

    expect(isNoBiasRecord({
      requestMeta: { biasLevel: "none" },
      directionLabel: "Moderate framing against the mayor",
    })).toBe(true);
  });

  it("falls back to the label only for pre-rename rows with no enum", () => {
    expect(isNoBiasRecord({ directionLabel: "No significant bias detected" })).toBe(true);
    expect(isNoBiasRecord({ directionLabel: NO_BIAS_LABEL })).toBe(true);
    expect(isNoBiasRecord({ directionLabel: "Moderate bias against the mayor" })).toBe(false);
  });

  it.each([
    ["empty", {}],
    ["unknown", { directionLabel: "unknown" }],
    ["legacy neutral", { directionLabel: "neutral" }],
  ])("treats %s as no-bias, matching the previous behavior", (_l, record) => {
    expect(isNoBiasRecord(record)).toBe(true);
  });

  it("reads direction when directionLabel is absent", () => {
    expect(isNoBiasRecord({ direction: "No significant bias detected" })).toBe(true);
  });
});

describe("textLooksNoBias", () => {
  it("accepts both the current copy and pre-rename copy", () => {
    expect(textLooksNoBias("✅ No significant framing detected. Please continue.")).toBe(true);
    expect(textLooksNoBias("✅ No significant bias detected. Please continue.")).toBe(true);
    expect(textLooksNoBias("Moderate framing against the mayor")).toBe(false);
  });
});

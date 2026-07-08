import { clamp, normalizeScore, scoreToDirection, normalizeConfidence } from "@/lib/score";

describe("clamp", () => {
  test("leaves an in-range value unchanged", () => expect(clamp(0.5, -1, 1)).toBe(0.5));
  test("clamps below the minimum", () => expect(clamp(-5, -1, 1)).toBe(-1));
  test("clamps above the maximum", () => expect(clamp(5, -1, 1)).toBe(1));
});

describe("normalizeScore", () => {
  test("passes a finite in-range value through", () => expect(normalizeScore(0.3)).toBe(0.3));
  test("clamps out-of-range values to [-1, 1]", () => {
    expect(normalizeScore(2)).toBe(1);
    expect(normalizeScore(-2)).toBe(-1);
  });
  test("coerces a numeric string", () => expect(normalizeScore("0.5")).toBe(0.5));
  test("returns 0 for non-finite input", () => {
    expect(normalizeScore("nonsense")).toBe(0);
    expect(normalizeScore(NaN)).toBe(0);
    expect(normalizeScore(undefined)).toBe(0);
  });
});

describe("scoreToDirection", () => {
  // Boundary values are deliberately included — the buckets mix <= and < comparisons.
  test.each([
    [-1, "Strong Left Lean"],
    [-0.65, "Strong Left Lean"],
    [-0.5, "Moderate Left Lean"],
    [-0.25, "Moderate Left Lean"],
    [-0.1, "Slight Left Lean"],
    [-0.05, "Neutral"],
    [0, "Neutral"],
    [0.05, "Neutral"],
    [0.1, "Slight Right Lean"],
    [0.25, "Moderate Right Lean"],
    [0.5, "Moderate Right Lean"],
    [0.65, "Strong Right Lean"],
    [1, "Strong Right Lean"],
  ])("score %p maps to %p", (score, label) => {
    expect(scoreToDirection(score)).toBe(label);
  });
});

describe("normalizeConfidence", () => {
  test("passes a fraction in [0,1] through", () => expect(normalizeConfidence(0.75)).toBe(0.75));
  test("treats a value > 1 as a percentage", () => expect(normalizeConfidence(85)).toBe(0.85));
  test("clamps an out-of-range percentage to 1", () => expect(normalizeConfidence(150)).toBe(1));
  test("clamps a negative fraction to 0", () => expect(normalizeConfidence(-0.2)).toBe(0));
  test("defaults to 0.5 for non-finite input", () => {
    expect(normalizeConfidence("x")).toBe(0.5);
    expect(normalizeConfidence(NaN)).toBe(0.5);
  });
});

/**
 * @jest-environment node
 */
// node env (not jsdom): analysis.js imports cheerio, which ships only browser/ESM
// exports that jsdom's export-condition resolution can't require() — same reason
// analysis.test.js and promptContract.test.js pin the node environment.

import { composeAnalysisText, MAX_HEADLINE_LENGTH } from "@/lib/analysis";

const HEADLINE = "Fear and fallout three months on from Northern Ireland's race riots";
const BODY = "The first paragraph of the article body.\n\nThe second paragraph.";

describe("composeAnalysisText", () => {
  it("prepends the headline, separated by a blank line", () => {
    const result = composeAnalysisText(HEADLINE, BODY);
    expect(result).toBe(`${HEADLINE}\n\n${BODY}`);
    expect(result.startsWith(HEADLINE)).toBe(true);
    expect(result).toContain(BODY);
  });

  it.each([
    ["empty string", ""],
    ["whitespace only", "   \n\t  "],
    ["null", null],
    ["undefined", undefined],
  ])("returns the body unchanged when the headline is %s", (_label, headline) => {
    expect(composeAnalysisText(headline, BODY)).toBe(BODY);
  });

  it("does not duplicate a headline the body already opens with", () => {
    const body = `${HEADLINE}\n\n${BODY}`;
    expect(composeAnalysisText(HEADLINE, body)).toBe(body);
  });

  it("ignores case and leading whitespace when detecting an existing headline", () => {
    const body = `\n  ${HEADLINE.toUpperCase()}\n\n${BODY}`;
    expect(composeAnalysisText(HEADLINE, body)).toBe(body);
  });

  it("normalizes the headline with cleanWhitespace (outer trim, no trailing space before a newline)", () => {
    expect(composeAnalysisText("  Headline   \n  with breaks  ", BODY)).toBe(
      `Headline\n  with breaks\n\n${BODY}`
    );
  });

  it("clamps a pathologically long headline so it cannot dominate the prompt", () => {
    const huge = "x".repeat(MAX_HEADLINE_LENGTH + 500);
    const result = composeAnalysisText(huge, BODY);
    const prepended = result.slice(0, result.indexOf("\n\n"));
    expect(prepended.length).toBeLessThanOrEqual(MAX_HEADLINE_LENGTH + 3); // + the "..." safeTrim appends
    expect(result).toContain(BODY);
  });

  it("returns an empty string when there is no headline and no body", () => {
    expect(composeAnalysisText(null, null)).toBe("");
  });
});

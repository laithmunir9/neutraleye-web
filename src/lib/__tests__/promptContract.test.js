/**
 * @jest-environment node
 */
// analysis.js imports cheerio, which only ships browser/ESM exports that the
// jsdom environment's default export-condition resolution can't require().
import { generateBiasAnalysis } from "../analysis";

// These tests pin down load-bearing rules inside the bias-analysis prompt.
// The AI's actual behavior can't be unit tested, but a silent edit that drops
// one of these rules (e.g. during a prompt rewrite) would be a real regression
// worth catching before it reaches production.

function mockOpenAI(responseContent = "{}") {
  const create = jest.fn().mockResolvedValue({
    choices: [{ message: { content: responseContent } }],
  });
  return { client: { chat: { completions: { create } } }, create };
}

async function capturePrompt(sourceUrl) {
  const { client, create } = mockOpenAI();
  await generateBiasAnalysis(client, "some article text", "req-1", sourceUrl);
  return create.mock.calls[0][0].messages[0].content;
}

describe("generateBiasAnalysis prompt contract", () => {
  test("excludes quotes attributed to people in the article from bias evidence", async () => {
    const prompt = await capturePrompt();
    expect(prompt).toMatch(/never a quote attributed to a person in the article/i);
    expect(prompt).toMatch(/NEVER eligible as a biased_phrase/i);
  });

  test("includes news vs. opinion vs. analysis content-type classification with relaxed standards", async () => {
    const prompt = await capturePrompt();
    expect(prompt).toMatch(/"news", "opinion", or "analysis"/);
    expect(prompt).toMatch(/EXPECTED and must NOT by themselves be flagged as bias/i);
  });

  test("includes the minimum-impact bias threshold rule", async () => {
    const prompt = await capturePrompt();
    expect(prompt).toMatch(/minimum-impact threshold/i);
    expect(prompt).toMatch(/set bias_level to "none" rather than flagging it/i);
  });

  test("requires the full JSON schema keys in the output", async () => {
    const prompt = await capturePrompt();
    for (const key of [
      "content_type",
      "bias_level",
      "direction",
      "analysis_confidence",
      "summary",
      "biased_phrases",
      "suggested_sources",
      "recommendations",
      "explanation",
    ]) {
      expect(prompt).toContain(`"${key}"`);
    }
  });

  test("requests response_format json_object from the OpenAI call", async () => {
    const { client, create } = mockOpenAI();
    await generateBiasAnalysis(client, "some article text", "req-1");
    expect(create.mock.calls[0][0].response_format).toEqual({ type: "json_object" });
  });

  test("includes the source-domain exclusion line only when a URL is passed", async () => {
    const withUrl = await capturePrompt("https://www.example-news.com/story");
    expect(withUrl).toMatch(/Do NOT suggest example-news\.com as a source/);

    const withoutUrl = await capturePrompt();
    expect(withoutUrl).not.toMatch(/Do NOT suggest .* as a source/);
  });

  test("keeps the word bias out of every reader-facing field", async () => {
    const prompt = await capturePrompt();
    expect(prompt).toMatch(/READER-FACING WORDING/);
    expect(prompt).toMatch(/never use the words "bias", "biased", "slant", "slanted", or "partisan"/);
    expect(prompt).toMatch(/never place the article or outlet on a political spectrum/i);
    // The instructions that shape displayed text must not themselves ask for it.
    const summaryLine = prompt.split("\n").find((line) => line.includes('"summary":'));
    expect(summaryLine).not.toMatch(/shows meaningful bias/i);
    expect(summaryLine).toMatch(/never calling it biased/);
    const directionLine = prompt.split("\n").find((line) => line.includes('"direction":'));
    expect(directionLine).toContain('"non-directional"');
    expect(directionLine).not.toMatch(/bias/i);
  });
});

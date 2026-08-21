/**
 * @jest-environment node
 */
// analysis.js imports cheerio, which only ships browser/ESM exports that the
// jsdom environment's default export-condition resolution can't require().
import { detectIfArticle, generateBiasAnalysis } from "../analysis";

// These tests pin the OpenAI model IDs to the bare aliases. Dated snapshots
// (gpt-4o-2024-05-13) and the rolling chatgpt-4o-latest alias both carry
// announced retirement dates; the bare aliases don't. Pinning a dated version
// is an easy accidental edit that would otherwise stay invisible until the
// snapshot is retired and production starts erroring on a dead model ID.

function mockOpenAI(responseContent = "{}") {
  const create = jest.fn().mockResolvedValue({
    choices: [{ message: { content: responseContent } }],
  });
  return { client: { chat: { completions: { create } } }, create };
}

// A bare alias tracks whatever OpenAI currently points it at. Anything with a
// trailing date is a snapshot that will be retired, and any "-latest" form is
// the separately-retired rolling alias.
function expectBareAlias(model) {
  expect(typeof model).toBe("string");
  expect(model.startsWith("gpt-")).toBe(true);
  expect(model).not.toMatch(/-\d{4}-\d{2}-\d{2}$/);
  expect(model).not.toMatch(/-latest$/);
  expect(model).not.toMatch(/-preview/);
}

describe("OpenAI model pins", () => {
  test("detectIfArticle calls gpt-4o-mini", async () => {
    const { client, create } = mockOpenAI("article");
    await detectIfArticle(client, "some article text", "req-1");
    expect(create.mock.calls[0][0].model).toBe("gpt-4o-mini");
  });

  test("generateBiasAnalysis calls gpt-4o", async () => {
    const { client, create } = mockOpenAI();
    await generateBiasAnalysis(client, "some article text", "req-1");
    expect(create.mock.calls[0][0].model).toBe("gpt-4o");
  });

  test("neither call uses a dated snapshot or rolling alias", async () => {
    const detect = mockOpenAI("article");
    await detectIfArticle(detect.client, "some article text", "req-1");
    expectBareAlias(detect.create.mock.calls[0][0].model);

    const analyze = mockOpenAI();
    await generateBiasAnalysis(analyze.client, "some article text", "req-1");
    expectBareAlias(analyze.create.mock.calls[0][0].model);
  });
});

/**
 * @jest-environment node
 */
import { analysisMetaFields } from "@/lib/analysisMeta";

describe("analysisMetaFields", () => {
  it("records the raw model values", () => {
    expect(analysisMetaFields({ bias_level: "slight", content_type: "news" }))
      .toEqual({ biasLevel: "slight", contentType: "news" });
  });

  it("trims and lowercases", () => {
    expect(analysisMetaFields({ bias_level: "  Moderate ", content_type: "OPINION" }))
      .toEqual({ biasLevel: "moderate", contentType: "opinion" });
  });

  // The load-bearing case. contentTypeFromAiJson and normalizeContentType both
  // coerce unknown -> "news"; doing that here would make "the model said news"
  // indistinguishable from "the model said nothing", which is the exact number
  // this instrumentation exists to measure.
  it.each([
    ["missing", {}],
    ["empty string", { content_type: "", bias_level: "" }],
    ["whitespace only", { content_type: "   ", bias_level: "\t" }],
    ["null", { content_type: null, bias_level: null }],
  ])("returns null, never \"news\", when content_type is %s", (_label, json) => {
    const meta = analysisMetaFields(json);
    expect(meta.contentType).toBeNull();
    expect(meta.contentType).not.toBe("news");
    expect(meta.biasLevel).toBeNull();
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
  ])("does not throw when the whole AI JSON is %s", (_label, json) => {
    expect(analysisMetaFields(json)).toEqual({ biasLevel: null, contentType: null });
  });

  it("preserves an unexpected value rather than bucketing it", () => {
    expect(analysisMetaFields({ bias_level: "catastrophic", content_type: "listicle" }))
      .toEqual({ biasLevel: "catastrophic", contentType: "listicle" });
  });
});

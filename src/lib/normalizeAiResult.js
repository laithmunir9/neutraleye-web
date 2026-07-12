import { buildHumanResult, contentTypeFromAiJson } from "./analysis";

// AI-response → website result-shape normalization, shared home so it can be
// unit-tested (Next.js route files may only export HTTP handlers).

export function standardizeOutput(rawText) {
  if (!rawText) return "";
  let text = String(rawText);
  text = text.replace(/JSON_OUTPUT:\s*/gi, "");
  text = text.replace(/\(\s*(?:start_char|end_char)[^)]+\)/gi, "");
  text = text.replace(/\|\s*null/gi, "");
  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  if (text.toLowerCase().includes("no significant bias detected"))
    return "✅ No significant bias detected. Please feel free to continue reading.";
  return text;
}

function listFromBlock(text) {
  return String(text || "").split(/\n+/).map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

function sectionValue(markdown, heading, fallbackHeading) {
  const titles = [heading, fallbackHeading].filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!titles.length) return "";
  const allHeadings = ["Bias Level","Direction","Summary of Bias","Summary","Examples of Bias","Examples","Suggested Unbiased Sources","Suggested unbiased sources","Recommendations","Recommendations to look up","Analysis Confidence","Confidence level"].map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(?:^|\\s)\\*\\*(?:${titles.join("|")})\\*\\*\\s*([\\s\\S]*?)(?=(?:\\s|\\n)\\*\\*(?:${allHeadings.join("|")})\\*\\*|$)`, "i");
  const match = String(markdown || "").match(pattern);
  return match ? match[1].trim() : "";
}

export function parseHumanReadableSections(humanText) {
  const human = String(humanText || "").trim();
  if (!human) return { directionLabel: "", summary: "", examples: [], sources: [], recommendations: [], confidence: null };
  const directionLabel = sectionValue(human, "Bias Level", "Direction");
  const summary = sectionValue(human, "Summary of Bias", "Summary");
  const examples = listFromBlock(sectionValue(human, "Examples of Bias", "Examples"))
    .map((item) => item.replace(/\s*\(start_char:\s*[^)]*\)/gi, "").trim())
    .filter(Boolean)
    .map((quote) => ({ quote, label: "Bias signal", explanation: "Model-detected bias signal.", highlights: [] }));
  const sources = listFromBlock(sectionValue(human, "Suggested Unbiased Sources", "Suggested unbiased sources"))
    .filter((item) => !/^no verified specific urls available/i.test(item))
    .map((item) => {
      const urlMatch = item.match(/https?:\/\/\S+/i);
      const url = urlMatch ? urlMatch[0].replace(/[),.]+$/, "") : "";
      const name = item.replace(url, "").replace(/\s+—\s+$/g, "").trim() || url;
      return name || url ? { name, url } : null;
    })
    .filter(Boolean);
  const recommendations = listFromBlock(sectionValue(human, "Recommendations", "Recommendations to look up"));
  const confidenceText = sectionValue(human, "Analysis Confidence", "Confidence level");
  const confidenceMatch = confidenceText.match(/(\d+(?:\.\d+)?)\s*%?/);
  const confidence = confidenceMatch
    ? Math.max(0, Math.min(Number(confidenceMatch[1]) > 1 ? Number(confidenceMatch[1]) / 100 : Number(confidenceMatch[1]), 1))
    : null;
  return { directionLabel, summary, examples, sources, recommendations, confidence };
}

function titleCase(value) {
  return String(value || "").split(/[\s_-]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export function driverLabelFromReason(reason) {
  const n = String(reason || "").trim().toLowerCase();
  if (n === "language") return "Loaded wording";
  if (n === "framing") return "Framing";
  if (n === "source") return "Source imbalance";
  if (n === "attribution") return "Attribution gaps";
  // AI sometimes returns descriptive labels (e.g. "LOADED PHRASING") — title-case them
  const raw = String(reason || "").trim();
  if (raw) return raw.split(/[\s_-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return "Bias signal";
}

export function explanationFromReason(reason) {
  const n = String(reason || "").trim().toLowerCase();
  if (n === "language") return "Loaded or emotive wording shifts how the claim is perceived.";
  if (n === "framing") return "Selective emphasis or omission changes the reader's interpretation.";
  if (n === "source") return "The sourcing appears one-sided or lacks meaningful counterbalance.";
  if (n === "attribution") return "Claims are presented with weak attribution or unclear sourcing.";
  return "Model-detected bias signal.";
}

export function scoreFromBiasLevel(biasLevel, direction) {
  const magnitudeMap = { none: 0, slight: 0.24, moderate: 0.52, heavy: 0.82, uncertain: 0.12 };
  const magnitude = magnitudeMap[String(biasLevel || "").trim().toLowerCase()] ?? 0;
  if (!magnitude) return 0;
  const nd = String(direction || "").trim().toLowerCase();
  if (nd.startsWith("against ")) return -magnitude;
  if (nd.startsWith("toward ")) return magnitude;
  return 0;
}

export function directionLabelFromAiJson(aiJson, humanText) {
  const biasLevel = String(aiJson?.bias_level || "").trim().toLowerCase();
  const direction = String(aiJson?.direction || "").trim();
  const nd = direction.toLowerCase();
  if (biasLevel === "none" || String(humanText || "").toLowerCase().includes("no significant bias detected"))
    return "No significant bias detected";
  if (biasLevel === "uncertain" || nd === "non-directional framing bias" || nd === "unknown")
    return "Uncertain bias (non-directional)";
  if (biasLevel && direction) return `${titleCase(biasLevel)} bias ${direction}`;
  if (biasLevel) return `${titleCase(biasLevel)} bias detected`;
  return "Analysis complete";
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean))];
}

export function normalizeAiResult(parsed) {
  const human = String(parsed?.human || "").trim();
  const aiJson = parsed?.json || null;
  const humanSections = parseHumanReadableSections(human);
  const examples = Array.isArray(aiJson?.biased_phrases)
    ? aiJson.biased_phrases.map((item) => {
        const quote = String(item?.quote || "").trim();
        const why = String(item?.why || "").trim().toLowerCase();
        if (!quote) return null;
        return { quote, label: driverLabelFromReason(why), explanation: explanationFromReason(why), highlights: [] };
      }).filter(Boolean)
    : humanSections.examples;
  const drivers = uniqueStrings(examples.map((item) => item.label));
  const sources = Array.isArray(aiJson?.suggested_sources)
    ? aiJson.suggested_sources.map((item) => {
        const title = String(item?.title || "").trim();
        const url = String(item?.url || "").trim();
        const outlet = String(item?.outlet || "").trim();
        if (!title && !url && !outlet) return null;
        return { name: [title, outlet].filter(Boolean).join(" - ") || url, url };
      }).filter(Boolean)
    : humanSections.sources;
  const recommendations = Array.isArray(aiJson?.recommendations)
    ? aiJson.recommendations.map((item) => String(item).trim()).filter(Boolean)
    : humanSections.recommendations;
  const summary = String(aiJson?.summary || aiJson?.explanation || humanSections.summary || human || "").trim() || "No summary returned.";
  const confidenceValue = Number(aiJson?.analysis_confidence);
  const confidence = Number.isFinite(confidenceValue)
    ? Math.max(0, Math.min(confidenceValue > 1 ? confidenceValue / 100 : confidenceValue, 1))
    : humanSections.confidence !== null ? humanSections.confidence
    : human.toLowerCase().includes("no significant bias detected") ? 0.65
    : 0.5;
  const directionLabel = aiJson ? directionLabelFromAiJson(aiJson, human) : humanSections.directionLabel || directionLabelFromAiJson(aiJson, human);
  return {
    contentType: contentTypeFromAiJson(aiJson),
    directionLabel,
    score: scoreFromBiasLevel(aiJson?.bias_level, aiJson?.direction),
    confidence,
    drivers: drivers.length ? drivers : ["Loaded wording", "Framing", "Source imbalance", "Attribution gaps"],
    summary,
    examples,
    sources,
    recommendations,
    rawResult: human,
  };
}

export function parseAiResponse(aiResponse) {
  let parsedJson = null;
  try { parsedJson = JSON.parse(String(aiResponse || "").trim()); } catch { parsedJson = null; }
  return {
    human: parsedJson ? buildHumanResult(parsedJson) : standardizeOutput(aiResponse),
    json: parsedJson,
  };
}

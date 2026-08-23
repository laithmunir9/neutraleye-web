// Measurement fields recorded on every saved analysis, in the existing
// request_meta JSON column. Both the web and extension paths use this one
// helper so the key names stay identical and a single query covers both.
//
// Deliberately NOT normalized. contentTypeFromAiJson (analysis.js) and
// normalizeContentType (api.js) both coerce anything unrecognized to "news",
// which is correct for display and wrong here: a missing content_type would
// become indistinguishable from the model actually saying "news", corrupting
// the exact number this exists to measure. Absent means null.
//
// Kept in its own module rather than in analysis.js because api.js is
// client-side and analysis.js imports cheerio.

function rawEnum(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
}

export function analysisMetaFields(aiJson) {
  return {
    biasLevel: rawEnum(aiJson?.bias_level),
    contentType: rawEnum(aiJson?.content_type),
  };
}

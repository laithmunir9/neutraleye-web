// The model's severity enum. `bias_level` is an INTERNAL identifier only: it is
// fine in code, logs and request_meta, and must never reach user-facing copy.
// Everything a user sees says "framing" (the one deliberate exception is the
// Chrome Web Store listing and manifest name, kept for search discoverability).
//
// This module exists so that no code ever decides "is this a no-bias result?" by
// matching on a rendered string. Display copy changes; the enum does not.

export const NO_BIAS = "none";

// Single source of truth for the copy. Renderers read these; matchers do not.
export const NO_BIAS_LABEL = "No significant framing detected";
export const NO_BIAS_RESULT_TEXT =
  "✅ No significant framing detected. Please feel free to continue reading.";

// Pre-rename rows saved before the framing vocabulary landed. Recognized only so
// existing history keeps rendering correctly; they age out and no further
// spellings should ever be added here. New code matches the enum instead.
const LEGACY_NO_BIAS_LABEL = "no significant bias";
// Older records used a bare "neutral" direction for the same state.
const LEGACY_NEUTRAL_LABEL = "neutral";

export function isNoBiasLevel(biasLevel) {
  return String(biasLevel || "").trim().toLowerCase() === NO_BIAS;
}

/**
 * The model's "no single direction" value. The prompt asked for
 * "non-directional framing bias" until 3 October 2026 and "non-directional"
 * since, so the reader-facing direction never carries the word "bias". Stored
 * rows and cached results still hold the old string, so both match.
 */
export const NON_DIRECTIONAL = "non-directional";
const LEGACY_NON_DIRECTIONAL = "non-directional framing bias";

export function isNonDirectional(direction) {
  const value = String(direction || "").trim().toLowerCase();
  return value === NON_DIRECTIONAL || value === LEGACY_NON_DIRECTIONAL;
}

// Text-only fallback for the paths where no enum exists at all -- i.e. the model
// returned unparseable JSON and only its prose survives. Keyed off the constants
// above rather than literals so the copy stays in one place.
export function textLooksNoBias(text) {
  const t = String(text || "").toLowerCase();
  return t.includes(NO_BIAS_LABEL.toLowerCase()) || t.includes(LEGACY_NO_BIAS_LABEL);
}

// The record-level predicate used by every UI surface. Records saved since the
// measurement change carry the enum in requestMeta; older ones have only a
// display string, which is the sole reason the text fallback is reached here.
export function isNoBiasRecord(record) {
  const level = record?.requestMeta?.biasLevel;
  if (level) return isNoBiasLevel(level);

  const label = String(record?.directionLabel || record?.direction || "").trim();
  const lower = label.toLowerCase();
  if (!lower || lower === "unknown" || lower === LEGACY_NEUTRAL_LABEL) return true;
  return textLooksNoBias(label);
}

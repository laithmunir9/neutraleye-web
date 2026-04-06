export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeScore(rawScore) {
  const value = Number(rawScore);
  if (!Number.isFinite(value)) return 0;
  return clamp(value, -1, 1);
}

export function scoreToDirection(score) {
  if (score <= -0.65) return "Strong Left Lean";
  if (score <= -0.25) return "Moderate Left Lean";
  if (score < -0.05) return "Slight Left Lean";
  if (score <= 0.05) return "Neutral";
  if (score < 0.25) return "Slight Right Lean";
  if (score < 0.65) return "Moderate Right Lean";
  return "Strong Right Lean";
}

export function normalizeConfidence(rawConfidence) {
  const value = Number(rawConfidence);
  if (!Number.isFinite(value)) return 0.5;
  if (value > 1) return clamp(value / 100, 0, 1);
  return clamp(value, 0, 1);
}

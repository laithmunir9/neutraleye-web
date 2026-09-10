import styles from "./QuoteEvidence.module.css";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits a quote into marked and unmarked parts.
 *
 * When the analysis supplies no sub-spans, the whole excerpt is the marked
 * passage. That is not a fallback, it is the truthful rendering: `biased_phrases`
 * returns the sentence that carries the framing, and nothing narrower. The
 * previous version returned the bare string in that case, so the `<mark>` below
 * never rendered at all and the annotation was absent from the product while
 * shipping on the marketing pages.
 */
function markedParts(quote, highlights) {
  const filtered = (highlights || []).filter(Boolean);
  if (!filtered.length) return [{ text: quote, marked: true }];

  const pattern = new RegExp(`(${filtered.map(escapeRegex).join("|")})`, "ig");
  return quote
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({
      text: part,
      marked: filtered.some((target) => target.toLowerCase() === part.toLowerCase()),
    }));
}

export default function QuoteEvidence({ quote, label, explanation, highlight = [] }) {
  const parts = markedParts(quote, highlight);

  return (
    <article className={styles.card}>
      <div className={styles.chip}>{label}</div>
      <blockquote className={styles.quote}>
        {parts.map((part, index) =>
          part.marked ? (
            <mark className={styles.annotation} key={`${part.text}-${index}`}>
              {part.text}
            </mark>
          ) : (
            <span key={`${part.text}-${index}`}>{part.text}</span>
          )
        )}
      </blockquote>
      <p className={styles.explanation}>{explanation}</p>
    </article>
  );
}

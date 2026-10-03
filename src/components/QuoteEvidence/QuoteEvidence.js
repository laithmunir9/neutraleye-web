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

/* `sweep` draws each mark in once, staggered by `index`, like a pen moving
   across the line. It is the one piece of motion on a result. */
export default function QuoteEvidence({ quote, label, explanation, highlight = [], sweep = false, index = 0 }) {
  const parts = markedParts(quote, highlight);
  const markClass = sweep ? `${styles.annotation} ${styles.sweep}` : styles.annotation;
  const markStyle = sweep ? { animationDelay: `${0.15 + index * 0.35}s` } : undefined;

  return (
    <article className={styles.card}>
      {label ? <div className={styles.chip}>{label}</div> : null}
      <blockquote className={styles.quote}>
        {parts.map((part, i) =>
          part.marked ? (
            <mark className={markClass} style={markStyle} key={`${part.text}-${i}`}>
              {part.text}
            </mark>
          ) : (
            <span key={`${part.text}-${i}`}>{part.text}</span>
          )
        )}
      </blockquote>
      {explanation ? <p className={styles.explanation}>{explanation}</p> : null}
    </article>
  );
}

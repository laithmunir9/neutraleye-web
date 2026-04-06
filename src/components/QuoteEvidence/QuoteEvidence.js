import styles from "./QuoteEvidence.module.css";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightQuote(quote, highlights) {
  if (!highlights?.length) return [quote];
  const filtered = highlights.filter(Boolean);
  if (!filtered.length) return [quote];

  const pattern = new RegExp(`(${filtered.map(escapeRegex).join("|")})`, "ig");
  return quote.split(pattern);
}

export default function QuoteEvidence({ quote, label, explanation, highlight = [] }) {
  const parts = highlightQuote(quote, highlight);

  return (
    <article className={styles.card}>
      <div className={styles.chip}>{label}</div>
      <blockquote className={styles.quote}>
        <span className={styles.mark}>&ldquo;</span>
        <span>
          {parts.map((part, index) =>
            highlight.some((target) => target.toLowerCase() === part.toLowerCase()) ? (
              <mark key={`${part}-${index}`}>{part}</mark>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            )
          )}
        </span>
      </blockquote>
      <p className={styles.explanation}>{explanation}</p>
    </article>
  );
}

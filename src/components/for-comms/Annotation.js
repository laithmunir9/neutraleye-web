import styles from "./Annotation.module.css";

/**
 * Marks a quoted span lifted from source text, so the reader sees the exact
 * wording under discussion rather than a paraphrase.
 *
 * Pass `sweep` with an index to have the highlight draw itself in, like a
 * marker pen moving across the line. That is the product's own gesture, so it
 * is the one piece of motion worth spending on. It runs once, on load, and is
 * disabled outright under prefers-reduced-motion.
 */
export default function Annotation({ children, sweep, index = 0 }) {
  return (
    <mark
      className={`${styles.annotation} ${sweep ? styles.sweep : ""}`}
      style={sweep ? { animationDelay: `${0.5 + index * 0.75}s` } : undefined}
    >
      {children}
    </mark>
  );
}

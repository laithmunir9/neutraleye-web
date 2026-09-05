import styles from "./Interlinear.module.css";

/**
 * The interlinear gloss: the analysis opens inside the paragraph, under the
 * line it is about, rather than beside it in a margin.
 *
 * The note is a sibling block, not a span inside the sentence. That is the
 * whole difference from a highlight: a highlight sits in the text, a gloss
 * interrupts it. `Mark` keeps the accent rule in an absolutely positioned
 * element so drawing it in never reflows the words above.
 *
 * Motion is the page's single orchestrated moment, on load: rule, note, rule,
 * note. It is pure CSS with staggered delays, so there is nothing to hydrate
 * and nothing to race, and it is disabled outright under reduced motion.
 */

export function Mark({ children, step = 0 }) {
  return (
    <span className={styles.mark}>
      {children}
      <span
        className={styles.rule}
        style={{ animationDelay: `${360 + step * 780}ms` }}
        aria-hidden="true"
      />
    </span>
  );
}

export function Line({ children }) {
  return <p className={styles.line}>{children}</p>;
}

export function Note({ label, children, step = 0 }) {
  return (
    <aside className={styles.note} style={{ animationDelay: `${700 + step * 760}ms` }}>
      <p className={styles.noteLabel}>{label}</p>
      <p className={styles.noteBody}>{children}</p>
    </aside>
  );
}

export default function Interlinear({ children }) {
  return <div className={styles.root}>{children}</div>;
}

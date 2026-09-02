import styles from "./Annotation.module.css";

/**
 * Marks a quoted span lifted from source text. Used to show the reader the
 * exact wording under discussion rather than paraphrasing it.
 */
export default function Annotation({ children }) {
  return <mark className={styles.annotation}>{children}</mark>;
}

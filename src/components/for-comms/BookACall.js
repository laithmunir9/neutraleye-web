import NeedsUrlMarker from "./NeedsUrlMarker";
import styles from "./BookACall.module.css";

const LABEL = "Book a call";

/**
 * The single call to action on this page. Renders as a non-interactive
 * element carrying a NEEDS URL marker until a scheduling URL is set.
 */
export default function BookACall({ href, size = "compact" }) {
  const sizeClass = size === "large" ? styles.large : styles.compact;

  if (href) {
    return (
      <a
        className={`${styles.button} ${sizeClass}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {LABEL}
      </a>
    );
  }

  return (
    <span className={`${styles.button} ${sizeClass} ${styles.pending}`}>
      {LABEL}
      <NeedsUrlMarker />
    </span>
  );
}

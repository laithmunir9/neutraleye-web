import NeedsUrlMarker from "./NeedsUrlMarker";
import styles from "./PendingLink.module.css";

/**
 * Inline text link to an external source. When no URL has been set yet the
 * label still renders, followed by a visible NEEDS URL marker.
 */
export default function PendingLink({ href, children }) {
  if (href) {
    return (
      <a
        className={styles.link}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <span className={styles.pending}>
      {children}
      <NeedsUrlMarker />
    </span>
  );
}

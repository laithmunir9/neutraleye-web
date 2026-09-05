import styles from "./NeedsUrlMarker.module.css";

/**
 * Visible stand-in shown wherever a real URL has not been supplied yet.
 * Deliberately not hidden: an unset link should be obvious on the page.
 */
export default function NeedsUrlMarker() {
  return <span className={styles.marker}>NEEDS URL</span>;
}

import Link from "next/link";
import styles from "./ForCommsFooter.module.css";

/**
 * Minimal footer for the /for-comms route. This page does not use SiteFooter.
 */
export default function ForCommsFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.note}>
          NeutralEye also makes a{" "}
          <Link href="/" className={styles.link}>
            reading companion
          </Link>{" "}
          for single articles, as a Chrome extension and on the web.
        </p>
        <nav className={styles.legal} aria-label="Legal">
          <Link href="/privacy" className={styles.link}>
            Privacy
          </Link>
          <Link href="/terms" className={styles.link}>
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

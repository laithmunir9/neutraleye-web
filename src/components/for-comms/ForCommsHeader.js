import Link from "next/link";
import BookACall from "./BookACall";
import styles from "./ForCommsHeader.module.css";

/**
 * Minimal header for the /for-comms route. This page does not use SiteHeader.
 * The wordmark stays on this route rather than linking to the homepage.
 */
export default function ForCommsHeader({ calendarUrl }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/for-comms" className={styles.wordmark}>
          NeutralEye
        </Link>
        <BookACall href={calendarUrl} size="compact" />
      </div>
    </header>
  );
}

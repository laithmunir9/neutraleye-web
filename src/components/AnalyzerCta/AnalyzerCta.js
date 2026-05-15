import Link from "next/link";
import styles from "./AnalyzerCta.module.css";

export default function AnalyzerCta() {
  return (
    <section className={styles.cta}>
      <h2>Try NeutralEye</h2>
      <Link href="/analyze" className={styles.button}>
        Open Analyzer
      </Link>
    </section>
  );
}

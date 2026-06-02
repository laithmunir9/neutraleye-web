import Link from "next/link";
import styles from "./AnalyzerCta.module.css";

export default function AnalyzerCta() {
  return (
    <section className={styles.cta}>
      <h2>See NeutralEye in action</h2>
      <Link href="/analyze" className={styles.button}>
        Open Analyzer
      </Link>
    </section>
  );
}

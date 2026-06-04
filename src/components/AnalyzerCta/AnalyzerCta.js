import Link from "next/link";
import styles from "./AnalyzerCta.module.css";

export default function AnalyzerCta({ heading = "See NeutralEye in action", label = "Open Analyzer" }) {
  return (
    <section className={styles.cta}>
      <h2>{heading}</h2>
      <Link href="/analyze" className={styles.button}>
        {label}
      </Link>
    </section>
  );
}

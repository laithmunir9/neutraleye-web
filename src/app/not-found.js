import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <MarketingShell>
      <main className={styles.main}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.message}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryAction}>Go home</Link>
          <Link href="/analyze" className={styles.secondaryAction}>Open Analyzer</Link>
        </div>
      </main>
    </MarketingShell>
  );
}

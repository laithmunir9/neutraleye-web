import Link from "next/link";
import SiteShell from "@/components/SiteShell/SiteShell";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <SiteShell>
      <main className={styles.main}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.message}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryAction}>Go to NeutralEye</Link>
        </div>
      </main>
    </SiteShell>
  );
}

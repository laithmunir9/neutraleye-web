import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { BLOG_POSTS } from "@/lib/content";
import styles from "./page.module.css";

export default function BlogPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.breadcrumbs}>
          <Link href="/#analysis">Back to analysis</Link>
          <span>/</span>
          <span>Archive</span>
        </div>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Journal archive</p>
            <h1>Guides that stay connected to the product experience.</h1>
          </div>
          <p className={styles.lead}>
            Articles live inside the same NeutralEye system: read the guide, jump back to the homepage analyzer, or
            move into the full workspace without losing context.
          </p>
        </header>

        <section className={styles.grid}>
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
              <div className={styles.metaRow}>
                <span>{post.category}</span>
                <span>{post.readTime}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <span className={styles.cardLink}>Read article</span>
            </Link>
          ))}
        </section>

        <section className={styles.inlineReturn}>
          <div>
            <p className={styles.eyebrow}>Return to the product</p>
            <h2>Go back to the homepage analyzer whenever you want to test what you just read.</h2>
          </div>
          <Link href="/#analysis" className={styles.returnLink}>
            Open live analysis
          </Link>
        </section>
      </main>
    </MarketingShell>
  );
}

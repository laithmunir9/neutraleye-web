import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { BLOG_POSTS } from "@/lib/content";
import styles from "./page.module.css";

export default function BlogPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Blog</h1>
          <p className={styles.lead}>
            Practical notes on reading bias, interpreting evidence, and understanding how NeutralEye turns article
            text into structured analysis.
          </p>
        </header>

        <section className={styles.grid}>
          {BLOG_POSTS.map((post, index) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
              <div className={`${styles.media} ${styles[`media${(index % 4) + 1}`]}`} aria-hidden>
                <span>NeutralEye</span>
              </div>
              <div className={styles.metaRow}>
                <span>{post.category}</span>
                <span>{post.date}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </Link>
          ))}
        </section>
      </main>
    </MarketingShell>
  );
}

import Image from "next/image";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
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
          {[...BLOG_POSTS].sort((a, b) => new Date(b.date) - new Date(a.date)).map((post, index) => (
            <ScrollReveal key={post.slug} delay={index * 0.08}>
              <Link href={`/blog/${post.slug}`} className={styles.card}>
                <div className={`${styles.media} ${styles[`media${(index % 4) + 1}`]}`} aria-hidden>
                  {post.showBrandTitle && (
                    <span className={styles.mediaBrand}>
                      <Image src="/neutraleye-logo.png" alt="" width={28} height={28} className={styles.mediaBrandLogo} />
                      <span className={styles.mediaTitle}>NeutralEye</span>
                    </span>
                  )}
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaCategory}>{post.category}</span>
                  <span className={styles.metaDate}>{post.date}</span>
                </div>
                <h2>{post.title}</h2>
              </Link>
            </ScrollReveal>
          ))}
        </section>
      </main>
    </MarketingShell>
  );
}

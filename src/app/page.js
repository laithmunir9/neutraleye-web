import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import HeroSystemVisualization from "@/components/HeroSystemVisualization/HeroSystemVisualization";
import { BLOG_POSTS } from "@/lib/content";
import styles from "./page.module.css";

export default function Home() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>NeutralEye</p>
              <h1>A calm analysis tool for checking tone, framing, and omission.</h1>
              <p className={styles.lead}>
                NeutralEye is a single workspace for pasting article text or a URL and getting a structured bias read.
                The website introduces the tool. The analyzer lives in one place.
              </p>
            </div>

            <div className={styles.actions}>
              <Link href="/analyze" className={styles.primaryAction}>
                Open Analyzer
              </Link>
            </div>
          </div>

          <HeroSystemVisualization />
        </section>

        <section className={styles.value}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>How it works</p>
              <h2>One input. One analysis. One structured output.</h2>
            </div>
            <Link href="/methodology" className={styles.inlineLink}>
              Read methodology
            </Link>
          </div>

          <div className={styles.valueGrid}>
            <article className={styles.valueCard}>
              <h3>Input</h3>
              <p>Paste text or switch to URL mode in the analyzer workspace.</p>
            </article>
            <article className={styles.valueCard}>
              <h3>Analysis</h3>
              <p>NeutralEye checks tone, framing, source balance, and omission through one consistent flow.</p>
            </article>
            <article className={styles.valueCard}>
              <h3>Output</h3>
              <p>See direction, summary, examples, suggested sources, recommendations, and confidence in one stack.</p>
            </article>
          </div>
        </section>

        <section className={styles.journal} id="journal">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Journal</p>
              <h2>Read more without leaving the product flow.</h2>
            </div>
            <Link href="/blog" className={styles.inlineLink}>
              View all posts
            </Link>
          </div>

          <div className={styles.journalGrid}>
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.journalCard}>
                <div className={styles.journalMeta}>
                  <span>{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Analyze an article with NeutralEye.</h2>
          <Link href="/analyze" className={styles.primaryAction}>
            Open Analyzer
          </Link>
        </section>
      </main>
    </MarketingShell>
  );
}

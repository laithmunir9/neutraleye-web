import Link from "next/link";
import styles from "./page.module.css";

const POSTS = [
  {
    slug: "what-is-media-bias",
    category: "Media bias",
    title: "What is media bias?",
    excerpt: "A practical guide to tone, framing, omission, and why source labels alone are not enough."
  },
  {
    slug: "how-to-detect-bias-in-news",
    category: "Critical thinking",
    title: "How to detect bias in news",
    excerpt: "A repeatable reading checklist for comparing articles, language, and missing context."
  },
  {
    slug: "how-framing-shapes-the-news",
    category: "Framing",
    title: "How framing shapes the news",
    excerpt: "Why two articles with similar facts can still leave readers with very different conclusions."
  }
];

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Blog</p>
        <h1>Guides for reading the news more carefully.</h1>
        <p>
          NeutralEye&apos;s content system is designed to bring readers from search to a useful explanation, then into
          the demo.
        </p>
      </header>

      <section className={styles.grid}>
        {POSTS.map((post) => (
          <article key={post.slug} className={styles.card}>
            <p className={styles.category}>{post.category}</p>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className={styles.link}>
              Read article
            </Link>
          </article>
        ))}
      </section>

      <section className={styles.cta}>
        <h2>Want to test an article while you read?</h2>
        <Link href="/#demo" className={styles.button}>
          Try Demo
        </Link>
      </section>
    </main>
  );
}

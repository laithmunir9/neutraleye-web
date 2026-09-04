import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { BLOG_POSTS } from "@/lib/content";
import shell from "../marketing.module.css";
import styles from "./page.module.css";

export const metadata = {
  title: "Blog | NeutralEye",
  description: "Notes on framing, sourcing, and reading the news closely.",
};

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <MarketingShell>
      <main className={shell.page}>

        <section className={shell.hero}>
          <h1>Notes on reading closely</h1>
          <p className={shell.lead}>
            How framing works, what the analysis actually measures, and what turns up in the
            articles people are already reading.
          </p>
        </section>

        {/* A list, not a grid of thumbnails. The titles are the content; the
            decorative colour blocks were carrying no information. */}
        <section className={shell.section}>
          <ul className={`${styles.list} ${shell.full}`}>
            {posts.map((post) => (
              <li key={post.slug} className={styles.item}>
                <Link href={`/blog/${post.slug}`} className={styles.link}>
                  <h2 className={styles.title}>{post.title}</h2>
                  <p className={styles.meta}>
                    <span>{post.category}</span>
                    <span className={styles.metaSep} aria-hidden="true">&middot;</span>
                    <span>{post.date}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

      </main>
    </MarketingShell>
  );
}

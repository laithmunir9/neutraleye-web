import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { BLOG_POSTS, BLOG_POSTS_BY_SLUG } from "@/lib/content";
import styles from "./page.module.css";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const post = BLOG_POSTS_BY_SLUG[resolvedParams.slug] || BLOG_POSTS[0];

  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.breadcrumbs}>
          <Link href="/#analysis">Back to analysis</Link>
          <span>/</span>
          <Link href="/blog">Archive</Link>
          <span>/</span>
          <span>{post.title}</span>
        </div>

        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.metaRow}>
              <span>{post.category}</span>
              <span>{post.readTime}</span>
            </div>
            <h1>{post.title}</h1>
            <p className={styles.intro}>{post.intro}</p>
          </header>

          <div className={styles.content}>
            {post.sections.map((section) => (
              <section key={section.title} className={styles.section}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
    </MarketingShell>
  );
}

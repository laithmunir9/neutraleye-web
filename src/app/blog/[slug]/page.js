import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import { BLOG_POSTS, BLOG_POSTS_BY_SLUG, getBlogPostSections } from "@/lib/content";
import styles from "./page.module.css";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

function sectionId(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const post = BLOG_POSTS_BY_SLUG[resolvedParams.slug] || BLOG_POSTS[0];
  const sections = getBlogPostSections(post);

  return (
    <MarketingShell>
      <main className={styles.page}>
        <article className={styles.article}>
          <Link href="/blog" className={styles.backLink}>
            <span aria-hidden="true">←</span>
            Blog
          </Link>

          <header className={styles.header}>
            <h1>{post.title}</h1>
            <div className={styles.metaRow}>
              <span>{post.date}</span>
              <span>{post.category}</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          <ScrollReveal>
          <div className={styles.readingLayout}>
            <aside className={styles.sidebar} aria-label="Article sections">
              <nav>
                {sections.map((section) => (
                  <a key={section.title} href={`#${sectionId(section.title)}`}>
                    {section.title}
                  </a>
                ))}
              </nav>
            </aside>

            <div className={styles.content}>
              {sections.map((section) => (
                <section id={sectionId(section.title)} key={section.title} className={styles.section}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}

              <footer className={styles.articleFooter}>
                <Link href="/blog" className={styles.allPostsLink}>
                  <span aria-hidden="true">←</span>
                  All posts
                </Link>
              </footer>
            </div>
          </div>
          </ScrollReveal>
        </article>
      </main>
    </MarketingShell>
  );
}

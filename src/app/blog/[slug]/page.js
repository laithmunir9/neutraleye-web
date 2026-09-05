import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import ReadingLayout from "./ReadingLayout";
import { BLOG_POSTS, BLOG_POSTS_BY_SLUG, getBlogPostSections } from "@/lib/content";
import styles from "./page.module.css";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const post = BLOG_POSTS_BY_SLUG[resolvedParams.slug];
  if (!post) return {};
  return {
    title: `${post.title} | NeutralEye`,
    description: post.excerpt || post.intro || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || post.intro || "",
      url: `https://tryneutraleye.com/blog/${post.slug}`,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const post = BLOG_POSTS_BY_SLUG[resolvedParams.slug];
  if (!post) notFound();
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

          <ReadingLayout sections={sections} />
        </article>
      </main>
    </MarketingShell>
  );
}

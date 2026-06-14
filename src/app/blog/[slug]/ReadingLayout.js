"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

function sectionId(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ReadingLayout({ sections }) {
  const [activeId, setActiveId] = useState(sectionId(sections[0]?.title));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );

    sections.forEach((section) => {
      const el = document.getElementById(sectionId(section.title));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className={styles.readingLayout}>
      <aside className={styles.sidebar} aria-label="Article sections">
        <nav>
          {sections.map((section) => {
            const id = sectionId(section.title);
            return (
              <a
                key={section.title}
                href={`#${id}`}
                className={`${styles.sidebarLink}${activeId === id ? ` ${styles.sidebarLinkActive}` : ""}`}
              >
                {section.title}
              </a>
            );
          })}
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
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "./page.module.css";

const SECTIONS = [
  {
    id: "direction",
    label: "Direction & scores",
    questions: [
      {
        q: "What does 'Left-leaning,' 'Center,' or 'Right-leaning' mean?",
        a: "The direction label describes the dominant pattern of signals found in that specific article, covering tone, framing, source selection, and omission. It is not a political judgment about the outlet, author, or subject matter. The same publication can receive different labels across different articles depending on how a story is assembled.",
      },
      {
        q: "What is the confidence score (0.00–1.00)?",
        a: "The confidence score reflects how clearly and consistently the directional signal appeared. A score of 0.85 means the signals were clear and repeated across the article. A score of 0.30 means signals were present but faint or mixed. Read it alongside the direction label, since 0.70 on a Center result means something different from 0.70 on a Left-leaning result.",
      },
      {
        q: "Can a left-leaning article still be accurate and well-reported?",
        a: "Yes. Bias direction describes framing patterns, not factual accuracy. A well-reported article can still use language, sourcing, or emphasis that leans in one direction. NeutralEye is not a fact-checker. It analyzes how a story is constructed, not whether its claims are true.",
      },
      {
        q: "Why does the same outlet get different labels on different articles?",
        a: "Because NeutralEye analyzes the text you submit, not the outlet's overall reputation. A wire report and an opinion column from the same publication can produce very different results. That's intentional. Labeling by outlet would be a shortcut that ignores how individual stories are actually written.",
      },
    ],
  },
  {
    id: "confidence",
    label: "Confidence score",
    questions: [
      {
        q: "What is the confidence score?",
        a: "Confidence measures how clearly and consistently the bias signals appeared across the submitted text. A high confidence score means tone, framing, sourcing, and attribution all pointed in the same direction throughout the article. A low score means signals were mixed, sparse, or contradictory.",
      },
      {
        q: "Does high confidence mean the article is dishonest or wrong?",
        a: "No. A well-written opinion column can score high confidence because its rhetorical structure is deliberately consistent, and that's not a flaw. High confidence means the pattern was clear, not that the article is manipulative. What matters is reading the direction, the score, and the evidence together.",
      },
      {
        q: "What does a low confidence score mean, and did the article pass?",
        a: "Not exactly. Low confidence can mean the article is genuinely balanced and signals cancel out. But it can also mean the text was too short, the writing was inconsistent, or the story was still developing when filed. A low score is a flag for caution, not a clean bill of health.",
      },
      {
        q: "How should I use confidence alongside the direction label?",
        a: "Think of confidence as a volume dial, not a pass/fail gate. A high-confidence Left-leaning result with multiple quoted examples carries more weight than a high-confidence label with thin evidence. The direction tells you which way; the confidence tells you how strongly; the examples tell you why.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    questions: [
      {
        q: "Is my article text stored when I run an analysis?",
        a: "Article text submitted for analysis is processed to generate a result and is not permanently stored by default. Signed-in users can opt in to saving their analysis history. This stores the result and metadata, not the full article text.",
      },
      {
        q: "What data does NeutralEye collect?",
        a: "For anonymous users: only the data needed to enforce rate limits (IP address, request count). For signed-in users: your email, analysis history if you opt in, and daily usage count. We do not sell data or share it with advertising networks. See the Privacy Policy for the full picture.",
      },
      {
        q: "Does the Chrome extension have access to everything I browse?",
        a: "No. The extension only activates when you click the NeutralEye icon. It reads the current tab's content only at that moment. It does not run in the background, track your browsing, or access tabs you haven't explicitly submitted for analysis.",
      },
      {
        q: "Do you use my article text to train AI models?",
        a: "No. Submitted text is used only to generate your analysis result. It is not retained for model training or used to improve the underlying AI beyond the current session.",
      },
    ],
  },
  {
    id: "plans",
    label: "Plans & limits",
    questions: [
      {
        q: "How many analyses can I run for free?",
        a: "Everyone gets 10 free analyses per day during our beta, and a rate limit of 5 requests per minute applies to prevent abuse. The limit resets daily. No account is required to get started.",
      },
      {
        q: "What does a Pro plan include?",
        a: "Pro brings Compare Analyses, which lets you run two articles side by side and see where framing diverges. Cloud history synced across your devices is already included free when you sign in. Pro is coming soon. Join the waitlist on the pricing page to be notified at launch.",
      },
      {
        q: "Does the extension have the same limits as the website?",
        a: "Both the extension and website share the same limits: 10 analyses per day and a rate limit of 5 requests per minute. Signing in links both to your account so history saves across both.",
      },
      {
        q: "Do I need an account to use NeutralEye?",
        a: "No. You can run analyses on the website without an account. An account is needed to save history across devices and to access upcoming Pro features like Compare Analyses.",
      },
    ],
  },
  {
    id: "how-it-works",
    label: "How it works",
    questions: [
      {
        q: "How does NeutralEye determine bias direction?",
        a: "It checks five signal families together in one pass: tone (emotional loading, verb choices), framing (what the article centers vs. backgrounds), attribution (who gets quoted and how), source balance (distribution and credibility of sources), and omission (context that's missing). The direction emerges from the pattern across all five, not any single signal in isolation.",
      },
      {
        q: "Can NeutralEye analyze any article or web page?",
        a: "It works best on articles: news reports, analysis pieces, opinion columns, and editorials. Very short texts, paywalled pages, navigation-heavy pages, and non-article content (product pages, forums) may produce unreliable results. The system flags these cases when it detects them.",
      },
      {
        q: "How accurate is the analysis?",
        a: "NeutralEye surfaces patterns. It doesn't claim certainty. Satire, irony, and unusual writing styles can resemble bias signals. The analysis should be treated as a structured second opinion that prompts closer reading, not as a definitive verdict. The evidence section exists precisely so you can check the reasoning yourself.",
      },
      {
        q: "Does NeutralEye work on paywalled articles?",
        a: "For URL submissions, the system attempts to extract article text. Paywalled pages that block extraction will return an error. You can always paste the article text directly if you have access, and that bypasses extraction entirely.",
      },
    ],
  },
];

export default function FaqPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* ── Hero ── */}
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Help</p>
          <h1>Frequently asked questions</h1>
          <p className={styles.lead}>
            Everything you need to know about reading results, understanding scores,
            and how NeutralEye handles your data.
          </p>
        </header>

        {/* ── Two-column layout ── */}
        <div className={styles.layout}>

          {/* Sticky nav */}
          <aside className={styles.nav}>
            <p className={styles.navHeading}>Topics</p>
            <nav>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`${styles.navLink}${activeId === s.id ? ` ${styles.navLinkActive}` : ""}`}
                >
                  {s.label}
                </a>
              ))}
            </nav>
            <div className={styles.navFooter}>
              <p>Still have questions?</p>
              <Link href="/support">Contact us →</Link>
            </div>
          </aside>

          {/* Q&A sections */}
          <div className={styles.sections}>
            {SECTIONS.map((section, si) => (
              <section key={section.id} id={section.id} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionNumber} aria-hidden="true">
                    {String(si + 1).padStart(2, "0")}
                  </span>
                  <h2>{section.label}</h2>
                </div>

                <div className={styles.questions}>
                  {section.questions.map((item) => (
                    <details key={item.q} className={styles.item}>
                      <summary className={styles.question}>
                        <span>{item.q}</span>
                        <span className={styles.toggle} aria-hidden="true" />
                      </summary>
                      <p className={styles.answer}>{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}

          </div>
        </div>

      </main>
    </MarketingShell>
  );
}

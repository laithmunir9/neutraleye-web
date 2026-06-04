import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import styles from "./page.module.css";

const methodologyCards = [
  {
    title: "Signals are named",
    body: "Tone, framing, sourcing, and omission are reviewed as distinct writing patterns — not merged into a single opaque score you have to take on faith.",
    points: [
      "Tone checks for emotional loading and overstated certainty.",
      "Framing checks what the article centers, backgrounds, or repeatedly emphasizes.",
      "Omission checks whether missing context could materially change the read."
    ]
  },
  {
    title: "Evidence travels with the result",
    body: "Every output includes the quoted language, source balance, and narrative choices that shaped it — so you can inspect the reasoning, not just accept the conclusion.",
    points: [
      "Quoted examples are included in the explanation.",
      "Attribution clarity and source mix are reviewed together.",
      "Recommended next reads add context rather than close the inquiry."
    ]
  },
  {
    title: "Confidence is kept separate",
    body: "The confidence score reflects how consistently signals repeat across the text — not a claim about whether the article is factually true.",
    points: [
      "High confidence usually means the same signal pattern repeats across the piece.",
      "Low confidence can mean the writing is mixed, short, or ambiguous.",
      "Confidence does not certify that a viewpoint is true or false."
    ]
  }
];

const resultReadingCards = [
  {
    title: "Start with the summary",
    body: "Read the top-level explanation first, then use the supporting sections to see what language and sourcing patterns shaped the result."
  },
  {
    title: "Use examples as evidence",
    body: "Examples of bias are meant to show the exact phrases or structures that triggered concern, not to act as isolated proof by themselves."
  },
  {
    title: "Treat recommendations as context prompts",
    body: "When the system suggests more reading, it is pointing to missing comparison context rather than claiming the question is settled."
  }
];

const auditRows = [
  {
    title: "Messy Input",
    detail: "Very short passages, failed extraction, navigation text, or blocked pages can weaken the read."
  },
  {
    title: "Rhetorical Edge Cases",
    detail: "Satire, irony, or unusual style can resemble bias signals even when the intent is different."
  },
  {
    title: "Scope of the Result",
    detail: "The result reflects patterns in the submitted text, not a universal judgment on the outlet, author, or topic."
  },
  {
    title: "Reader Judgment",
    detail: "NeutralEye works best when it helps a reader slow down, inspect the evidence, and compare context before concluding."
  }
];

const outputCards = [
  {
    title: "Examples of bias",
    body: "Quoted language and framing examples are surfaced so readers can inspect the rationale behind the result."
  },
  {
    title: "Suggested sources",
    body: "Comparison ideas and next-reading prompts help the reader widen context when the article feels one-sided or incomplete."
  }
];

export default function MethodologyPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1>Methodology</h1>
          <p className={styles.lead}>
            How to read a NeutralEye result — what the signals mean, how to use the evidence, and where the analysis
            has limits worth keeping in mind.
          </p>
        </section>

        <ScrollReveal>
          <section className={`${styles.section} ${styles.firstSection}`}>
            <div className={styles.cardRow}>
              {methodologyCards.map((card) => (
                <article key={card.title} className={styles.featureCard}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <ul>
                    {card.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Reading the result</p>
              <h2>Judgment comes first</h2>
              <p>
                NeutralEye works best when the result is read as an analytical aid: summary first, evidence second, and
                wider context whenever the story feels incomplete.
              </p>
            </div>

            <div className={styles.cardRow}>
              {resultReadingCards.map((card) => (
                <article key={card.title} className={styles.readingCard}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={`${styles.section} ${styles.auditSection}`}>
            <div className={styles.auditHeading}>
              <h2>Where care matters</h2>
            </div>

            <div className={styles.auditList}>
              {auditRows.map((row) => (
                <article key={row.title} className={styles.auditRow}>
                  <h3>{row.title}</h3>
                  <p>{row.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Output design</p>
              <h2>Results stay readable</h2>
              <p>
                The output is designed to make readers inspect the article more carefully, not to turn the analysis into a
                black box verdict.
              </p>
            </div>

            <div className={styles.outputRow}>
              {outputCards.map((card) => (
                <article key={card.title} className={styles.outputCard}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={styles.ctaSection}>
            <AnalyzerCta heading="Try it on a real article" label="Open Analyzer" />
          </section>
        </ScrollReveal>
      </main>
    </MarketingShell>
  );
}

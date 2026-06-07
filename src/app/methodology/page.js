import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import styles from "./page.module.css";

const directionItems = [
  {
    label: "Left-leaning",
    body: "Signals — tone, framing, sourcing, and omission — consistently pointed in a direction associated with left-of-center interpretation. This describes the pattern found in the text, not a judgment about the subject matter.",
  },
  {
    label: "Center",
    body: "Signals were balanced, contradictory, or too sparse for a clear directional pattern. A center result does not certify fairness — it means the analysis did not detect a dominant lean.",
  },
  {
    label: "Right-leaning",
    body: "Signals consistently pointed in a direction associated with right-of-center interpretation. Same rules apply: the label describes what was found in this specific text, not the outlet or author overall.",
  },
];

const confidenceItems = [
  {
    label: "High confidence",
    body: "The same signal pattern repeated consistently across most of the article — tone, framing, and sourcing all pointed the same way. A well-written opinion column can score high confidence because its structure is deliberately consistent.",
  },
  {
    label: "Low confidence",
    body: "Signals were mixed, thin, or contradictory. This can mean the article is genuinely balanced — but it can also mean the text was too short, the writing was inconsistent, or the story was still developing when it was filed.",
  },
];

const readingSteps = [
  {
    title: "Start with the summary",
    body: "Read the top-level explanation first, then use the supporting sections to see what language and sourcing patterns shaped the result.",
  },
  {
    title: "Use examples as evidence",
    body: "Quoted examples show the exact phrases or structures that triggered concern — not isolated proof by themselves. Check them against the article.",
  },
  {
    title: "Treat recommendations as prompts",
    body: "When the system suggests more reading, it's flagging a gap in context — not declaring the question settled.",
  },
];

const limitationRows = [
  {
    title: "Messy input",
    detail: "Very short passages, failed extraction, navigation text, or blocked pages can weaken the read significantly.",
  },
  {
    title: "Rhetorical edge cases",
    detail: "Satire, irony, or unusual writing style can resemble bias signals even when the intent is clearly different.",
  },
  {
    title: "Scope of the result",
    detail: "The result reflects patterns in this submitted text — not a universal judgment on the outlet, author, or topic.",
  },
  {
    title: "Reader judgment",
    detail: "The analysis is one data point. It works best as a prompt to slow down and inspect — not as a substitute for forming your own view.",
  },
];

export default function MethodologyPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <h1>How to read the analysis</h1>
          <p className={styles.lead}>
            A guide to interpreting what NeutralEye found — what the direction label means, how to
            weigh the confidence score, and where the analysis has limits worth keeping in mind.
          </p>
        </section>

        {/* ── Direction ── */}
        <ScrollReveal>
          <section className={`${styles.section} ${styles.firstSection}`}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Direction label</p>
              <h2>What the label means</h2>
              <p>
                The direction label describes the dominant pattern of signals found in the text — not
                a political verdict on the subject, outlet, or author. The same outlet can receive
                different labels across different articles.
              </p>
            </div>

            <div className={styles.spectrumWrap}>
              <div className={styles.spectrumTrack}>
                <div className={styles.spectrumFill} />
                <span className={styles.spectrumMark} style={{ left: "0%" }} />
                <span className={styles.spectrumMark} style={{ left: "50%" }} />
                <span className={styles.spectrumMark} style={{ left: "100%" }} />
              </div>
              <div className={styles.spectrumLabels}>
                <span>Left-leaning</span>
                <span>Center</span>
                <span>Right-leaning</span>
              </div>
            </div>

            <div className={styles.cardRow}>
              {directionItems.map((item) => (
                <article key={item.label} className={styles.defCard}>
                  <h3>{item.label}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── Confidence ── */}
        <ScrollReveal>
          <section className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Confidence score</p>
              <h2>Signal consistency, not truth</h2>
              <p>
                Confidence measures how clearly and consistently bias signals appeared across the
                submitted text — not whether the article is factually accurate or the journalist
                intended to mislead.
              </p>
            </div>
            <div className={styles.twoCol}>
              {confidenceItems.map((item) => (
                <article key={item.label} className={styles.defCard}>
                  <h3>{item.label}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── Reading the result ── */}
        <ScrollReveal>
          <section className={styles.section}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>How to use it</p>
              <h2>Judgment comes first</h2>
              <p>
                NeutralEye works best when the result is read as an analytical aid — summary first,
                evidence second, wider context whenever the story feels incomplete.
              </p>
            </div>
            <div className={styles.stepsCol}>
              {readingSteps.map((step, i) => (
                <article key={step.title} className={styles.stepRow}>
                  <span className={styles.stepIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── Limitations ── */}
        <ScrollReveal>
          <section className={`${styles.section} ${styles.auditSection}`}>
            <div className={styles.auditHeading}>
              <h2>Where the analysis has limits</h2>
            </div>
            <div className={styles.auditList}>
              {limitationRows.map((row) => (
                <article key={row.title} className={styles.auditRow}>
                  <h3>{row.title}</h3>
                  <p>{row.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── CTA ── */}
        <ScrollReveal>
          <section className={styles.ctaSection}>
            <AnalyzerCta heading="Try it on a real article" label="Open Analyzer" />
          </section>
        </ScrollReveal>

      </main>
    </MarketingShell>
  );
}

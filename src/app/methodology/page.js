import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "../marketing.module.css";

export const metadata = {
  title: "Methodology | NeutralEye",
  description:
    "How to read a NeutralEye result: what the direction label means, what confidence measures, and where the analysis has limits.",
};

const DIRECTION = [
  {
    label: "Left-leaning",
    body: "Tone, framing, sourcing, and omission consistently pointed in a direction associated with left-of-center interpretation. This describes the pattern found in the text, not a judgment about the subject matter.",
  },
  {
    label: "Center",
    body: "Signals were balanced, contradictory, or too sparse for a clear directional pattern. A center result does not certify fairness. It means no dominant lean was found.",
  },
  {
    label: "Right-leaning",
    body: "Signals consistently pointed in a direction associated with right-of-center interpretation. The same rule applies: the label describes this specific text, not the outlet or the author overall.",
  },
];

const CONFIDENCE = [
  {
    label: "High confidence",
    body: "The same signal pattern repeated across most of the article, with tone, framing, and sourcing pointed the same way. A well-written opinion column can score high precisely because its structure is deliberately consistent.",
  },
  {
    label: "Low confidence",
    body: "Signals were mixed, thin, or contradictory. That can mean the article is genuinely balanced, but it can also mean the text was short, the writing inconsistent, or the story still developing when it was filed.",
  },
];

const STEPS = [
  {
    title: "Start with the summary",
    body: "Read the top-level explanation first, then use the supporting sections to see what language and sourcing patterns shaped the result.",
  },
  {
    title: "Use examples as evidence",
    body: "Quoted examples show the exact phrases or structures that triggered the signal. They are evidence to check against the article, not proof on their own.",
  },
  {
    title: "Treat recommendations as prompts",
    body: "When the system suggests more reading, it is flagging a gap in context, not declaring the question settled.",
  },
];

const LIMITS = [
  {
    title: "Messy input",
    body: "Very short passages, failed extraction, navigation text, or blocked pages can weaken the read significantly.",
  },
  {
    title: "Rhetorical edge cases",
    body: "Satire, irony, or unusual style can resemble framing signals even when the intent is clearly different.",
  },
  {
    title: "Scope of the result",
    body: "The result reflects patterns in the submitted text, not a universal judgment on the outlet, the author, or the topic.",
  },
  {
    title: "Reader judgment",
    body: "The analysis is one data point. It works best as a prompt to slow down and inspect, not as a substitute for forming your own view.",
  },
];

export default function MethodologyPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        <section className={styles.hero}>
          <h1>How to read a result</h1>
          <p className={styles.lead}>
            A result has two numbers and a label, and all three are easy to misread. This page says
            what each one measures, and just as importantly, what it does not.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What the direction label means</h2>
          <div className={styles.measure}>
            <p>
              The label describes the pattern found in one piece of text. It is not a rating of the
              outlet, and running the same outlet twice can return two different labels.
            </p>
          </div>
          <ul className={styles.rows}>
            {DIRECTION.map((d) => (
              <li key={d.label} className={styles.row}>
                <h3 className={styles.rowTitle}>{d.label}</h3>
                <p className={styles.rowBody}>{d.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Confidence measures consistency, not truth</h2>
          <div className={styles.measure}>
            <p>
              This is the number most often read backwards. A low score is not a clean article. It
              is an article the analysis is less sure about, and saying so is more useful than
              rounding to a confident answer.
            </p>
          </div>
          <ul className={styles.rows}>
            {CONFIDENCE.map((c) => (
              <li key={c.label} className={styles.row}>
                <h3 className={styles.rowTitle}>{c.label}</h3>
                <p className={styles.rowBody}>{c.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Reading it in order</h2>
          <ol className={styles.rows}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${styles.row} ${styles.step}`}>
                <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
                <h3 className={styles.rowTitle}>{s.title}</h3>
                <p className={styles.rowBody}>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section}>
          <h2>Where the analysis has limits</h2>
          <ul className={styles.rows}>
            {LIMITS.map((l) => (
              <li key={l.title} className={styles.row}>
                <h3 className={styles.rowTitle}>{l.title}</h3>
                <p className={styles.rowBody}>{l.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.cta}>
          <h2>Run one and read it against this page</h2>
          <p>
            The labels make more sense with a result in front of you.
          </p>
          <div className={styles.actions}>
            <Link href="/analyze" className={styles.btnInk}>Open the analyzer</Link>
            <Link href="/how-it-works" className={styles.btnInkQuiet}>See how it works</Link>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "../marketing.module.css";

export const metadata = {
  title: "Methodology | NeutralEye",
  description:
    "What the analyzer returns, what each field measures, and the thresholds it applies before it reports anything at all.",
};

/* Every field below is the analyzer's real output contract, from the response
   schema in src/lib/analysis.js. This page previously documented a
   Left-leaning / Center / Right-leaning label with a 0.00-1.00 score, which the
   analyzer has never returned. `bias_level` is an internal enum and never
   reaches a reader, per the rule already stated in src/lib/biasLevel.js. */
const FIELDS = [
  {
    name: "Framing strength",
    body: "None, slight, moderate, heavy, or uncertain.",
  },
  {
    name: "Direction",
    body: "Toward or against a named subject in the story, or non-directional.",
  },
  {
    name: "Confidence",
    body: "0.00 to 1.00. How consistently the signals repeated.",
  },
  {
    name: "Quoted excerpts",
    body: "The journalist's own sentences, each tagged framing, language, sourcing, or attribution.",
  },
  {
    name: "Article type",
    body: "News, opinion, or analysis.",
  },
  {
    name: "Other coverage",
    body: "Articles on the same story from other outlets, never the one you submitted.",
  },
];

/* All four push toward saying nothing. Transcribed from the analysis rules in
   the prompt, not paraphrased from memory. */
const THRESHOLDS = [
  {
    title: "Minimum impact",
    body: "Signals that are minor, isolated, or purely stylistic set framing strength to none rather than being reported.",
  },
  {
    title: "Weak evidence",
    body: "Where the evidence is thin or ambiguous, the result is none or uncertain, and confidence is held below 0.40.",
  },
  {
    title: "High values are rare",
    body: "Above 0.85 is reserved for framing that is clear, repeated, and explicit in the text.",
  },
  {
    title: "No excerpt, no finding",
    body: "When framing strength is none, the excerpt list is empty. There is no path that returns a finding with nothing to show for it.",
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
            The analyzer returns six fields, and every one of them is narrower than it looks. This
            page says what each measures, what it refuses to measure, and the thresholds it applies
            before it will say anything at all.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What comes back</h2>
          <dl className={styles.fields}>
            {FIELDS.map((f) => (
              <div key={f.name} className={styles.field}>
                <dt className={styles.fieldName}>{f.name}</dt>
                <dd className={styles.fieldBody}>{f.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.section}>
          <h2>There is no left, centre, or right</h2>
          <div className={styles.measure}>
            <p>
              Direction names the subject the framing points at, not a political side. A result
              reads &ldquo;toward Honeywell&rdquo;, or &ldquo;against the plaintiff&rdquo;, or
              &ldquo;non-directional framing&rdquo;. It never reads &ldquo;left-leaning&rdquo;,
              because that is not a value the analyzer can return.
            </p>
            <p>
              That is a deliberate limit, not a missing feature. Placing an article on a political
              spectrum requires a fixed idea of where the centre sits, and one piece of text gives
              no way to establish that. Naming the subject the language favours is something you can
              check against the article in front of you. Placing it on a spectrum is not.
            </p>
            <p>
              Nothing here rates an outlet. The unit is one article, and the same publication
              returns different results on different stories.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Confidence measures consistency, not truth</h2>
          <div className={styles.measure}>
            <p>
              This is the number most often read backwards. It describes how consistently the
              signals repeated across the text. It is not a measure of how strongly framed the
              article is, and not a measure of how certain anyone should be.
            </p>
            <p>
              A well-written opinion column can return high confidence precisely because its
              structure is deliberately consistent, and that is not a finding against it. A low
              number is not a clean article either. It is an article the analysis is less sure
              about, and saying so is more useful than rounding to a confident answer.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>What it does when the evidence is thin</h2>
          <div className={styles.measure}>
            <p>Four rules run before a result is produced, and all four push toward saying nothing.</p>
          </div>
          <ul className={styles.rows}>
            {THRESHOLDS.map((t) => (
              <li key={t.title} className={styles.row}>
                <h3 className={styles.rowTitle}>{t.title}</h3>
                <p className={styles.rowBody}>{t.body}</p>
              </li>
            ))}
          </ul>
          <div className={styles.measure}>
            <p>
              The analyzer runs at temperature zero rather than sampling. That is what makes a
              second run comparable to the first. It is not a guarantee of an identical one, which
              is why a <Link href="/reports">coverage report</Link> runs the whole analysis twice
              and publishes only what appears in both passes.
            </p>
          </div>
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
            The fields make more sense with a result in front of you.
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

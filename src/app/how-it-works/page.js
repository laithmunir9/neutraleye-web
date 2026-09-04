import Link from "next/link";
import { BOOKING_URL } from "@/lib/content";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "../marketing.module.css";

export const metadata = {
  title: "How It Works | NeutralEye",
  description:
    "How a coverage report is produced: how the articles are gathered, how claims are extracted, what is checked against filing times, and why the whole thing runs twice.",
};

const STEPS = [
  {
    title: "You send the story",
    body: "A link to the story, and the coverage you want read if you already have it. If you do not, naming the story is enough and the coverage gets gathered for you.",
  },
  {
    title: "Every article is captured with its timestamps",
    body: "First published and last updated are recorded for each one. This is what later separates an outlet that chose not to report something from an outlet that had stopped updating before the fact existed.",
  },
  {
    title: "Claims are extracted by code, not by judgment",
    body: "Which claims get examined is decided deterministically, so the same set of articles produces the same set of claims. A model reads the articles; it does not get to choose what counts as a claim.",
  },
  {
    title: "Each outlet is checked against each claim",
    body: "Reported, omitted, contradicted, or not stated. A gap only counts where several other outlets carried the same fact, so one outlet mentioning something the rest did not is a difference in emphasis, not a coverage gap.",
  },
  {
    title: "The whole analysis runs twice",
    body: "Independently, end to end. Anything that appears in one pass and not the other is reported as unstable rather than presented as a finding.",
  },
  {
    title: "Quotes are verified against the source",
    body: "Every quote is checked against the original article text before it reaches the report, so nothing is attributed to the wrong outlet.",
  },
];

const NOT = [
  {
    title: "It does not rate outlets",
    body: "There is no score and no spectrum. Every finding is specific to one article about one story, and the same outlet reads differently across two stories.",
  },
  {
    title: "It does not check whether claims are true",
    body: "This describes how a story was assembled: what was carried, what was left out, and where an outlet's own text disagrees with its summary. Fact-checking is a different discipline.",
  },
  {
    title: "It is not media monitoring",
    body: "No mention counts, no sentiment, no volume dashboard. It is a close read of a small number of articles about one story.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        <section className={styles.hero}>
          <h1>How a report is produced</h1>
          <p className={styles.lead}>
            Every report follows the same sequence, and the order matters: filing times are
            established before absences are judged, claims are fixed before outlets are compared,
            and nothing reaches you that did not survive being run twice.
          </p>
          <div className={styles.actions}>
            <a href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer" className={styles.btn}>Book a demo</a>
            <Link href="/reports" className={styles.btnQuiet}>See a finished report</Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2>The sequence</h2>
          <div className={styles.measure}>
            <p>
              You get the report back within two business days. It is delivered as a service, so
              there is no account to create and nothing to learn.
            </p>
          </div>
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
          <h2>What it deliberately does not do</h2>
          <ul className={styles.rows}>
            {NOT.map((n) => (
              <li key={n.title} className={styles.row}>
                <h3 className={styles.rowTitle}>{n.title}</h3>
                <p className={styles.rowBody}>{n.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>The free tools run the same checks</h2>
          <div className={styles.measure}>
            <p>
              Tone, framing, attribution, source balance and omission are the same five signals in
              both places. The difference is scale: the tools read one article, and a report reads
              every outlet that covered the story and sets them against each other.
            </p>
            <p>
              If you want to see the method before you send anything, the analyzer is free and
              needs no account.
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/tools" className={styles.btnQuiet}>See the free tools</Link>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Bring a story you already know well</h2>
          <p>
            The fastest way to judge the output is on coverage you have read closely enough to
            argue with.
          </p>
          <div className={styles.actions}>
            <a href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer" className={styles.btn}>Book a demo</a>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}

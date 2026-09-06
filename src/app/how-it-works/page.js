import Link from "next/link";
import { BOOKING_URL } from "@/lib/content";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import ClaimPipeline from "@/components/how-it-works/ClaimPipeline";
import styles from "../marketing.module.css";

export const metadata = {
  title: "How It Works | NeutralEye",
  description:
    "How a coverage report is produced: how the articles are gathered, how claims are extracted, what is checked against filing times, and why the whole thing runs twice.",
};

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
              You send a link to the story, and the coverage you want read if you already have it.
              The report comes back within two business days. It is delivered as a service, so there
              is no account to create and nothing to learn.
            </p>
            <p>
              Before any of the below, every article&rsquo;s first-published and last-updated times
              are recorded. That is what separates an outlet that chose not to report something from
              one that had stopped updating before the fact existed, and it runs first, so an
              absence with a scheduling explanation never reaches the comparison at all.
            </p>
          </div>
        </section>

        {/* Full width, so the diagram uses the column the section headings leave
            empty rather than adding page length. */}
        <section className={styles.section}>
          <div className={styles.full}>
            <ClaimPipeline />
          </div>
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
            <Link href="/tools" className={styles.btnInkQuiet}>See the free tools</Link>
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

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { EXTENSION_URL, BOOKING_URL } from "@/lib/content";
import styles from "../marketing.module.css";

export const metadata = {
  title: "Tools | NeutralEye",
  description:
    "Two free tools built on the same five checks: a reading companion for articles other people wrote, and a writing companion for drafts you are about to publish.",
};

/* The two tools differ on exactly one axis, who wrote the text, and the old
   page spent 264 words of prose establishing that. Set side by side the
   difference is visible without being argued. Every cell is filled: the
   writing companion is not built, and the table says so in the row where a
   reader would look for it rather than in a paragraph further down. */
const COMPARE = [
  {
    label: "The text",
    reading: "Someone else's, already published.",
    writing: "Yours, before anyone else sees it.",
  },
  {
    label: "The question",
    reading: "How did this piece land?",
    writing: "How is mine about to land?",
  },
  {
    label: "Where it runs",
    reading: "The analyzer on the web, or the Chrome extension in your toolbar.",
    writing: "In development. Nothing to sign up for.",
  },
];

const READING = [
  {
    title: "What it returns",
    body: "Framing strength, a direction, a confidence value, and the quoted sentences behind each of the five signals, plus other coverage of the same story to read alongside.",
  },
  {
    title: "What it costs",
    body: "Ten analyses a day, free. No card, and no trial that turns into a bill. Signing in only adds saved history.",
  },
  {
    title: "What happens to the text",
    body: "Article text is processed to produce the result and is not stored by default. Only signed-in users keep history, and only for articles they deliberately run.",
  },
];

export default function ToolsPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        <section className={styles.hero}>
          <h1>One method, pointed two ways</h1>
          <p className={styles.lead}>
            The same five checks, tone, framing, attribution, source balance, and omission, run
            against text someone else wrote or text you are about to publish. Both are free. The
            coverage reports are this same read, run across every outlet at once.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Reading and writing</h2>
          <div className={styles.compare}>
            <div className={styles.compareHead} aria-hidden="true">
              <span />
              <span>Reading</span>
              <span>Writing</span>
            </div>
            {COMPARE.map((c) => (
              <div key={c.label} className={styles.compareRow}>
                <span className={styles.compareLabel}>{c.label}</span>
                <span className={styles.compareCell}>
                  <span className={styles.compareTag}>Reading</span>
                  {c.reading}
                </span>
                <span className={styles.compareCell}>
                  <span className={styles.compareTag}>Writing</span>
                  {c.writing}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.measure}>
            <p>
              The writing companion is listed here because it is the reason the method is built the
              way it is, not as something you can use today. It will not draft for you when it
              arrives. It marks the lines where your framing is doing the work and stops there.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>What the analyzer gives you</h2>
          <ul className={styles.rows}>
            {READING.map((r) => (
              <li key={r.title} className={styles.row}>
                <h3 className={styles.rowTitle}>{r.title}</h3>
                <p className={styles.rowBody}>{r.body}</p>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Link href="/analyze" className={styles.btnInk}>Open the analyzer</Link>
            <a
              href={EXTENSION_URL}
              className={styles.btnInkQuiet}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add the Chrome extension
            </a>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>The same read, across every outlet</h2>
          <p>
            When the question is not one article but how a whole story was covered, that is the
            reports service. Bring a story you already know well and we will go through what it
            finds.
          </p>
          <div className={styles.actions}>
            <a href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer" className={styles.btn}>Book a demo</a>
            <Link href="/reports" className={styles.btnQuiet}>See a finished report</Link>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}

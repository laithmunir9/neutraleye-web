import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { EXTENSION_URL, BOOKING_URL } from "@/lib/content";
import styles from "../marketing.module.css";

export const metadata = {
  title: "Tools | NeutralEye",
  description:
    "Two free tools built on the same five checks: a reading companion for articles other people wrote, and a writing companion for drafts you are about to publish.",
};

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
          <h2>Reading</h2>
          <div className={styles.measure}>
            <p>
              Paste an article or give it a URL, and it marks up the language that carries the
              framing, with the exact sentence quoted next to every signal it raises. There is no
              account to create and nothing to configure.
            </p>
            <p>
              The Chrome extension is the same analysis in your toolbar, so you can run it on
              whatever you are already reading without switching tabs.
            </p>
          </div>
          <ul className={styles.rows}>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>What it returns</h3>
              <p className={styles.rowBody}>
                A direction label, a confidence score, and the quoted language behind each of the
                five signals, plus other coverage of the same story to read alongside.
              </p>
            </li>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>What it costs</h3>
              <p className={styles.rowBody}>
                Ten analyses a day, free, during the beta. No card, and no trial that turns into a
                bill. Signing in only adds saved history.
              </p>
            </li>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>What happens to the text</h3>
              <p className={styles.rowBody}>
                Article text is processed to produce the result and is not stored by default. Only
                signed-in users keep history, and only for articles they deliberately run.
              </p>
            </li>
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

        <section className={styles.section}>
          <h2>Writing</h2>
          <div className={styles.measure}>
            <p>
              The same five checks pointed at a draft before anyone else reads it. Where the
              reading tool tells you how a piece landed, the writing tool tells you how yours is
              about to land: which claims carry no attribution, where one side gets a sentence and
              the other gets four paragraphs, and which figure a reader will take away.
            </p>
            <p>
              It is in development. It is listed here because it is the reason the method is built
              the way it is, not as something you can use today.
            </p>
          </div>
          <ul className={styles.rows}>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>Not yet available</h3>
              <p className={styles.rowBody}>
                No waitlist and no email capture for it. When it works, it will appear here.
              </p>
            </li>
          </ul>
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

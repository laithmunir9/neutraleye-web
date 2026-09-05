import Annotation from "@/components/for-comms/Annotation";
import BookACall from "@/components/for-comms/BookACall";
import CoverageMatrix from "@/components/for-comms/CoverageMatrix";
import matrix from "@/components/for-comms/CoverageMatrix.module.css";
import ForCommsFooter from "@/components/for-comms/ForCommsFooter";
import ForCommsHeader from "@/components/for-comms/ForCommsHeader";
import PendingLink from "@/components/for-comms/PendingLink";
import { BOOKING_URL } from "@/lib/content";
import styles from "./page.module.css";

// The 24/7 Wall St piece the worked example is drawn from, plus a Wayback
// snapshot taken 8 August 2026. Both figures quoted below were confirmed
// present in the snapshot, so the example still checks out if the live
// article is later edited.
export const ARTICLE_URL =
  "https://247wallst.com/investing/2026/08/07/honeywell-aerospace-tumbles-on-disappointing-debut-report-but-bull-case-remains-intact/";
export const ARCHIVE_URL =
  "https://web.archive.org/web/20260808084259/https://247wallst.com/investing/2026/08/07/honeywell-aerospace-tumbles-on-disappointing-debut-report-but-bull-case-remains-intact/";



export default function ForCommsPage() {
  return (
    <>
      <ForCommsHeader calendarUrl={BOOKING_URL} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.h1}>
            See how one story was covered across every outlet that covered it.
          </h1>
          <p className={styles.lead}>
            Send the coverage of a single story. Get back what each outlet reported, what each one
            left out, and where an outlet's own text does not support its summary. Every quote is
            checked against the source before it reaches you.
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <h2 className={styles.cardHeading}>A worked example</h2>
            <p className={styles.cardBody}>
              24/7 Wall St's summary of Honeywell Aerospace's earnings said shares{" "}
              <Annotation>crashed 34% after the earnings report</Annotation>. The article's own body
              says shares <Annotation>fell 23.2% in the session</Annotation> and were{" "}
              <Annotation>down 34.3% over the past month</Annotation>. The 34% is the one month
              decline, presented as the reaction to earnings, with no time window stated. Both
              figures are in the same article, so you can check this in about thirty seconds.
            </p>
            <p className={styles.cardMuted}>
              This is what the tool surfaced from the coverage, not a complaint about the outlet.
            </p>
            <p className={styles.cardMeta}>
              <span>Checked 1 September 2026</span>
              <span className={styles.metaSep} aria-hidden="true">
                &middot;
              </span>
              <PendingLink href={ARTICLE_URL}>read the article</PendingLink>
              <span className={styles.metaSep} aria-hidden="true">
                &middot;
              </span>
              <PendingLink href={ARCHIVE_URL}>archived copy</PendingLink>
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>What you get back</h2>
          <CoverageMatrix />
          <ul className={`${styles.columns} ${styles.wide}`}>
            <li className={styles.column}>
              <h3 className={styles.columnLabel}>
                <span className={`${matrix.state} ${matrix.reported}`}>Reported</span>
              </h3>
              <p className={styles.columnBody}>
                A matrix of the claims each outlet made, laid out side by side.
              </p>
            </li>
            <li className={styles.column}>
              <h3 className={styles.columnLabel}>
                <span className={`${matrix.state} ${matrix.omitted}`}>Omitted</span>
              </h3>
              <p className={styles.columnBody}>
                What appeared in some outlets and not in others.
              </p>
            </li>
            <li className={styles.column}>
              <h3 className={styles.columnLabel}>
                <span className={`${matrix.state} ${matrix.diverges}`}>Diverges</span>
              </h3>
              <p className={styles.columnBody}>
                Where two outlets give different figures for the same fact.
              </p>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>The same figures, different conclusions</h2>
          <p className={styles.body}>
            Across coverage of Honeywell Aerospace's earnings, five outlets reported the same
            adjusted EPS, the same revenue, and the same guidance cut. CNBC's Investing Club called
            it a sell, citing damaged management credibility. 24/7 Wall St called it a hold, with
            the long term bull case intact. Same numbers, opposite reads.
          </p>
          <ul className={styles.outlets}>
            <li className={styles.outlet}>CNBC Investing Club, sell</li>
            <li className={styles.outlet}>24/7 Wall St, hold</li>
            <li className={styles.outlet}>The Motley Fool, hold</li>
            <li className={styles.outlet}>Quartz, no recommendation</li>
            <li className={styles.outlet}>AeroTime, no recommendation</li>
          </ul>
          <p className={styles.muted}>Two outlets made no recommendation at all.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Why the output holds up</h2>
          <ul className={styles.reasons}>
            <li className={styles.reason}>
              Every quote is verified against the source text before it appears in a report. Nothing
              gets attributed to the wrong article.
            </li>
            <li className={styles.reason}>
              Which claims get compared is decided by deterministic code, not by model judgment, so
              the same set of articles produces the same set of claims.
            </li>
            <li className={styles.reason}>
              Each comparison runs twice and reports a stability score. Where the two runs differ,
              you see it, rather than being told the result is reproducible.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>What this is not</h2>
          <p className={styles.body}>
            Not media monitoring, not sentiment scoring, and not a volume dashboard. It does not
            tell you how many mentions you got or whether the tone was positive. It is a close read
            of a small number of articles about one story, and it answers a narrower question than a
            monitoring tool does.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>How it works</h2>
          <p className={styles.body}>
            You send the story and the coverage you want compared, or just the story and I find the
            coverage. You get a report back within two business days. This is delivered as a
            service. There is no account to create and nothing to learn.
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <h2 className={styles.cardHeading}>Bring a story you already know well</h2>
            <p className={styles.cardBody}>
              The fastest way to judge this is on coverage you have already read closely. Bring one
              and we will go through what it finds.
            </p>
            <div className={styles.cardAction}>
              <BookACall href={BOOKING_URL} size="large" />
            </div>
          </div>
        </section>
      </main>

      <ForCommsFooter />
    </>
  );
}

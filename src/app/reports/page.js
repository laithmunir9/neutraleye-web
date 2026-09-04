import Link from "next/link";
import { BOOKING_URL } from "@/lib/content";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import Annotation from "@/components/for-comms/Annotation";
import CoverageMatrix from "@/components/for-comms/CoverageMatrix";
import styles from "../marketing.module.css";

export const metadata = {
  title: "Reports | NeutralEye",
  description:
    "Two finished coverage reports, on a corporate earnings story and a contested primary, with the findings and the method that produced them.",
};

// Both drawn from completed runs. Nothing here is illustrative.
const MICHIGAN_CONTRADICTIONS = [
  {
    claim: "More than $80 million was spent on the primary overall.",
    against: "The Detroit Free Press says the exact amount spent by campaigns and outside allies was not yet known.",
  },
  {
    claim: "Stevens and her allies outspent El-Sayed and his allies on advertising by about nine to one.",
    against: "Fox News quotes El-Sayed putting the disparity at eleven to one.",
  },
];

export default function ReportsPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        <section className={styles.hero}>
          <h1>Two finished reports</h1>
          <p className={styles.lead}>
            One corporate earnings story, one contested primary. Both are real runs on real
            coverage, shown with the findings they produced and the checks that had to pass before
            a finding was allowed to appear.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Honeywell Aerospace cuts its outlook</h2>
          <div className={styles.measure}>
            <p>
              Five outlets covered the same results on 5 August 2026. They agreed on the numbers
              and disagreed on what the numbers meant, ranging from an explicit sell decision to an
              intact bull case.
            </p>
            <p>
              The finding that travels furthest is not a disagreement between outlets. It is a
              disagreement inside one of them.
            </p>
          </div>

          <figure className={styles.exhibit}>
            <p className={styles.exhibitBody}>
              24/7 Wall St&rsquo;s summary said shares{" "}
              <Annotation>crashed 34% after the earnings report</Annotation>. The article&rsquo;s
              own body says shares <Annotation>fell 23.2% in the session</Annotation> and were{" "}
              <Annotation>down 34.3% over the past month</Annotation>. The unqualified number is
              the one a reader takes away, and it sits 11.1 points from the one the body supports.
            </p>
            <figcaption className={styles.exhibitMeta}>
              Both figures are in the same article. This takes about thirty seconds to check.
            </figcaption>
          </figure>

          <CoverageMatrix />
        </section>

        <section className={styles.section}>
          <h2>A contested primary</h2>
          <div className={styles.measure}>
            <p>
              NBC News, Al Jazeera, Fox News, the Associated Press and the Detroit Free Press
              covered the Michigan Democratic Senate primary called on 5 August 2026. All five
              agreed on the result. The divergence was in which story it was: evidence about
              progressive viability, a defeat for AIPAC, or a Republican opportunity.
            </p>
            <p>
              This is the harder case, and it is the one worth judging the method on. The report
              describes what each outlet foregrounded and what it left out. It does not rate the
              outlets, and it does not place them on a spectrum.
            </p>
          </div>

          <ul className={styles.rows}>
            {MICHIGAN_CONTRADICTIONS.map((c) => (
              <li key={c.claim} className={styles.row}>
                <h3 className={styles.rowTitle}>{c.claim}</h3>
                <p className={styles.rowBody}>{c.against}</p>
              </li>
            ))}
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>A 12.7 hour update gap explained several absences</h3>
              <p className={styles.rowBody}>
                Later statements, advertising commitments and unity plans were missing from the
                earliest filings. Those absences were excluded from the findings rather than
                counted against the outlet, because the article had stopped updating before the
                material existed.
              </p>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>What had to be true before a finding appeared</h2>
          <ul className={styles.rows}>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>It reproduced across two independent passes</h3>
              <p className={styles.rowBody}>
                The whole analysis runs twice. A finding that appears in one pass and not the other
                is reported as unstable rather than presented as a result.
              </p>
            </li>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>Filing times were checked first</h3>
              <p className={styles.rowBody}>
                Every article&rsquo;s first-published and last-updated timestamps are recorded. An
                absence explained by when an outlet filed is excluded, not counted as an omission.
              </p>
            </li>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>Several outlets had to carry the claim</h3>
              <p className={styles.rowBody}>
                A gap counts only where other outlets reported the same fact. One outlet mentioning
                something the others did not is a difference in emphasis, not a coverage gap.
              </p>
            </li>
            <li className={styles.row}>
              <h3 className={styles.rowTitle}>Every quote was checked against the source</h3>
              <p className={styles.rowBody}>
                Quotes are verified against the original article text before they reach a report,
                so nothing is attributed to the wrong outlet.
              </p>
            </li>
          </ul>
        </section>

        <section className={styles.cta}>
          <h2>Bring a story you already know well</h2>
          <p>
            The fastest way to judge this is on coverage you have read closely enough to argue
            with. Bring one and we will go through what it finds.
          </p>
          <div className={styles.actions}>
            <a href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer" className={styles.btn}>Book a demo</a>
            <Link href="/how-it-works" className={styles.btnQuiet}>How the analysis works</Link>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}

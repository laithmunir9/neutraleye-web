import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import Interlinear, { Line, Mark, Note } from "@/components/home/Interlinear";
import CoverageMatrixLive from "@/components/home/CoverageMatrixLive";
import FiveChecks from "@/components/home/FiveChecks";
import MethodCharts from "@/components/home/MethodCharts";
import { BOOKING_URL, EXTENSION_URL } from "@/lib/content";
import styles from "./page.module.css";

export const metadata = {
  title: "NeutralEye | How Every Outlet Covered Your Story",
  description:
    "A written report comparing how each outlet covered one story: what they foregrounded, what they left out, and whose voices they used. For communications and investor relations teams.",
};

/* The live article the evidence example is drawn from, read from the run
   manifest, plus a Wayback capture taken 8 August 2026. The figure quoted was
   confirmed present in that snapshot, so the finding stays checkable if the
   live article is later edited. */
const ARTICLE_URL =
  "https://247wallst.com/investing/2026/08/07/honeywell-aerospace-tumbles-on-disappointing-debut-report-but-bull-case-remains-intact/";
const ARCHIVE_URL =
  "https://web.archive.org/web/20260808084259/https://247wallst.com/investing/2026/08/07/honeywell-aerospace-tumbles-on-disappointing-debut-report-but-bull-case-remains-intact/";

export default function Home() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* The page is pointed at the coverage report, so the hero demonstrates
            the report rather than the free reading tools. The matrix is the
            deliverable in miniature: every claim in a story, set against every
            outlet, interrogatable. */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.h1}>Your story, as each outlet actually told it.</h1>
            <p className={styles.lead}>
              A written report comparing how every outlet covered one story: what each one
              foregrounded, what it left out that the others carried, and whose voices it used.
              Every claim traces to a verbatim span in the article that carried it.
            </p>
            <div className={styles.actions}>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className={styles.btn}>
                Request a report for your story
              </a>
              <Link href="/reports" className={styles.btnRule}>See a finished report</Link>
            </div>
            <p className={styles.heroFoot}>
              For communications and investor relations teams. Reports describe editorial choices.
              They do not rate outlets or place them on a spectrum.
            </p>
          </div>

          {/* The claim on the left says every finding traces to a span. This is
              that, on the right, on a real article, rather than a paragraph
              asserting it. */}
          <figure className={styles.heroDemo}>
            <figcaption className={styles.source}>24/7 Wall St, filed 7 August 2026</figcaption>

            <Interlinear>
              <Line>
                &ldquo;HONA shares <Mark step={0}>crashed 34%</Mark>{" "}
                after adjusted EPS fell 32% and management slashed full-year organic growth
                guidance&rdquo;
              </Line>
              <Note label="No timeframe" step={0}>
                The session move was 23.2%. The 34% is the monthly figure, printed in the line a
                reader scans for the day.
              </Note>
            </Interlinear>

            <p className={styles.sources}>
              <a href={ARTICLE_URL} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                Read the article
              </a>
              <a href={ARCHIVE_URL} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                Archived copy
              </a>
            </p>
          </figure>
        </section>

        <section className={styles.matrix} id="method">
          {/* Deliberately not a second display headline. The h1 above makes the
              claim; a 46px heading here competed with it and pushed the live
              matrix, which is the actual demonstration, below the fold. */}
          <div className={styles.matrixIntro}>
            <h2 className={styles.matrixHeading}>
              One story, five outlets, every claim set against each of them.
            </h2>
            <p className={styles.matrixLead}>
              From a real report. Two of these outlets told readers a different number was expected
              for the same quarter. Pick a cell to see what the analysis holds for it.
            </p>
          </div>
          <CoverageMatrixLive />
        </section>

        <section className={styles.checks}>
          <div className={styles.checksIntro}>
            <h2 className={styles.h2}>Five checks, run against every outlet</h2>
            <p className={styles.checksLead}>
              Each article is read on its own first, then set against the others. Omission is the
              check that needs the whole set: a claim only counts as missing when other outlets
              carried it.
            </p>
          </div>
          <div className={styles.checksBody}>
            <FiveChecks />
          </div>
        </section>

        <section className={styles.charts}>
          <MethodCharts />
        </section>

        {/* The free tools are proof the method works, kept deliberately small and
            last. Ink throughout: these are actions a reader takes themselves. */}
        <section className={styles.tools}>
          <div className={styles.toolsInner}>
            <h2 className={styles.toolsHeading}>The same method, free, on a single article</h2>
            <p className={styles.toolsBody}>
              The analyzer runs the five checks on one article you paste. The Chrome extension does
              it on the page in front of you. Both are free, and they are how most people meet the
              method before commissioning anything.
            </p>
            <div className={styles.actions}>
              <Link href="/analyze" className={styles.btnInk}>Open the analyzer</Link>
              <a
                href={EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnInkRule}
              >
                Add the Chrome extension
              </a>
            </div>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}

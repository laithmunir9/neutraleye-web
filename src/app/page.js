import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import Interlinear, { Line, Mark, Note } from "@/components/home/Interlinear";
import CoverageMatrixLive from "@/components/home/CoverageMatrixLive";
import MethodCharts from "@/components/home/MethodCharts";
import { BOOKING_URL, EXTENSION_URL } from "@/lib/content";
import styles from "./page.module.css";

export const metadata = {
  title: "NeutralEye | See How an Article Frames the Story",
  description:
    "NeutralEye reads an article and shows the choices behind it. Framing analysis for communications and investor relations teams, and free tools for anyone reading.",
};

/* The live article the hero finding is drawn from, read from the run manifest,
   plus a Wayback capture taken 8 August 2026. Both figures quoted in the hero
   were confirmed present in that snapshot, so the finding stays checkable if
   the live article is later edited. */
const ARTICLE_URL =
  "https://247wallst.com/investing/2026/08/07/honeywell-aerospace-tumbles-on-disappointing-debut-report-but-bull-case-remains-intact/";
const ARCHIVE_URL =
  "https://web.archive.org/web/20260808084259/https://247wallst.com/investing/2026/08/07/honeywell-aerospace-tumbles-on-disappointing-debut-report-but-bull-case-remains-intact/";

export default function Home() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>Framing analysis</p>
          <h1 className={styles.h1}>
            The number a reader takes away is not always the number the article supports.
          </h1>
          <p className={styles.lead}>
            NeutralEye reads an article and shows the choices behind it. Here is one, found in a
            report run over five outlets covering the same earnings story.
          </p>
        </section>

        <section className={styles.finding}>
          <div className={styles.findingMain}>
            <p className={styles.source}>24/7 Wall St, filed 7 August 2026</p>

            <Interlinear>
              <Line>
                &ldquo;HONA shares <Mark step={0}>crashed 34%</Mark>{" "}
                after adjusted EPS fell 32% and
                management slashed full-year organic growth guidance&rdquo;
              </Line>
              <Note label="No period stated" step={0}>
                This is the summary line, and 34% is the one figure in the article with no timeframe
                attached to it.
              </Note>

              <Line>
                Further down, the same article: shares{" "}
                <Mark step={1}>&ldquo;fell 23.2% in the most recent session&rdquo;</Mark>{" "}
                and &ldquo;are down 34.3% over the past month&rdquo;.
              </Line>
              <Note label="11.1 points apart" step={1}>
                The session move is 23.2%. The 34% in the summary is close to the monthly figure,
                presented where a reader looks for the day. The unqualified number is the one that
                carries.
              </Note>
            </Interlinear>

            <p className={styles.sources}>
              <a
                href={ARTICLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                Read the article
              </a>
              <span className={styles.sourceSep} aria-hidden="true">&middot;</span>
              {ARCHIVE_URL ? (
                <a
                  href={ARCHIVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  Archived copy
                </a>
              ) : (
                <span className={styles.needsUrl}>
                  Archived copy <span className={styles.needsUrlFlag}>NEEDS URL</span>
                </span>
              )}
            </p>
          </div>

          <div className={styles.findingAside}>
            <p className={styles.asideLead}>
              Both figures are in the same article, so this takes about thirty seconds to check.
            </p>
            <p className={styles.asideNote}>
              The analysis opens inside the paragraph, at the line it is about. Nothing is scored,
              and no outlet is rated.
            </p>
          </div>
        </section>

        <section className={styles.doors}>
          <div className={styles.doorsInner}>
            <h2 className={styles.doorsHeading}>
              The same checks, pointed two ways. At someone else&rsquo;s article, or at your own
              draft.
            </h2>

            <div className={styles.doorsGrid}>
              <div className={styles.door}>
                <p className={styles.doorLabel}>Free tools</p>
                <h3 className={styles.doorTitle}>Read with the margin filled in</h3>
                <p className={styles.doorBody}>
                  The extension marks the lines that carry framing choices and sets the note under
                  the line, on the article in front of you. For anything outside the browser, paste
                  a link into the analyzer and get the same reading back.
                </p>
                <div className={styles.actions}>
                  <a
                    href={EXTENSION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btn}
                  >
                    Add to Chrome
                  </a>
                  <Link href="/analyze" className={styles.btnRule}>Paste a link instead</Link>
                </div>
                <p className={styles.doorFoot}>Free. No account needed to read.</p>

                <div className={styles.companion}>
                  <h3 className={styles.companionTitle}>
                    The writing companion will not draft for you.
                  </h3>
                  <p className={styles.doorBody}>
                    It runs the same checks on your own draft, marks the lines where your framing is
                    doing the work, and stops there. The refusal is the design. It is in build now.
                  </p>
                </div>
              </div>

              <div className={styles.door} id="reports">
                <p className={styles.doorLabel}>Coverage reports</p>
                <h3 className={styles.doorTitle}>A written report on how your story was covered</h3>
                <p className={styles.doorBody}>
                  For communications and investor relations teams. Several outlets on one story,
                  read separately and then set against each other: what each one foregrounded, what
                  it left out that others carried, whose voices it included, and where the accounts
                  diverge.
                </p>
                <p className={styles.doorBody}>
                  Every claim is traced to a verbatim span in the article that carried it. Reports
                  describe editorial choices. They do not rate outlets or place them on a spectrum.
                </p>
                <div className={styles.actions}>
                  <Link href="/reports" className={styles.btn}>See a full report</Link>
                  <a
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnRule}
                  >
                    Request one for your story
                  </a>
                </div>
                <p className={styles.doorFoot}>
                  The Honeywell analysis below is one of these, run over five outlets.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.matrix} id="method">
          <div className={styles.matrixIntro}>
            <p className={styles.eyebrowSmall}>One story, five outlets</p>
            <h2 className={styles.h2}>
              Two outlets covering the same quarter told readers a different number was expected.
            </h2>
            <p className={styles.matrixLead}>
              Every claim in the story, set against every outlet. Pick a cell to see what the
              analysis holds for it.
            </p>
          </div>
          <CoverageMatrixLive />
        </section>

        <section className={styles.charts}>
          <MethodCharts />
        </section>

      </main>
    </MarketingShell>
  );
}

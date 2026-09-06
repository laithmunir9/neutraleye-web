import Annotation from "@/components/Annotation/Annotation";
import styles from "./ClaimPipeline.module.css";

/**
 * The pipeline, drawn by running it on one real claim rather than described.
 *
 * Everything here is transcribed from the completed Honeywell run that the
 * homepage matrix and MethodCharts already draw from: the two verbatim spans,
 * the five cell states, and the 252 of 252 quotation tally. Nothing is
 * illustrative, and no per-stage counts appear because the run manifest is not
 * in this repo. If those numbers arrive, they go under each stage name.
 *
 * A six-box conveyor with arrows would have carried no more information than
 * the numbered list this replaced. What a reader cannot take on trust is the
 * merge, so that is the one step with a drawn connector: two different wordings
 * of the same fact, carrying two different figures, resolving to one claim.
 * Everywhere else the reading order carries the sequence.
 *
 * Static at rest. The homepage already owns the site's one orchestrated moment,
 * and a diagram that has to animate before it can be understood is a diagram
 * that does not work.
 */

const OUTLETS = [
  "CNBC Investing Club",
  "The Motley Fool",
  "Quartz",
  "AeroTime",
  "24/7 Wall St",
];

const SPANS = [
  { outlet: "CNBC Investing Club", quote: "an adjusted EPS estimate of $2.11" },
  { outlet: "The Motley Fool", quote: "the expected figure was $2.13 per share" },
];

/* The same words the live coverage matrix uses. "Diverges" rather than
   "Contradicted": contradicted is an accusation about an outlet, diverges is an
   observation about two texts. */
const CELLS = [
  { outlet: "CNBC", state: "Diverges", quiet: false },
  { outlet: "Motley Fool", state: "Diverges", quiet: false },
  { outlet: "Quartz", state: "Not stated", quiet: true },
  { outlet: "AeroTime", state: "Not stated", quiet: true },
  { outlet: "24/7 Wall St", state: "Not stated", quiet: true },
];

export default function ClaimPipeline() {
  return (
    <figure className={styles.wrap}>
      <div className={styles.pipe}>

        <div className={styles.stage}>
          <h3 className={styles.stageName}>The articles</h3>
          <div className={styles.stageBody}>
            <ul className={styles.outletList}>
              {OUTLETS.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </div>
        </div>

        <div className={styles.stage}>
          <h3 className={styles.stageName}>Claims extracted</h3>
          <div className={styles.stageBody}>
            {SPANS.map((s) => (
              <p key={s.outlet} className={styles.span}>
                <span className={styles.spanOutlet}>{s.outlet}</span>
                <span className={styles.spanQuote}>&ldquo;{s.quote}&rdquo;</span>
              </p>
            ))}
          </div>
        </div>

        <div className={styles.stage}>
          <h3 className={styles.stageName}>Merged</h3>
          <div className={styles.stageBody}>
            <p className={styles.figures} aria-hidden="true">
              <span>$2.11</span><span>$2.13</span>
            </p>
            <svg
              className={styles.brace}
              viewBox="0 0 100 24"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M 18 1 V 11 H 82 V 1" vectorEffect="non-scaling-stroke" />
              <path d="M 50 11 V 23" vectorEffect="non-scaling-stroke" />
            </svg>
            <p className={styles.claim}>Adjusted EPS estimate for the quarter.</p>
            <p className={styles.note}>
              Two wordings, two different figures, one claim. The verbatim sentence stays attached
              to it.
            </p>
          </div>
        </div>

        <div className={styles.stage}>
          <h3 className={styles.stageName}>The matrix</h3>
          <div className={styles.stageBody}>
            <ul className={styles.row}>
              {CELLS.map((c) => (
                <li key={c.outlet} className={styles.cell}>
                  <span className={styles.cellOutlet}>{c.outlet}</span>
                  <span className={`${styles.cellState} ${c.quiet ? styles.quiet : ""}`}>
                    {c.state}
                  </span>
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              The analysis records the divergence and does not resolve which figure was right.
            </p>
          </div>
        </div>

        <div className={styles.stage}>
          <h3 className={styles.stageName}>Quotes checked</h3>
          <div className={styles.stageBody}>
            <p className={styles.check}>Both spans located verbatim in the source articles.</p>
            <p className={styles.tally}><Annotation>252 of 252</Annotation> on this run</p>
          </div>
        </div>

        <div className={styles.stage}>
          <h3 className={styles.stageName}>Two passes</h3>
          <div className={styles.stageBody}>
            <p className={styles.pass}>
              <span className={styles.passBar} aria-hidden="true" />
              <span className={styles.passLabel}>Pass one</span>
            </p>
            <p className={styles.pass}>
              <span className={styles.passBar} aria-hidden="true" />
              <span className={styles.passLabel}>Pass two</span>
            </p>
            <p className={styles.published}>Present in both, so published.</p>
          </div>
        </div>

      </div>

      <figcaption className={styles.foot}>
        This is the only one of the report&rsquo;s five claims where two outlets carried the same
        fact and disagreed on it; the other four reached the matrix as omissions.
      </figcaption>
    </figure>
  );
}

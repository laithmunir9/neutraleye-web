import styles from "./CoverageMatrix.module.css";

/**
 * The deliverable itself, rendered from the same Honeywell Aerospace coverage
 * the worked example above draws on. Data is transcribed from the report that
 * ran on 5 August 2026, so the outlets here match the list further down the
 * page exactly.
 *
 * Four states, escalating by ink rather than by hue: "reported" recedes,
 * "omitted" is tinted, "contradicted" is solid. The reader's eye should land
 * on the findings, not on the baseline.
 */

const OUTLETS = [
  "CNBC Investing Club",
  "The Motley Fool",
  "Quartz",
  "AeroTime",
  "24/7 Wall St",
];

const ROWS = [
  {
    claim: "Backlog increased 9% year over year.",
    cells: ["omitted", "reported", "reported", "reported", "absent"],
  },
  {
    claim: "Backlog was approximately $18.2 billion.",
    cells: ["omitted", "absent", "reported", "reported", "reported"],
  },
  {
    claim: "Commercial aftermarket sales increased 8%.",
    cells: ["omitted", "absent", "reported", "reported", "reported"],
  },
  {
    claim: "Management said customer demand remained strong.",
    cells: ["reported", "reported", "omitted", "reported", "absent"],
  },
  {
    claim: "Adjusted EPS estimate: CNBC cited $2.11 per share.",
    cells: ["contradicted", "contradicted", "absent", "absent", "absent"],
  },
];

const LABELS = {
  reported: "Reported",
  omitted: "Omitted",
  contradicted: "Contradicted",
  absent: "not stated",
};

export default function CoverageMatrix() {
  return (
    <figure className={styles.figure}>
      {/* tabIndex makes the overflow region reachable by keyboard, which is
          the only way to read the right-hand outlets on a narrow screen. */}
      <div className={styles.scroller} tabIndex={0} role="group" aria-labelledby="matrix-caption">
        <table className={styles.table}>
          <caption className={styles.srOnly} id="matrix-caption">
            Claims made about Honeywell Aerospace&apos;s 5 August 2026 results, and how each
            of five outlets handled them.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.claimHead}>
                Claim
              </th>
              {OUTLETS.map((outlet) => (
                <th scope="col" key={outlet} className={styles.outletHead}>
                  {outlet}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.claim}>
                <th scope="row" className={styles.claim}>
                  {row.claim}
                </th>
                {row.cells.map((state, i) => (
                  <td key={OUTLETS[i]} className={styles.cell}>
                    <span className={`${styles.state} ${styles[state]}`}>{LABELS[state]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className={styles.caption}>
        Honeywell Aerospace, results of 5 August 2026. Each finding appeared in both
        independent passes. An absence explained by when an outlet filed is excluded
        rather than counted against it.
      </figcaption>
    </figure>
  );
}

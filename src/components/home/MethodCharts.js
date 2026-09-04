import styles from "./MethodCharts.module.css";

/**
 * Two measured quantities, both drawn from the completed Honeywell run.
 *
 * Neither places an outlet on a spectrum, which is the one chart shape this
 * product cannot draw. The first shows when each article was filed and how long
 * it stayed open for updates; the second shows that a finding is published only
 * if both independent passes produced it.
 */

const FILINGS = [
  { outlet: "CNBC Investing Club", at: 0, open: 0, time: "00:09" },
  { outlet: "The Motley Fool", at: 40.5, open: 0, time: "14:24" },
  { outlet: "Quartz", at: 49.8, open: 1.2, time: "17:41" },
  { outlet: "AeroTime", at: 59, open: 31.5, time: "20:54" },
  { outlet: "24/7 Wall St", at: 100, open: 0, time: "11:20" },
];

const FINDINGS = [
  "Adjusted EPS estimate",
  "Backlog 9% year over year",
  "Backlog $18.2 billion",
  "Aftermarket sales 8%",
  "Demand remained strong",
];

export default function MethodCharts() {
  return (
    <div className={styles.wrap}>
      <section className={styles.filing}>
        <p className={styles.label}>When each article was filed</p>
        <h2 className={styles.heading}>An article cannot report what came after it</h2>

        <div className={styles.rows}>
          {FILINGS.map((f) => (
            <div key={f.outlet} className={styles.row}>
              <span className={styles.outlet}>{f.outlet}</span>
              <span className={styles.track}>
                {f.open > 0 && (
                  <span
                    className={styles.open}
                    style={{ left: `${f.at}%`, width: `${f.open}%` }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={styles.dot}
                  style={f.at === 100 ? { left: "100%", marginLeft: "-5px" } : { left: `${f.at}%` }}
                  aria-hidden="true"
                />
              </span>
              <span className={styles.time}>{f.time}</span>
            </div>
          ))}
          <div className={styles.axis}>
            <span className={styles.outlet} />
            <span className={styles.axisScale}>
              <span>6 Aug, 00:09 UTC</span>
              <span>7 Aug, 11:20 UTC</span>
            </span>
            <span className={styles.time} />
          </div>
        </div>

        <p className={styles.note}>
          Thirty five hours separate the first filing from the last. The teal run is the window an
          article stayed open for updates. Absences explained by filing time are excluded from the
          findings rather than counted against the outlet.
        </p>
      </section>

      <section className={styles.passes}>
        <p className={styles.label}>Two independent passes</p>
        <h2 className={styles.heading}>Reported only if it reproduced</h2>

        <div className={styles.passRows}>
          <p className={styles.passHead}>
            <span>Pass one</span>
            <span>Pass two</span>
          </p>
          {FINDINGS.map((f) => (
            <div key={f} className={styles.passRow}>
              <span className={styles.bar} aria-hidden="true" />
              <span className={styles.bar} aria-hidden="true" />
              <span className={styles.passLabel}>{f}</span>
            </div>
          ))}
        </div>

        <p className={styles.note}>
          Five findings, both passes. The comparison runs twice under identical settings and only
          what appears in both is published. On this analysis 252 of 252 quotations were located in
          the source text.
        </p>
      </section>
    </div>
  );
}

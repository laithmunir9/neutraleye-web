import styles from "./ConfidenceScale.module.css";

/**
 * Where the two thresholds actually sit on the range.
 *
 * The prose names 0.40 and 0.85 and the marker draws attention to them, but
 * neither tells you that the band the analyzer treats as reportable is most of
 * the scale, while the band it calls rare is the top seventh. That is a spatial
 * fact, so it is drawn rather than asserted.
 *
 * Both numbers are the analyzer's real cut-offs, from the rules in
 * src/lib/analysis.js. Nothing here is illustrative.
 */

const THRESHOLDS = [
  { at: 40, label: "0.40", note: "Below this the result is none or uncertain" },
  { at: 85, label: "0.85", note: "Above this is rare" },
];

export default function ConfidenceScale() {
  return (
    <figure className={styles.wrap}>
      <div className={styles.track} aria-hidden="true">
        {THRESHOLDS.map((t) => (
          <span key={t.label} className={styles.tick} style={{ left: `${t.at}%` }} />
        ))}
      </div>

      <div className={styles.ends} aria-hidden="true">
        <span>0.00</span>
        <span>1.00</span>
      </div>

      <dl className={styles.keys}>
        {THRESHOLDS.map((t) => (
          <div key={t.label} className={styles.key}>
            <dt className={styles.keyNum}>{t.label}</dt>
            <dd className={styles.keyNote}>{t.note}</dd>
          </div>
        ))}
      </dl>

      <figcaption className={styles.caption}>
        Confidence runs 0.00 to 1.00. The two values the analyzer acts on sit here.
      </figcaption>
    </figure>
  );
}

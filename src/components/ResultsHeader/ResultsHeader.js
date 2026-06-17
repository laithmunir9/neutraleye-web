import ConfidenceRing from "../ConfidenceRing/ConfidenceRing";
import DriverChips from "../DriverChips/DriverChips";
import styles from "./ResultsHeader.module.css";

function isNoBias(direction) {
  const d = String(direction || "").toLowerCase();
  return !d || d.includes("no significant bias") || d === "neutral";
}

export default function ResultsHeader({ direction, confidence, drivers }) {
  const noBias = isNoBias(direction);
  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <div className={styles.direction}>
          <span>Direction</span>
          <strong>{direction}</strong>
        </div>
        {!noBias && (
          <div className={styles.confidence}>
            <div className={styles.confidenceTitle}>
              <span>Confidence</span>
              <button
                type="button"
                className={styles.tooltip}
                title="Confidence reflects consistency and evidence density. It is not factual certainty."
              >
                i
              </button>
            </div>
            <ConfidenceRing value={confidence} />
            <small>{Math.round((confidence || 0) * 100)}%</small>
          </div>
        )}
      </div>

      <div className={styles.drivers}>
        <div className={styles.label}>Primary Drivers</div>
        <DriverChips items={drivers} />
      </div>
    </section>
  );
}

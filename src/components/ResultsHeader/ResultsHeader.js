import ConfidenceRing from "../ConfidenceRing/ConfidenceRing";
import DriverChips from "../DriverChips/DriverChips";
import styles from "./ResultsHeader.module.css";
import { isNoBiasRecord } from "@/lib/biasLevel";

export default function ResultsHeader({ direction, confidence, drivers }) {
  // This component receives only a display string, so it necessarily takes the
  // legacy label path inside isNoBiasRecord rather than the enum path. Sharing
  // the helper still removes the duplicated matcher; it does not give this
  // surface enum coverage. Pass a record here if it is ever wired up.
  const noBias = isNoBiasRecord({ directionLabel: direction });
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

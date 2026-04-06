import BiasScale from "../BiasScale/BiasScale";
import ConfidenceRing from "../ConfidenceRing/ConfidenceRing";
import DriverChips from "../DriverChips/DriverChips";
import styles from "./ResultsHeader.module.css";

export default function ResultsHeader({ direction, score, confidence, drivers }) {
  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <div className={styles.direction}>
          <span>Direction</span>
          <strong>{direction}</strong>
          <small>{score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}</small>
        </div>
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
      </div>

      <div className={styles.scaleWrap}>
        <BiasScale value={score} label={direction} />
      </div>

      <div className={styles.drivers}>
        <div className={styles.label}>Primary Drivers</div>
        <DriverChips items={drivers} />
      </div>
    </section>
  );
}

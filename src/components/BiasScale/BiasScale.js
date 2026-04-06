import styles from "./BiasScale.module.css";

function toPercent(value) {
  const bounded = Math.max(-1, Math.min(1, Number(value) || 0));
  return ((bounded + 1) / 2) * 100;
}

export default function BiasScale({ value, label }) {
  const markerPosition = toPercent(value);
  const score = Number(value) || 0;
  return (
    <div className={styles.wrapper} aria-label={`Bias score ${label}`}>
      <div className={styles.scaleHeader}>
        <span>Directional signal</span>
        <strong>Read-only placement</strong>
      </div>
      <div className={styles.scale}>
        <div className={styles.gradient} />
        <div className={styles.ticks}>
          {[0, 25, 50, 75, 100].map((tick, index) => (
            <span key={tick} className={index === 2 ? styles.centerTick : ""} style={{ left: `${tick}%` }} />
          ))}
        </div>
        <div className={styles.marker} style={{ left: `${markerPosition}%` }}>
          <span />
        </div>
      </div>
      <div className={styles.labels}>
        <span>Counter-frame</span>
        <span>Soft lean</span>
        <strong>Neutral baseline</strong>
        <span>Soft lean</span>
        <span>Primary frame</span>
      </div>
      <div className={styles.meta}>
        <strong>{label}</strong>
        <span>Signal {score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}</span>
      </div>
    </div>
  );
}

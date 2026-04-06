import styles from "./ConfidenceRing.module.css";

export default function ConfidenceRing({ value }) {
  const pct = Math.round((Math.max(0, Math.min(1, value || 0)) || 0) * 100);
  const style = { "--progress": `${pct}` };
  return (
    <div className={styles.wrap}>
      <div className={styles.ring} style={style}>
        <strong>{pct}%</strong>
      </div>
    </div>
  );
}

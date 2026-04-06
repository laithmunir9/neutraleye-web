import styles from "./ResultCard.module.css";

export default function ResultCard({ title, children }) {
  return (
    <section className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}

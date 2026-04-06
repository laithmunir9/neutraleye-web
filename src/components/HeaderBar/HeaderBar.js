import styles from "./HeaderBar.module.css";

export default function HeaderBar({ title, subtitle }) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

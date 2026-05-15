import styles from "./MarketingShell.module.css";
import SiteFooter from "../SiteFooter/SiteFooter";
import SiteHeader from "../SiteHeader/SiteHeader";

export default function MarketingShell({ children, darkHeader = false }) {
  return (
    <div className={styles.shell}>
      <div className={styles.ambientTop} aria-hidden="true" />
      <SiteHeader compact defaultDark={darkHeader} />

      {children}

      <SiteFooter compact />
    </div>
  );
}

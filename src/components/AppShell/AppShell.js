"use client";

import SiteHeader from "../SiteHeader/SiteHeader";
import Sidebar from "../Sidebar/Sidebar";
import SiteFooter from "../SiteFooter/SiteFooter";
import styles from "./AppShell.module.css";

export default function AppShell({ children }) {
  return (
    <div className={styles.root}>
      <SiteHeader />
      <div className={styles.workspace}>
        <Sidebar />
        <div className={styles.content}>
          <main className={styles.main}>{children}</main>
          <SiteFooter compact />
        </div>
      </div>
    </div>
  );
}

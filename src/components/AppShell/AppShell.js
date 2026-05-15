"use client";

import { useSyncExternalStore } from "react";
import SiteHeader from "../SiteHeader/SiteHeader";
import Sidebar from "../Sidebar/Sidebar";
import SiteFooter from "../SiteFooter/SiteFooter";
import styles from "./AppShell.module.css";

const SIDEBAR_KEY = "neutraleye.sidebar.collapsed";
const SIDEBAR_CHANGE_EVENT = "neutraleye:sidebar-change";

function subscribeToSidebar(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSidebarSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_KEY) === "true";
}

function getServerSidebarSnapshot() {
  return false;
}

export default function AppShell({ children }) {
  const sidebarCollapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    getServerSidebarSnapshot
  );

  function handleToggleSidebar() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_KEY, String(!sidebarCollapsed));
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  }

  return (
    <div className={`${styles.root} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
      <SiteHeader />
      <div className={styles.workspace}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
        <div className={styles.content}>
          <main className={styles.main}>{children}</main>
        </div>
      </div>
      <SiteFooter compact />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Sidebar.module.css";

const NAV_GROUPS = [
  {
    title: "Core",
    items: [
      { href: "/analyze", label: "Analyze", icon: "AN" },
      { href: "/history", label: "History", icon: "HI" }
    ]
  },
  {
    title: "Workspace",
    items: [
      { href: "/compare", label: "Compare", icon: "CP" },
      { href: "/settings", label: "Settings", icon: "ST" }
    ]
  }
];

export default function Sidebar({ collapsed = false, onToggle }) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarTop}>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-label={collapsed ? "Open workspace sidebar" : "Close workspace sidebar"}
          aria-pressed={collapsed}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className={styles.mission}>
        <span className={styles.missionLabel}>What this workspace does</span>
        <strong>Read tone, framing, and omission more clearly</strong>
        <p>Analyze articles, revisit past results, compare narratives, and check how the system explains its output.</p>
      </div>

      {NAV_GROUPS.map((group) => (
        <section className={styles.group} key={group.title}>
          <div className={styles.groupTitle}>{group.title}</div>
          <nav className={styles.nav}>
            {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.active : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.icon} aria-hidden>
                      {item.icon}
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                );
            })}
          </nav>
        </section>
      ))}
    </aside>
  );
}

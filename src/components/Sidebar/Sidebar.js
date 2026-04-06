"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV_GROUPS = [
  {
    title: "Core",
    items: [
      { href: "/analyze", label: "Analyze", icon: "AN" },
      { href: "/history", label: "History", icon: "HI" },
      { href: "/methodology", label: "Methodology", icon: "ME" }
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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}>
        <Image src="/neutraleye-logo-48.png" alt="NeutralEye logo" width={28} height={28} />
        <div>
          <strong>NeutralEye</strong>
          <span>Bias reading workspace</span>
        </div>
      </Link>

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
                <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.active : ""}`}>
                  <span className={styles.icon} aria-hidden>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </section>
      ))}
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanSearch, History, Columns2, Settings2 } from "lucide-react";
import { EXTENSION_URL } from "@/lib/content";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/analyze",  label: "Analyze",  Icon: ScanSearch },
  { href: "/history",  label: "History",  Icon: History },
  { href: "/compare",  label: "Compare",  Icon: Columns2 },
  { href: "/settings", label: "Settings", Icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.active : ""}`}
              title={item.label}
            >
              <item.Icon size={20} className={styles.navIcon} aria-hidden="true" />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.extensionSection}>
        <a
          href={EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.extensionLink}
          title="Install the NeutralEye browser extension"
        >
          <svg className={styles.extensionIcon} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12L12 1A11 11 0 0 1 21.53 17.5Z" fill="#EA4335"/>
            <path d="M12 12L21.53 17.5A11 11 0 0 1 2.47 17.5Z" fill="#FBBC04"/>
            <path d="M12 12L2.47 17.5A11 11 0 0 1 12 1Z" fill="#34A853"/>
            <circle cx="12" cy="12" r="6.5" fill="white"/>
            <circle cx="12" cy="12" r="4.5" fill="#4285F4"/>
          </svg>
          <span className={styles.extensionLabel}>NeutralEye for Chrome</span>
        </a>
      </div>
    </aside>
  );
}

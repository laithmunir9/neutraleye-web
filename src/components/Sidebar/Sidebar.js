"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ScanSearch, History, Settings2 } from "lucide-react";
import { EXTENSION_URL } from "@/lib/content";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/analyze",  label: "Analyze",  Icon: ScanSearch },
  { href: "/history",  label: "History",  Icon: History },
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
          <Image src="/chrome-icon.png" alt="" width={20} height={20} className={styles.extensionIcon} aria-hidden="true" />
          <span className={styles.extensionLabel}>NeutralEye for Chrome</span>
        </a>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { EXTENSION_URL } from "@/lib/content";
import styles from "./SiteHeader.module.css";

const NAV_ITEMS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/system", label: "System" },
  { href: "/blog", label: "Blog" },
  { href: "/methodology", label: "Methodology" }
];

export default function SiteHeader({ compact = false, defaultDark = false }) {
  const [isDark, setIsDark] = useState(defaultDark);

  useEffect(() => {
    function updateTheme() {
      const darkSection = document.querySelector("[data-header-theme='dark']");
      if (!darkSection) {
        setIsDark(false);
        return;
      }

      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height || 80;
      const { top, bottom } = darkSection.getBoundingClientRect();
      setIsDark(top <= headerHeight + 4 && bottom > headerHeight);
    }

    updateTheme();
    const animationFrame = window.requestAnimationFrame(updateTheme);
    const timeout = window.setTimeout(updateTheme, 120);
    window.addEventListener("scroll", updateTheme, { passive: true });
    window.addEventListener("resize", updateTheme);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", updateTheme);
      window.removeEventListener("resize", updateTheme);
    };
  }, []);

  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""} ${isDark ? styles.dark : ""}`}>
      <Link href="/" className={styles.brand} aria-label="NeutralEye home">
        <Image src="/neutraleye-logo-48.png" alt="" width={32} height={32} />
        <span>NeutralEye</span>
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <Link key={item.label} href={item.href} className={styles.navLink}>
            {item.label}
          </Link>
        ))}
      </nav>

      <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.headerCta}>
        Install Extension
      </a>
    </header>
  );
}

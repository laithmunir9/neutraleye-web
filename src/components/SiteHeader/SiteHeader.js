"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EXTENSION_URL } from "@/lib/content";
import { useAuth } from "@/lib/supabase/AuthProvider";
import styles from "./SiteHeader.module.css";

const NAV_ITEMS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/system", label: "System" },
  { href: "/blog", label: "Blog" },
  { href: "/methodology", label: "Methodology" }
];

function userInitial(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  return name[0]?.toUpperCase() || "?";
}

function userAvatar(user) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
}

export default function SiteHeader({ compact = false, defaultDark = false }) {
  const [isDark, setIsDark] = useState(defaultDark);
  const { user, loading, supabase } = useAuth();
  const pathname = usePathname();
  const isPro = user?.user_metadata?.plan === "pro";
  const showUpgradeCta = pathname !== "/pricing" && !isPro;

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

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

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

      <div className={styles.headerActions}>
        {showUpgradeCta && (
          <Link href="/pricing" className={styles.upgradeCta}>Upgrade to Pro</Link>
        )}

        {!loading && !user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={styles.personButton} aria-label="Account">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={styles.dropdownContent} align="end" sideOffset={8}>
                <DropdownMenu.Item className={styles.dropdownItem} asChild>
                  <Link href="/login" className={styles.dropdownItemInner}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Log in / Sign up
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className={styles.dropdownSeparator} />
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger className={`${styles.dropdownItem} ${styles.dropdownItemInner}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Legal
                    <svg className={styles.subArrow} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent className={styles.dropdownContent} sideOffset={4} alignOffset={-4}>
                      <DropdownMenu.Item className={styles.dropdownItem} asChild>
                        <Link href="/terms">Terms of Service</Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className={styles.dropdownItem} asChild>
                        <Link href="/privacy">Privacy Policy</Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className={styles.dropdownItem} asChild>
                        <Link href="/extension-privacy">Extension Privacy</Link>
                      </DropdownMenu.Item>
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}

        {!loading && user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={`${styles.avatarButton} ${userAvatar(user) ? styles.avatarButtonImg : ""}`} aria-label="Account menu">
                {userAvatar(user) ? (
                  <Image
                    src={userAvatar(user)}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.avatarImg}
                    referrerPolicy="no-referrer"
                  />
                ) : userInitial(user)}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={styles.dropdownContent} align="end" sideOffset={8}>
                <DropdownMenu.Item className={styles.dropdownItem} asChild>
                  <Link href="/settings">My Account</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className={styles.dropdownSeparator} />
                <DropdownMenu.Item className={styles.dropdownItem} onSelect={handleSignOut}>
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}

        {loading && <span className={styles.authPlaceholder} aria-hidden="true" />}
      </div>
    </header>
  );
}

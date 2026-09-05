"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EXTENSION_URL } from "@/lib/content";
import { useAuth } from "@/lib/supabase/AuthProvider";
import AuthDialog from "@/components/AuthDialog/AuthDialog";
import { BOOKING_URL } from "@/lib/content";
import styles from "./SiteHeader.module.css";

/* Flat by design: no dropdowns. The four items mirror the homepage's own spine,
   which is the two-audience split (paid reports, free tools) plus the two
   questions a stranger asks about a one-person operation (how does it work, who
   is behind it). Media-intelligence comparables carry the same slots: Muck Rack
   runs For PR Teams / For Journalists / Resources / Company, Signal AI runs
   Solutions / Approach / Insights / Company. Both drop pricing in favour of a
   demo request, which is this product's model too.

   Labels match the footer exactly, so the same page is never called two things.
   "How it works" replaced "Method", which collided with /methodology.

   /for-comms is deliberately absent. It carries its own stripped header and
   footer, which makes it a conversion landing page, and those are kept out of
   site nav so the visitor has a single path. It stays linked from the footer. */
const NAV_LINKS = [
  { href: "/reports", label: "Coverage reports" },
  { href: "/tools", label: "Tools" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

function userInitial(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  return name[0]?.toUpperCase() || "?";
}

export default function SiteHeader({ compact = false, defaultDark = false, noBorder = false }) {
  const [isDark, setIsDark] = useState(defaultDark);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, loading, supabase } = useAuth();
  const pathname = usePathname();

  // Close the mobile menu on route change. Adjusted during render (React's
  // recommended pattern for resetting state when a dependency changes)
  // instead of an effect, so it happens before paint with no extra render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    function updateTheme() {
      const darkSection = document.querySelector("[data-header-theme='dark']");
      if (!darkSection) { setIsDark(false); return; }
      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height || 80;
      const { top, bottom } = darkSection.getBoundingClientRect();
      setIsDark(top <= headerHeight + 4 && bottom > headerHeight);
    }
    updateTheme();
    const af = window.requestAnimationFrame(updateTheme);
    const t  = window.setTimeout(updateTheme, 120);
    window.addEventListener("scroll", updateTheme, { passive: true });
    window.addEventListener("resize", updateTheme);
    return () => {
      window.cancelAnimationFrame(af);
      window.clearTimeout(t);
      window.removeEventListener("scroll", updateTheme);
      window.removeEventListener("resize", updateTheme);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMobileOpen(false);
  }

  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""} ${isDark ? styles.dark : ""} ${noBorder ? styles.noBorder : ""}`}>
      <div className={styles.headerInner}>
      <Link href="/" className={styles.brand} aria-label="NeutralEye home">
        <Image src="/neutraleye-mark.svg" alt="" width={32} height={32} unoptimized />
        <span>NeutralEye</span>
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.headerActions}>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.bookCta}
        >
          Book a demo
        </a>

        {!loading && !user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={styles.personButton} aria-label="Account">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={`${styles.dropdownContent} ${isDark ? styles.dropdownContentDark : ""}`} align="end" sideOffset={8}>
                <DropdownMenu.Item
                  className={`${styles.dropdownMenuItem} ${styles.dropdownMenuItemInner}`}
                  onSelect={(e) => { e.preventDefault(); setAuthOpen(true); }}
                >
                  <span className={styles.dropdownMenuItemInner}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Log in / Sign up
                  </span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}

        {!loading && user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={styles.avatarButton} aria-label="Account menu">
                {userInitial(user)}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={`${styles.dropdownContent} ${isDark ? styles.dropdownContentDark : ""}`} align="end" sideOffset={8}>
                <DropdownMenu.Item className={`${styles.dropdownMenuItem} ${styles.dropdownMenuItemInner}`} asChild>
                  <Link href="/settings">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                    </svg>
                    Account Details
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className={styles.dropdownSeparator} />
                <DropdownMenu.Item className={`${styles.dropdownMenuItem} ${styles.dropdownMenuItemInner}`} onSelect={handleSignOut}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}

        {loading && <span className={styles.authPlaceholder} aria-hidden="true" />}

        <button
          className={styles.hamburger}
          type="button"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {mobileOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>
      </div>

      <div id="mobile-nav" className={styles.mobileMenu} data-open={mobileOpen}>
        <nav className={styles.mobileNav} aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.mobileLink}>
              {link.label}
            </Link>
          ))}

          <div className={styles.mobileDivider} />

          {!loading && !user && (
            <button type="button" className={styles.mobileLink} onClick={() => { setMobileOpen(false); setAuthOpen(true); }}>Log in / Sign up</button>
          )}

          {!loading && user && (
            <>
              <Link href="/settings" className={styles.mobileLink}>Account Details</Link>
              <button type="button" className={styles.mobileLink} onClick={handleSignOut}>Log out</button>
            </>
          )}

          <div className={styles.mobileDivider} />

          <div className={styles.mobileLegal}>
            <Link href="/terms">Terms of service</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/extension-privacy">Extension privacy</Link>
          </div>
        </nav>
      </div>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}

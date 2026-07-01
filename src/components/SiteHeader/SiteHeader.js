"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EXTENSION_URL } from "@/lib/content";
import { useAuth } from "@/lib/supabase/AuthProvider";
import styles from "./SiteHeader.module.css";

const NAV_GROUPS = [
  { href: "/analyze", label: "Analyze", cta: true },
  {
    label: "Product",
    items: [
      {
        href: "/how-it-works",
        label: "How It Works",
        desc: "How NeutralEye works, step by step",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
        ),
      },
      {
        href: "/extension",
        label: "Chrome Extension",
        desc: "Analyze any article in your browser",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
          </svg>
        ),
      },
      {
        href: "/pricing",
        label: "Pricing",
        desc: "Free and Pro plans",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Learn",
    items: [
      {
        href: "/methodology",
        label: "Methodology",
        desc: "How to read your result",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        ),
      },
      {
        href: "/blog",
        label: "Blog",
        desc: "Notes on bias and critical reading",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
        ),
      },
      {
        href: "/faq",
        label: "FAQ",
        desc: "Common questions answered",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Company",
    items: [
      {
        href: "/about",
        label: "About",
        desc: "Why we built NeutralEye",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        ),
      },
      {
        href: "/changelog",
        label: "Changelog",
        desc: "What's new in NeutralEye",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
      },
      {
        href: "/support",
        label: "Support",
        desc: "Report an issue or get help",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
      },
    ],
  },
];

function userInitial(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  return name[0]?.toUpperCase() || "?";
}

function LegalSub({ isDark }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const justClosed = useRef(false);

  function delayClose() { timer.current = setTimeout(() => setOpen(false), 150); }
  function cancelClose() { clearTimeout(timer.current); }
  function handleOpenChange(next) {
    if (justClosed.current) { justClosed.current = false; return; }
    setOpen(next);
  }

  return (
    <DropdownMenu.Sub open={open} onOpenChange={handleOpenChange}>
      <DropdownMenu.SubTrigger
        className={`${styles.dropdownMenuItem} ${styles.dropdownMenuItemInner} ${open ? styles.dropdownMenuItemOpen : ""}`}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") { cancelClose(); setOpen(true); } }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") delayClose(); }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" && open) {
            justClosed.current = true;
            setOpen(false);
            e.currentTarget.blur();
          }
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Legal
        <svg className={styles.subArrow} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          className={`${styles.dropdownContent} ${isDark ? styles.dropdownContentDark : ""}`}
          sideOffset={4}
          alignOffset={-6}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") cancelClose(); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") delayClose(); }}
        >
          <DropdownMenu.Item className={styles.dropdownMenuItem} asChild>
            <Link href="/terms">Terms of Service</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={styles.dropdownMenuItem} asChild>
            <Link href="/privacy">Privacy Policy</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={styles.dropdownMenuItem} asChild>
            <Link href="/extension-privacy">Extension Privacy</Link>
          </DropdownMenu.Item>
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

export default function SiteHeader({ compact = false, defaultDark = false, noBorder = false }) {
  const [isDark, setIsDark] = useState(defaultDark);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, supabase } = useAuth();
  const pathname = usePathname();
  const isPro = user?.user_metadata?.plan === "pro";
  const showUpgradeCta = pathname !== "/pricing" && !isPro;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        <Image src="/neutraleye-logo-48.png" alt="" width={32} height={32} />
        <span>NeutralEye</span>
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_GROUPS.map((group) =>
          group.href ? (
            group.cta ? (
              /* Analyze — accent CTA pill with blinking eye glyph */
              <Link key={group.label} href={group.href} className={styles.analyzeCta}>
                <svg className={styles.analyzeIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
                </svg>
                {group.label}
              </Link>
            ) : (
              /* Direct link — no dropdown */
              <Link key={group.label} href={group.href} className={styles.navLink}>
                {group.label}
              </Link>
            )
          ) : (
            /* Dropdown group */
            <div key={group.label} className={styles.navGroup}>
              <button
                className={styles.navGroupBtn}
                type="button"
                onClick={(e) => e.currentTarget.blur()}
              >
                {group.label}
                <svg className={styles.navChevron} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div className={styles.dropdown} role="menu">
                <div className={styles.dropdownInner}>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} className={styles.dropdownItem} role="menuitem">
                      <span className={styles.dropdownIcon} aria-hidden="true">{item.icon}</span>
                      <span className={styles.dropdownText}>
                        <span className={styles.dropdownLabel}>{item.label}</span>
                        <span className={styles.dropdownDesc}>{item.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </nav>

      <div className={styles.headerActions}>
        {showUpgradeCta && (
          <Link href="/pricing" className={styles.upgradeCta}>Pro — Coming Soon</Link>
        )}

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
                <DropdownMenu.Item className={styles.dropdownMenuItem} asChild>
                  <Link href="/login" className={styles.dropdownMenuItemInner}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Log in / Sign up
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className={styles.dropdownSeparator} />
                <LegalSub isDark={isDark} />
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
                <LegalSub isDark={isDark} />
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
          <Link href="/analyze" className={styles.mobileAnalyzeCta}>
            <svg className={styles.analyzeIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
            </svg>
            Analyze
          </Link>

          {NAV_GROUPS.filter((group) => group.items).map((group) => (
            <div key={group.label} className={styles.mobileGroup}>
              <p className={styles.mobileGroupLabel}>{group.label}</p>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className={styles.mobileLink}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <div className={styles.mobileDivider} />

          {showUpgradeCta && (
            <Link href="/pricing" className={styles.mobileLink}>Pro — Coming Soon</Link>
          )}

          {!loading && !user && (
            <Link href="/login" className={styles.mobileLink}>Log in / Sign up</Link>
          )}

          {!loading && user && (
            <>
              <Link href="/settings" className={styles.mobileLink}>Account Details</Link>
              <button type="button" className={styles.mobileLink} onClick={handleSignOut}>Log out</button>
            </>
          )}

          <div className={styles.mobileDivider} />

          <div className={styles.mobileLegal}>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/extension-privacy">Extension Privacy</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

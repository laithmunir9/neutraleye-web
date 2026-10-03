"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/lib/supabase/AuthProvider";
import AuthDialog from "@/components/AuthDialog/AuthDialog";
import styles from "./SiteShell.module.css";

/* The whole chrome of the site: a wordmark, an account control and two legal
   links. Everything that used to sit between them (grouped nav, demo CTA,
   four-column footer) pointed at pages that no longer exist. */

function userInitial(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  return name[0]?.toUpperCase() || "?";
}

function AccountControl({ onSignIn, hidden }) {
  const { user, loading, supabase } = useAuth();

  if (hidden) return null;
  if (loading) return <span className={styles.accountPlaceholder} aria-hidden="true" />;

  if (!user) {
    return (
      <button type="button" className={styles.signIn} onClick={onSignIn}>
        Sign in
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className={styles.avatar} aria-label="Account">
          {userInitial(user)}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.menu} align="end" sideOffset={8}>
          <p className={styles.menuEmail}>{user.email}</p>
          <DropdownMenu.Item className={styles.menuItem} onSelect={() => supabase.auth.signOut()}>
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/*
 * `initialAuth` opens the sign-in overlay on arrival, for the addresses that
 * used to land on /login (email links, the auth callback, old bookmarks); see
 * src/app/login/page.js. Closing it strips those params so a refresh does not
 * reopen it. `hideAccount` is for /reset-password, which is its own auth step.
 * `backdrop` renders behind everything else (the homepage newsprint).
 */
export default function SiteShell({ children, initialAuth = null, hideAccount = false, backdrop = null }) {
  const [auth, setAuth] = useState(
    initialAuth ? { open: true, mode: initialAuth.mode, notice: initialAuth.notice } : { open: false, mode: "signin", notice: null }
  );

  function closeAuth() {
    setAuth((current) => ({ ...current, open: false }));
    if (initialAuth) {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      url.searchParams.delete("notice");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }

  return (
    <div className={`${styles.shell} ${backdrop ? styles.onPaper : ""}`}>
      {backdrop}
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="NeutralEye home">
          <Image src="/neutraleye-mark.svg" alt="" width={24} height={24} unoptimized />
          <span>NeutralEye</span>
        </Link>
        <AccountControl hidden={hideAccount} onSignIn={() => setAuth({ open: true, mode: "signin", notice: null })} />
      </header>

      <div className={styles.body}>{children}</div>

      <footer className={styles.foot}>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>

      <AuthDialog open={auth.open} initialMode={auth.mode} notice={auth.notice} onClose={closeAuth} />
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/lib/supabase/AuthProvider";
import styles from "./SiteShell.module.css";

/* The whole chrome of the site: a wordmark, an account control and two legal
   links. Everything that used to sit between them (grouped nav, demo CTA,
   four-column footer) pointed at pages that no longer exist. */

function userInitial(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  return name[0]?.toUpperCase() || "?";
}

// The auth pages are the sign-in form; a "Sign in" link above it goes nowhere.
const AUTH_PATHS = ["/login", "/signup", "/reset-password"];

function AccountControl() {
  const { user, loading, supabase } = useAuth();
  const pathname = usePathname();

  if (AUTH_PATHS.some((path) => pathname?.startsWith(path))) return null;
  if (loading) return <span className={styles.accountPlaceholder} aria-hidden="true" />;

  if (!user) {
    return (
      <Link href="/login?callbackUrl=/" className={styles.signIn}>
        Sign in
      </Link>
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

export default function SiteShell({ children }) {
  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="NeutralEye home">
          <Image src="/neutraleye-mark.svg" alt="" width={24} height={24} unoptimized />
          <span>NeutralEye</span>
        </Link>
        <AccountControl />
      </header>

      <div className={styles.body}>{children}</div>

      <footer className={styles.foot}>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </div>
  );
}

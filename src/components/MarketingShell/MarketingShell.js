import Link from "next/link";
import Image from "next/image";
import styles from "./MarketingShell.module.css";
import { EXTENSION_URL } from "@/lib/content";

const NAV_ITEMS = [
  { href: "/#analysis", label: "Analyze" },
  { href: "/#journal", label: "Journal" },
  { href: "/methodology", label: "Methodology" }
];

const FOOTER_LINKS = [
  { href: "/#analysis", label: "Analyze" },
  { href: "/blog", label: "Journal" },
  { href: "/methodology", label: "Methodology" },
  { href: EXTENSION_URL, label: "Install Extension", external: true }
];

function FooterLink({ href, label, external = false }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }

  return <Link href={href}>{label}</Link>;
}

export default function MarketingShell({ children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.ambientTop} aria-hidden="true" />
      <header className={styles.header}>
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

      {children}

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.brand} aria-label="NeutralEye home">
              <Image src="/neutraleye-logo-48.png" alt="" width={30} height={30} />
              <span>NeutralEye</span>
            </Link>
            <p>
              The extension is the product. This website gives you the same analysis flow with manual input.
            </p>
          </div>

          <div className={styles.footerLinks}>
            {FOOTER_LINKS.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

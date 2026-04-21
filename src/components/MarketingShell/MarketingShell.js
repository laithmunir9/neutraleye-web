import Link from "next/link";
import Image from "next/image";
import styles from "./MarketingShell.module.css";
import { EXTENSION_URL } from "@/lib/content";

const NAV_ITEMS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/#journal", label: "Journal" },
  { href: "/methodology", label: "Methodology" }
];

const FOOTER_PRODUCT_LINKS = [
  { href: "/methodology", label: "Methodology" },
  { href: "/analyze", label: "Analyze" },
  { href: "/blog", label: "Journal" },
  { href: EXTENSION_URL, label: "Install Extension", external: true }
];

const FOOTER_LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" }
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
            <Link href="/" className={styles.footerBrandLink} aria-label="NeutralEye home">
              <Image src="/neutraleye-logo-48.png" alt="" width={30} height={30} />
              <span>NeutralEye</span>
            </Link>
            <p>© 2026 NeutralEye. All rights reserved.</p>
          </div>

          <nav className={styles.footerProductLinks} aria-label="Footer product">
            {FOOTER_PRODUCT_LINKS.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </nav>

          <div className={styles.footerLegal}>
            <p>Legal</p>
            <nav className={styles.footerLegalLinks} aria-label="Footer legal">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

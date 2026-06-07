import Link from "next/link";
import Image from "next/image";
import styles from "./SiteFooter.module.css";

const FOOTER_COLS = [
  {
    heading: "Product",
    label: "Footer product",
    links: [
      { href: "/analyze",   label: "Analyze" },
      { href: "/extension", label: "Chrome Extension" },
      { href: "/pricing",   label: "Pricing" },
      { href: "/how-it-works", label: "How It Works" },
    ],
  },
  {
    heading: "Learn",
    label: "Footer learn",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/blog",        label: "Blog" },
      { href: "/faq",         label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    label: "Footer company",
    links: [
      { href: "/about",     label: "About" },
      { href: "/changelog", label: "Changelog" },
      { href: "/support",   label: "Support" },
    ],
  },
];

const FOOTER_LEGAL_LINKS = [
  { href: "/privacy",           label: "Website Privacy" },
  { href: "/extension-privacy", label: "Extension Privacy" },
  { href: "/terms",             label: "Terms & Conditions" },
];

export default function SiteFooter({ compact = false }) {
  return (
    <footer className={`${styles.footer} ${compact ? styles.compact : ""}`}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.footerBrandLink} aria-label="NeutralEye home">
            <Image src="/neutraleye-logo-48.png" alt="" width={30} height={30} />
            <span>NeutralEye</span>
          </Link>
          <div className={styles.footerMeta}>
            <p>© 2026 NeutralEye. All rights reserved.</p>
            <span className={styles.footerStatus}>
              <span className={styles.footerStatusDot} aria-hidden="true" />
              Status
            </span>
          </div>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.heading} className={styles.footerSection}>
            <p className={styles.footerHeading}>{col.heading}</p>
            <nav className={styles.footerLinks} aria-label={col.label}>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href}>{link.label}</Link>
              ))}
            </nav>
          </div>
        ))}

        <div className={styles.footerSection}>
          <p className={styles.footerHeading}>Legal</p>
          <nav className={styles.footerLinks} aria-label="Footer legal">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link key={link.label} href={link.href}>{link.label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

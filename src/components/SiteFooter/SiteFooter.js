import Link from "next/link";
import Image from "next/image";
import styles from "./SiteFooter.module.css";

const FOOTER_PRODUCT_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/system", label: "System" },
  { href: "/methodology", label: "Methodology" },
  { href: "/blog", label: "Blog" },
];

const FOOTER_PLANS_LINKS = [
  { href: "/pricing", label: "Pricing" },
];

const FOOTER_LEGAL_LINKS = [
  { href: "/privacy", label: "Website Privacy" },
  { href: "/extension-privacy", label: "Extension Privacy" },
  { href: "/terms", label: "Terms & Conditions" }
];

function FooterLink({ href, label }) {
  return <Link href={href}>{label}</Link>;
}

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

        <div className={styles.footerSection}>
          <p className={styles.footerHeading}>Explore</p>
          <nav className={styles.footerProductLinks} aria-label="Footer product">
            {FOOTER_PRODUCT_LINKS.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </nav>
        </div>

        <div className={styles.footerSection}>
          <p className={styles.footerHeading}>Plans</p>
          <nav className={styles.footerProductLinks} aria-label="Footer plans">
            {FOOTER_PLANS_LINKS.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </nav>
        </div>

        <div className={styles.footerSection}>
          <p className={styles.footerHeading}>Legal</p>
          <nav className={styles.footerLegalLinks} aria-label="Footer legal">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

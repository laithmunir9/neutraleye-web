import Link from "next/link";
import Image from "next/image";
import styles from "./SiteFooter.module.css";

/* Grouped by what a reader is trying to do, not by the borrowed
   Product / Learn / Company taxonomy. "Company" was a heading for a company
   with a team and a careers page; this is one person, so the honest word is
   Project. The three explainers sit together under Learn because they answer
   versions of the same question.

   Every label here that also appears in the header uses the identical wording:
   Coverage reports, Tools, How it works, About. A page called two different
   names in two places reads as two pages. */
const FOOTER_COLS = [
  {
    heading: "Product",
    label: "Footer product",
    links: [
      { href: "/reports", label: "Coverage reports" },
      { href: "/tools", label: "Tools" },
      { href: "/analyze", label: "Analyzer" },
      { href: "/for-comms", label: "For comms and IR teams" },
    ],
  },
  {
    heading: "Learn",
    label: "Footer learn",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/methodology", label: "Methodology" },
      { href: "/faq", label: "FAQ" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    heading: "Project",
    label: "Footer project",
    links: [
      { href: "/about", label: "About" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
];

const FOOTER_LEGAL_LINKS = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/extension-privacy", label: "Extension privacy" },
];

export default function SiteFooter({ compact = false }) {
  return (
    <footer className={`${styles.footer} ${compact ? styles.compact : ""}`}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.footerBrandLink} aria-label="NeutralEye home">
            <Image src="/neutraleye-mark.svg" alt="" width={30} height={30} className={styles.footerLogo} unoptimized />
            <span>NeutralEye</span>
          </Link>
          <p className={styles.footerTagline}>
            NeutralEye reads an article and shows the choices behind it.
          </p>
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

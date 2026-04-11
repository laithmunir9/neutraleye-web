import Link from "next/link";
import Image from "next/image";
import styles from "./MarketingShell.module.css";
import { EXTENSION_URL } from "@/lib/content";

const NAV_ITEMS = [
  {
    label: "Product",
    items: [
      {
        href: "/#product",
        title: "Analyze on-page",
        description: "Paste article text or a URL and get the same structured output used in the extension."
      },
      {
        href: "/#demo",
        title: "Live analysis",
        description: "Run the product directly on the website before installing anything."
      }
    ]
  },
  {
    label: "Resources",
    items: [
      {
        href: "/blog",
        title: "Bias literacy blog",
        description: "Guides that explain framing, omission, and source comparison."
      },
      {
        href: "/methodology",
        title: "Methodology",
        description: "See how NeutralEye evaluates writing patterns and evidence density."
      }
    ]
  },
  {
    label: "Workspace",
    items: [
      {
        href: "/analyze",
        title: "Full analysis workspace",
        description: "Use paste text or URL mode in the dedicated product environment."
      },
      {
        href: EXTENSION_URL,
        title: "Chrome extension",
        description: "Analyze visible article text while you browse.",
        external: true
      }
    ]
  }
];

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#product", label: "Website analyzer" },
      { href: "/#demo", label: "Live demo" },
      { href: "/analyze", label: "Workspace" }
    ]
  },
  {
    title: "Learn",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/methodology", label: "Methodology" },
      { href: "/compare", label: "Compare view" }
    ]
  },
  {
    title: "Extension",
    links: [
      { href: EXTENSION_URL, label: "Install extension", external: true },
      { href: "/history", label: "Saved runs" },
      { href: "/settings", label: "Settings" }
    ]
  }
];

function NavLink({ href, title, description, external = false }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles.popoverLink}>
        <strong>{title}</strong>
        <span>{description}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={styles.popoverLink}>
      <strong>{title}</strong>
      <span>{description}</span>
    </Link>
  );
}

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
            <div key={item.label} className={styles.navItem}>
              <button type="button" className={styles.navTrigger}>
                {item.label}
              </button>
              <div className={styles.popover}>
                {item.items.map((link) => (
                  <NavLink key={link.title} {...link} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.headerCta}>
          Install Extension
        </a>
      </header>

      {children}

      <footer className={styles.footer}>
        <div className={styles.footerCta}>
          <div>
            <p className={styles.footerEyebrow}>Use NeutralEye two ways</p>
            <h2>Paste an article here or analyze it while browsing.</h2>
            <p className={styles.footerLead}>
              The website is the product workspace. The extension is the faster in-context surface when you are already
              reading.
            </p>
          </div>
          <div className={styles.footerActions}>
            <Link href="/#demo" className={styles.footerPrimary}>
              Analyze on the website
            </Link>
            <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.footerTextLink}>
              Prefer the browser extension?
            </a>
          </div>
        </div>

        <div className={styles.footerLower}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.brand} aria-label="NeutralEye home">
              <Image src="/neutraleye-logo-48.png" alt="" width={30} height={30} />
              <span>NeutralEye</span>
            </Link>
            <p>
              Structured AI analysis for tone, framing, omission, and confidence in real news articles.
            </p>
          </div>

          <div className={styles.footerLinks}>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className={styles.footerColumn}>
                <p>{column.title}</p>
                <div>
                  {column.links.map((link) => (
                    <FooterLink key={link.label} {...link} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

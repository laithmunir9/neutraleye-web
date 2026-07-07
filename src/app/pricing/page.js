import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import WaitlistForm from "./WaitlistForm";
import styles from "./page.module.css";

const INCLUDED_FEATURES = [
  {
    label: "Bias Detection",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    label: "Tone Analysis",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: "Framing Check",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
      </svg>
    ),
  },
  {
    label: "Quoted Evidence",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
      </svg>
    ),
  },
  {
    label: "Source Picks",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    label: "Browser Extension",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
];

const FREE_FEATURES = [
  "10 analyses per day",
  "Tone, framing & sourcing analysis",
  "Quoted evidence with every result",
  "Source recommendations",
  "Browser extension access",
  "Local history (this device only)",
];

const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Cloud history — synced across devices",
  "Compare Analyses — side-by-side bias comparison",
];

export const metadata = {
  title: "Pricing — NeutralEye",
  description: "Analyze any article for free with 10 analyses per day. Pro brings cloud history and Compare Analyses, coming soon.",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <main className={styles.main}>

        <div className={styles.header}>
          <h1 className={styles.title}>See how the story was built, not just what it says</h1>
          <p className={styles.subtitle}>
            NeutralEye checks tone, framing, and sourcing on any article — and returns what it finds, with the evidence behind it.
          </p>
        </div>

        <div className={styles.includes}>
          <p className={styles.includesLabel}>All plans include:</p>
          <div className={styles.iconRow}>
            {INCLUDED_FEATURES.map((f) => (
              <div key={f.label} className={styles.iconItem}>
                <div className={styles.iconBubble}>{f.icon}</div>
                <span className={styles.iconLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cards}>

          {/* Free */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.planName}>Free</div>
              <p className={styles.planDesc}>
                10 free analyses every day during beta. Full results with direction, evidence, and sources every time.
              </p>
              <div className={styles.price}>
                <span className={styles.priceAmount}>$0</span>
                <span className={styles.priceCurrency}>USD</span>
              </div>
              <p className={styles.pricePeriod}>Per month</p>
              <Link href="/login" className={styles.ctaSecondary}>
                Get started free
              </Link>
              <div className={styles.featuresSection}>
                <p className={styles.featuresLabel}>Features you'll love:</p>
                <ul className={styles.features}>
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className={styles.feature}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.check}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className={`${styles.card} ${styles.cardPro}`}>
            <div className={styles.cardInner}>
              <div className={`${styles.planName} ${styles.planNamePro}`}>Pro</div>
              <p className={styles.planDesc}>
                Unlimited access across your browser, extension, and all devices.
              </p>
              <div className={styles.price}>
                <span className={styles.priceAmount}>$9.99</span>
                <span className={styles.priceCurrency}>USD</span>
              </div>
              <p className={styles.pricePeriod}>Per month</p>
              <button className={styles.ctaPrimary} disabled>
                Coming soon
              </button>
              <WaitlistForm />
              <div className={styles.featuresSection}>
                <p className={styles.featuresLabel}>Everything in Free, plus:</p>
                <ul className={styles.features}>
                  {PRO_FEATURES.slice(1).map((f) => (
                    <li key={f} className={styles.feature}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${styles.check} ${styles.checkPro}`}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        <p className={styles.note}>
          Pro payments powered by Stripe. Cancel any time. No hidden fees.
        </p>

      </main>
    </MarketingShell>
  );
}

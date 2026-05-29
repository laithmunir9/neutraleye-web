import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "./page.module.css";

const FREE_FEATURES = [
  "10 analyses per day",
  "Tone, framing & sourcing analysis",
  "Quoted evidence with every result",
  "Source recommendations",
  "Browser extension access",
  "Local history (this device only)",
];

const PRO_FEATURES = [
  "Unlimited analyses",
  "Everything in Free",
  "Cloud history — synced across devices",
  "Shared daily limit across extension & website",
  "Priority processing",
  "Early access to new features",
];

export const metadata = {
  title: "Pricing — NeutralEye",
  description: "Start free with 10 analyses per day. Upgrade to Pro for unlimited analyses and cross-device sync.",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <main className={styles.main}>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Pricing</p>
          <h1 className={styles.title}>Simple, transparent pricing</h1>
          <p className={styles.subtitle}>
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className={styles.cards}>

          {/* Free */}
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.planName}>Free</div>
              <div className={styles.price}>
                <span className={styles.priceAmount}>$0</span>
                <span className={styles.pricePeriod}>/ month</span>
              </div>
              <p className={styles.planDesc}>
                Everything you need to start reading the news more critically.
              </p>
            </div>
            <Link href="/login" className={styles.ctaSecondary}>
              Get started free
            </Link>
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

          {/* Pro */}
          <div className={`${styles.card} ${styles.cardPro}`}>
            <div className={styles.proBadge}>Most popular</div>
            <div className={styles.cardTop}>
              <div className={styles.planName}>Pro</div>
              <div className={styles.price}>
                <span className={styles.priceAmount}>$9.99</span>
                <span className={styles.pricePeriod}>/ month</span>
              </div>
              <p className={styles.planDesc}>
                Unlimited access across your browser, extension, and all devices.
              </p>
            </div>
            <button className={styles.ctaPrimary} disabled>
              Coming soon
            </button>
            <ul className={styles.features}>
              {PRO_FEATURES.map((f) => (
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

        <p className={styles.note}>
          Pro payments powered by Stripe. Cancel any time. No hidden fees.
        </p>

      </main>
    </MarketingShell>
  );
}

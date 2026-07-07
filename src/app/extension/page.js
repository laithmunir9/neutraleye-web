import Image from "next/image";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import { EXTENSION_URL } from "@/lib/content";
import styles from "./page.module.css";

export const metadata = {
  title: "Chrome Extension | NeutralEye",
  description: "Analyze any news article in one click. The NeutralEye Chrome extension shows how an article frames its story, with quoted evidence and suggested sources.",
};


const steps = [
  {
    number: "01",
    title: "Open any article",
    body: "Navigate to any news article, blog post, or editorial in Chrome. NeutralEye works on any page.",
  },
  {
    number: "02",
    title: "Click the icon",
    body: "Hit the NeutralEye icon in your browser toolbar. Analysis starts instantly — no copy-paste needed.",
  },
  {
    number: "03",
    title: "Read the result",
    body: "Get a direction label, confidence score, quoted evidence, and sources to read alongside in seconds.",
  },
];

const features = [
  {
    eyebrow: "Any site",
    title: "Works wherever you read",
    body: "News sites, blogs, opinion columns, editorials — if it's an article in a browser tab, NeutralEye can read it.",
  },
  {
    eyebrow: "Evidence",
    title: "Quoted phrases, not just a verdict",
    body: "Every result surfaces the exact language, source choices, and framing patterns that shaped the analysis. Check it yourself.",
  },
  {
    eyebrow: "Context",
    title: "Where to read next",
    body: "Each analysis ends with publications covering the same story from a different vantage point — so you can compare across frames.",
  },
  {
    eyebrow: "History",
    title: "Your analyses, saved",
    body: "Signed-in users can revisit every article they've analyzed. Only articles you run through NeutralEye are saved — nothing else.",
  },
];

function ExtensionMockup() {
  return (
    <div className={styles.mockupWrap}>
      {/* Browser shell */}
      <div className={styles.mockupBrowser}>

        {/* Chrome bar */}
        <div className={styles.mockupChrome}>
          <div className={styles.mockupDots}>
            <span style={{ background: "#ff5f57" }} />
            <span style={{ background: "#febc2e" }} />
            <span style={{ background: "#28c840" }} />
          </div>
          <div className={styles.mockupUrlBar}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            thenationalstandard.com/politics/senate-infrastructure-vote
          </div>
          <div className={styles.mockupExtBtn} aria-hidden="true">
            <Image
              src="/neutraleye-logo-48.png"
              alt=""
              width={16}
              height={16}
              className={styles.mockupExtImg}
            />
          </div>
        </div>

        {/* News site */}
        <div className={styles.mockupPage}>
          <header className={styles.mockupMasthead}>
            <span className={styles.mockupPubName}>The National Standard</span>
            <nav className={styles.mockupNav} aria-label="Site sections">
              <span>Politics</span>
              <span>Economy</span>
              <span>World</span>
              <span>Opinion</span>
            </nav>
          </header>
          <article className={styles.mockupArticle}>
            <span className={styles.mockupSectionTag}>Politics</span>
            <h2 className={styles.mockupHeadline}>
              Senate Panel Advances Infrastructure Overhaul as Opponents Warn of Fiscal Risk
            </h2>
            <p className={styles.mockupDeck}>
              The $420 billion measure, backed by committee leadership, now heads to the full chamber amid widening partisan divisions
            </p>
            <div className={styles.mockupByline}>
              <span>By <strong>Margaret L. Harston</strong></span>
              <span aria-hidden="true">·</span>
              <span>National Standard</span>
              <span aria-hidden="true">·</span>
              <span>14 min read</span>
            </div>
            <div className={styles.mockupBody}>
              <p>
                <strong>WASHINGTON</strong> — The Senate Finance Committee voted 12–9 Tuesday to advance a sweeping infrastructure package, as Republican critics warned the $420 billion measure lacked adequate fiscal safeguards and had not undergone sufficient review.
              </p>
              <p>
                Committee Chair Eleanor Voss called the bill "a decisive step toward the long-overdue rebuilding of America's infrastructure," while opposition members characterized the vote as a rushed process that sidesteps serious scrutiny.
              </p>
            </div>
          </article>
        </div>
      </div>

      {/* NeutralEye extension popup — accurate replica */}
      <div className={styles.extPopup} role="complementary" aria-label="NeutralEye bias analysis">
        <div className={styles.extHeader}>
          <h3 className={styles.extTitle}>NeutralEye - Bias Checker</h3>
          <p className={styles.extSubtitle}>Powered by AI</p>
          <div className={styles.extActions}>
            <button className={styles.extAnalyzeBtn} type="button">Analyze</button>
            <span className={styles.extSignInLink}>Sign in to save history →</span>
          </div>
        </div>

        <div className={styles.extResultCard}>
          <div className={styles.extLabel}>Bias Level</div>
          <p className={styles.extBiasVerdict}>Moderate bias toward Senate leadership.</p>

          <div className={styles.extLabel}>Summary of Bias</div>
          <p className={styles.extSummaryText}>
            The article consistently frames the committee vote as a decisive success, amplifying the chair's language while relegating opposition concerns to brief, criticism-only soundbites without substantive counterweight.
          </p>
          <p className={styles.extSummaryText}>
            Phrases like "decisive step" and "long-overdue rebuilding" reflect committee leadership's framing rather than neutral reporting. Opposition arguments appear solely as warnings, with no detail on the fiscal concerns raised, which could suggest a moderate bias toward the bill's proponents.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ExtensionPage() {
  return (
    <MarketingShell darkHeader>
      <main className={styles.page}>

        {/* ── Dark hero ── */}
        <section className={styles.hero} data-header-theme="dark">
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <p className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} aria-hidden="true" />
                Chrome Extension
              </p>
              <h1>A second opinion on every article you read</h1>
              <p className={styles.heroLead}>
                NeutralEye sits in your browser toolbar. One click on any article returns
                bias direction, confidence, quoted evidence, and sources to read alongside.
              </p>
              <div className={styles.heroActions}>
                <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" className={styles.installBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Add to Chrome — it's free
                </a>
                <Link href="/analyze" className={styles.webLink}>
                  Try the web version instead
                </Link>
              </div>
            </div>

            {/* ── Fictional mockup ── */}
            <div className={styles.heroVisual}>
              <ExtensionMockup />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <ScrollReveal>
          <section className={styles.stepsSection}>
            <div className={styles.stepsSectionInner}>
              <div className={styles.stepsIntro}>
                <p className={styles.eyebrow}>How it works</p>
                <h2>Three clicks from article to analysis</h2>
              </div>
              <div className={styles.stepsRow}>
                {steps.map((step) => (
                  <div key={step.number} className={styles.step}>
                    <span className={styles.stepNum}>{step.number}</span>
                    <strong className={styles.stepTitle}>{step.title}</strong>
                    <p className={styles.stepBody}>{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Features ── */}
        <ScrollReveal>
          <section className={styles.featuresSection}>
            <div className={styles.featuresSectionInner}>
              <div className={styles.featuresIntro}>
                <p className={styles.eyebrow}>What you get</p>
                <h2>Built for readers, not researchers</h2>
                <p>Every feature is designed for the moment when you're reading a story and want to know if you're getting the full picture.</p>
              </div>
              <div className={styles.featuresGrid}>
                {features.map((f) => (
                  <article key={f.title} className={styles.featureCard}>
                    <p className={styles.featureEyebrow}>{f.eyebrow}</p>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Trust row ── */}
        <ScrollReveal>
          <section className={styles.trustSection}>
            <div className={styles.trustInner}>
              <article className={styles.trustItem}>
                <div className={styles.trustIconSvg} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <strong>Your reading stays private</strong>
                  <p>Article text is processed to generate your result and not saved by default. Signed-in users choose whether to keep history.</p>
                </div>
              </article>
              <article className={styles.trustItem}>
                <div className={styles.trustIconSvg} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <strong>Free to install and use</strong>
                  <p>Free to use, with 10 analyses per day during our beta. No credit card required.</p>
                </div>
              </article>
              <article className={styles.trustItem}>
                <div className={styles.trustIconSvg} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <strong>Runs in seconds, right from the article</strong>
                  <p>No copy-paste, no tab switching. Click the icon, get the result — without leaving what you're reading.</p>
                </div>
              </article>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Final CTA ── */}
        <ScrollReveal>
          <section className={styles.ctaSection}>
            <h2>Start reading with a second opinion</h2>
            <p>One click on any article. No setup, no account needed to get started.</p>
            <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
              Add to Chrome — it's free
            </a>
            <p className={styles.ctaNote}>
              Prefer the browser?{" "}
              <Link href="/analyze">Use the web analyzer →</Link>
            </p>
          </section>
        </ScrollReveal>

      </main>
    </MarketingShell>
  );
}

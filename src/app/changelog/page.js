import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "./page.module.css";

export const metadata = {
  title: "Changelog | NeutralEye",
  description: "New features, improvements, and fixes across the NeutralEye website and Chrome extension.",
};


const ENTRIES = [
  {
    version: "1.4",
    label: "1.4.0",
    date: "June 2026",
    summary: "Compare Analyses, extension history sync, and UX improvements.",
    changes: [
      { type: "New",      text: "Compare Analyses, submit two articles side-by-side and see where framing diverges (Pro)." },
      { type: "New",      text: "Extension now saves analyses to account history when signed in." },
      { type: "Improved", text: "Confidence score explanation added inline to every result." },
      { type: "Improved", text: "Source recommendations now automatically exclude the outlet being analyzed." },
      { type: "Fixed",    text: "URL extraction failing silently on certain paywalled and JavaScript-rendered pages." },
      { type: "Fixed",    text: "Extension popup occasionally showing stale results from previous session." },
    ],
  },
  {
    version: "1.3",
    label: "1.3.0",
    date: "May 2026",
    summary: "Chrome extension launch and per-user rate limiting.",
    changes: [
      { type: "New",      text: "Chrome extension published to the Chrome Web Store." },
      { type: "New",      text: "Per-user daily quota (10/day) for authenticated extension users via Supabase." },
      { type: "New",      text: "Extension supports URL submission, paste a link directly into the popup." },
      { type: "Improved", text: "Analysis prompt restructured for cleaner signal separation across tone, framing, and omission." },
      { type: "Improved", text: "Extension popup result layout redesigned for faster scanning." },
      { type: "Fixed",    text: "Rate limiter not resetting correctly between days on the extension route." },
    ],
  },
  {
    version: "1.2",
    label: "1.2.0",
    date: "April 2026",
    summary: "Authentication, saved history, and mobile polish.",
    changes: [
      { type: "New",      text: "Email and Google OAuth authentication via Supabase." },
      { type: "New",      text: "Analysis history saved per user, browse and revisit past results." },
      { type: "New",      text: "Password reset flow with Supabase recovery email." },
      { type: "New",      text: "Settings page for account management." },
      { type: "Improved", text: "Mobile layout redesigned across all marketing and app pages." },
      { type: "Improved", text: "Site header now theme-aware, flips to light text over dark hero sections." },
    ],
  },
  {
    version: "1.1",
    label: "1.1.0",
    date: "March 2026",
    summary: "URL mode, article extraction, and omission analysis.",
    changes: [
      { type: "New",      text: "URL submission mode, paste a link and NeutralEye extracts the article automatically." },
      { type: "New",      text: "Article extraction using Cheerio with source-domain exclusion for recommendations." },
      { type: "Improved", text: "Bias summary now includes an explicit omission analysis section." },
      { type: "Improved", text: "Examples section surfaces more specific quoted language rather than general observations." },
      { type: "Fixed",    text: "In-memory rate limit store resetting on serverless cold starts." },
      { type: "Fixed",    text: "Long article text causing token limit errors on analysis route." },
    ],
  },
  {
    version: "1.0",
    label: "1.0.0",
    date: "February 2026",
    summary: "Initial launch of the NeutralEye web analyzer.",
    changes: [
      { type: "New", text: "Web analyzer, paste article text and receive a structured bias analysis." },
      { type: "New", text: "Direction label (Left-leaning, Center, Right-leaning) with 0–100 score." },
      { type: "New", text: "Confidence score reflecting signal consistency across the submitted text." },
      { type: "New", text: "Summary, examples of bias, sourcing analysis, and read-alongside recommendations." },
      { type: "New", text: "Per-IP rate limiting (5 requests/minute) on the analysis route." },
      { type: "New", text: "Kill switch environment variable for emergency service pause." },
    ],
  },
];

const TAG_COLORS = {
  New:      "tagNew",
  Improved: "tagImproved",
  Fixed:    "tagFixed",
  Security: "tagSecurity",
};

export default function ChangelogPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* ── Hero ── */}
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <div>
              <p className={styles.eyebrow}>Product</p>
              <h1>Changelog</h1>
              <p className={styles.lead}>
                Every update to NeutralEye, including new features, improvements, and fixes,
                in the order they shipped.
              </p>
            </div>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} aria-hidden="true" />
              <span>Active development</span>
            </div>
          </div>
        </header>

        {/* ── Timeline ── */}
        <div className={styles.timeline}>
          {ENTRIES.map((entry, i) => (
            <article key={entry.label} className={styles.entry}>

              {/* Left col: version + date + connector */}
              <div className={styles.entryMeta}>
                <div className={styles.connectorLine} aria-hidden="true">
                  <span className={styles.connectorDot} />
                  {i < ENTRIES.length - 1 && <span className={styles.connectorTrack} />}
                </div>
                <div className={styles.metaText}>
                  <span className={styles.version}>{entry.version}</span>
                  <time className={styles.date}>{entry.date}</time>
                  <span className={styles.versionLabel}>{entry.label}</span>
                </div>
              </div>

              {/* Right col: summary + changes */}
              <div className={styles.entryBody}>
                <p className={styles.summary}>{entry.summary}</p>
                <ul className={styles.changes}>
                  {entry.changes.map((change, ci) => (
                    <li key={ci} className={styles.change}>
                      <span className={`${styles.tag} ${styles[TAG_COLORS[change.type]]}`}>
                        {change.type}
                      </span>
                      <span className={styles.changeText}>{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </article>
          ))}
        </div>

      </main>
    </MarketingShell>
  );
}

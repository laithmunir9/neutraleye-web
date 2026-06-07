"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import HeroSystemVisualization from "@/components/HeroSystemVisualization/HeroSystemVisualization";
import { MagicCard } from "@/components/ui/magic-card";
import styles from "./page.module.css";

const EASE = [0.22, 1, 0.36, 1];

const SIGNALS = ["Tone", "Framing", "Attribution", "Sources", "Omission"];

const TRACE_STEPS = [
  { type: "setup",  title: "Article submitted",        badge: "URL",        desc: "thenationalstandard.com/politics/senate-vote",           time: "14:22:01" },
  { type: "setup",  title: "Content extracted",        badge: "2,847 words", desc: "Article confirmed — news report",                        time: "14:22:02" },
  { type: "signal", title: "Tone analyzed",            badge: "Signal",     desc: "Loaded phrasing detected — 2 instances",                  time: "14:22:04" },
  { type: "signal", title: "Framing checked",          badge: "Signal",     desc: "Selective emphasis on committee position",                 time: "14:22:06" },
  { type: "signal", title: "Attribution reviewed",     badge: "Signal",     desc: "3 claims presented without clear sourcing",                time: "14:22:08" },
  { type: "signal", title: "Source balance checked",   badge: "Signal",     desc: "Single-perspective sourcing throughout",                   time: "14:22:10" },
  { type: "signal", title: "Omission scanned",         badge: "Signal",     desc: "Counter-context absent from body text",                    time: "14:22:12" },
  { type: "result", title: "Result assembled",         badge: "Conclusion", desc: "Moderate bias toward Senate leadership · confidence 0.74", time: "14:22:13" },
];

const SOURCES = [
  { label: "Center-left daily", note: "Same story" },
  { label: "Wire service", note: "Primary coverage" },
  { label: "Center publication", note: "Counter-context" },
];

export default function Home() {
  const shouldReduce = useReducedMotion();

  const reveal = (delay = 0) =>
    shouldReduce
      ? {}
      : {
          initial: { opacity: 0, y: 36 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.55, ease: EASE, delay },
        };

  const heroContainer = {
    hidden: {},
    show: { transition: { staggerChildren: shouldReduce ? 0 : 0.1 } },
  };

  const heroItem = {
    hidden: shouldReduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };

  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <motion.div
            className={styles.heroSystem}
            initial={shouldReduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          >
            <HeroSystemVisualization />
          </motion.div>

          <motion.div
            className={styles.heroText}
            variants={heroContainer}
            initial="hidden"
            animate="show"
          >
            <div className={styles.copy}>
              <motion.p className={styles.eyebrow} variants={heroItem}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Media bias analysis
            </motion.p>
              <motion.h1 variants={heroItem}>See how an article moves the reader</motion.h1>
              <motion.p className={styles.lead} variants={heroItem}>
                NeutralEye reads tone, framing, sourcing, and omission, then returns quoted evidence and context for
                what to read next.
              </motion.p>
            </div>
            <motion.div className={styles.actions} variants={heroItem}>
              <Link href="/analyze" className={styles.heroBtn}>
                Open Analyzer
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Analysis trace ── */}
        <motion.section className={styles.traceSection} {...reveal()}>
          <div className={styles.traceIntro}>
            <p className={styles.featureEyebrow}>The analysis</p>
            <h2>The same five checks, every article</h2>
            <p>Tone, framing, attribution, source balance, and omission — reviewed together in a single pass. Every article gets the same sequence, and every result arrives with the specific evidence that produced it.</p>
          </div>
          <div className={styles.traceCard}>
            {TRACE_STEPS.map((step) => (
              <div key={step.title} className={`${styles.traceRow} ${step.type === "result" ? styles.traceRowFinal : ""}`}>
                <div className={`${styles.traceIcon} ${styles[`traceIcon_${step.type}`]}`} aria-hidden="true">
                  {step.type === "setup"  && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                  {step.type === "signal" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
                  {step.type === "result" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div className={styles.traceBody}>
                  <div className={styles.traceTitle}>
                    <span className={styles.traceTitleText}>{step.title}</span>
                    <span className={styles.traceBadge}>{step.badge}</span>
                  </div>
                  <p className={styles.traceDesc}>{step.desc}</p>
                </div>
                <time className={styles.traceMeta}>{step.time}</time>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Feature rows ── */}
        <section className={styles.features}>

          {/* Row 1: Signal detection — visual left, text right */}
          <motion.div className={styles.featureRow} {...reveal()}>
            <div className={styles.featureVisual}>
              <MagicCard
                className={styles.featureCardWrap}
                gradientFrom="#c4973e"
                gradientTo="#8b6741"
                gradientColor="rgba(139, 103, 65, 0.07)"
                gradientSize={180}
              >
                <div className={styles.featureCardContent}>
                  <span className={styles.featureCardLabel}>Signal families</span>
                  <div className={styles.signalPills}>
                    {SIGNALS.map((s) => (
                      <span key={s} className={styles.signalPill}>{s}</span>
                    ))}
                  </div>
                  <p className={styles.cardFootnote}>Checked together, in a single pass</p>
                </div>
              </MagicCard>
            </div>
            <div className={styles.featureText}>
              <p className={styles.featureEyebrow}>How it works</p>
              <h2>Five signals, one read</h2>
              <p>Every article passes through the same five checks in a single pass — tone, framing, attribution, source balance, and omission. The findings are tied together, not reported separately.</p>
            </div>
          </motion.div>

          {/* Row 2: Evidence — text left, visual right */}
          <motion.div className={`${styles.featureRow} ${styles.featureRowFlip}`} {...reveal()}>
            <div className={styles.featureText}>
              <p className={styles.featureEyebrow}>What you get</p>
              <h2>Quoted examples, not a verdict</h2>
              <p>Each signal includes the exact language that triggered it, so you can inspect the analysis against the article yourself.</p>
            </div>
            <div className={styles.featureVisual}>
              <MagicCard
                className={styles.featureCardWrap}
                gradientFrom="#c4973e"
                gradientTo="#8b6741"
                gradientColor="rgba(139, 103, 65, 0.07)"
                gradientSize={180}
              >
                <div className={styles.featureCardContent}>
                  <span className={styles.featureCardLabel}>Evidence trace</span>
                  <blockquote className={styles.quotePull}>
                    "…using language that frames the policy as an attack on ordinary families…"
                  </blockquote>
                  <div className={styles.quoteSignal}>
                    <span className={styles.quoteSignalBadge}>Loaded phrasing</span>
                    Paragraph 3
                  </div>
                </div>
              </MagicCard>
            </div>
          </motion.div>

          {/* Row 3: Sources — visual left, text right */}
          <motion.div className={styles.featureRow} {...reveal()}>
            <div className={styles.featureVisual}>
              <MagicCard
                className={styles.featureCardWrap}
                gradientFrom="#c4973e"
                gradientTo="#8b6741"
                gradientColor="rgba(139, 103, 65, 0.07)"
                gradientSize={180}
              >
                <div className={styles.featureCardContent}>
                  <span className={styles.featureCardLabel}>Reading context</span>
                  <div className={styles.sourceList}>
                    {SOURCES.map((s) => (
                      <div key={s.label} className={styles.sourceItem}>
                        <span className={styles.sourceItemLabel}>{s.label}</span>
                        <span className={styles.sourceItemNote}>{s.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </MagicCard>
            </div>
            <div className={styles.featureText}>
              <p className={styles.featureEyebrow}>What comes next</p>
              <h2>Sources to read alongside</h2>
              <p>Every review ends with publications that cover the same story from a different vantage point, so you can place the original article in a wider frame.</p>
            </div>
          </motion.div>

        </section>

        {/* ── CTA ── */}
        <motion.section className={styles.cta} {...reveal(0.05)}>
          <AnalyzerCta />
        </motion.section>

      </main>
    </MarketingShell>
  );
}

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import HeroSystemVisualization from "@/components/HeroSystemVisualization/HeroSystemVisualization";
import styles from "./page.module.css";

const EASE = [0.22, 1, 0.36, 1];

const trustMarkers = [
  { label: "Method visible", detail: "Signals stay named instead of collapsing into one opaque score." },
  { label: "Evidence attached", detail: "Quoted language, sourcing patterns, and framing choices stay visible in the output." },
  { label: "Confidence separated", detail: "Confidence describes signal consistency, not whether the article itself is true." },
  { label: "Reader controlled", detail: "Readers can inspect the result, compare context, and decide what to read next." },
];

const SIGNALS = ["Tone", "Framing", "Attribution", "Sources", "Omission"];

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
              <motion.p className={styles.eyebrow} variants={heroItem}>Overview</motion.p>
              <motion.h1 variants={heroItem}>See how an article moves the reader</motion.h1>
              <motion.p className={styles.lead} variants={heroItem}>
                NeutralEye reads tone, framing, sourcing, and omission, then returns quoted evidence and context for
                what to read next.
              </motion.p>
            </div>
            <motion.div className={styles.actions} variants={heroItem}>
              <Link href="/analyze" className={styles.primaryAction}>
                Open Analyzer
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Trust principles ── */}
        <motion.section
          className={styles.trust}
          aria-label="NeutralEye trust principles"
          {...reveal()}
        >
          {trustMarkers.map((marker) => (
            <article className={styles.trustItem} key={marker.label}>
              <span>{marker.label}</span>
              <p>{marker.detail}</p>
            </article>
          ))}
        </motion.section>

        {/* ── Feature rows ── */}
        <section className={styles.features}>

          {/* Row 1: Signal detection — visual left, text right */}
          <motion.div className={styles.featureRow} {...reveal()}>
            <div className={styles.featureVisual}>
              <div className={styles.featureCard}>
                <span className={styles.featureCardLabel}>Signal families</span>
                <div className={styles.signalPills}>
                  {SIGNALS.map((s) => (
                    <span key={s} className={styles.signalPill}>{s}</span>
                  ))}
                </div>
                <p className={styles.cardFootnote}>Checked together, in a single pass</p>
              </div>
            </div>
            <div className={styles.featureText}>
              <p className={styles.eyebrow}>How it works</p>
              <h2>Five signals, one read</h2>
              <p>Every article passes through tone, framing, attribution, source balance, and omitted counter-context together — not independently.</p>
            </div>
          </motion.div>

          {/* Row 2: Evidence — text left, visual right */}
          <motion.div className={`${styles.featureRow} ${styles.featureRowFlip}`} {...reveal()}>
            <div className={styles.featureText}>
              <p className={styles.eyebrow}>What you get</p>
              <h2>Quoted examples, not a verdict</h2>
              <p>Each signal includes the exact language that triggered it, so you can inspect the analysis against the article yourself.</p>
            </div>
            <div className={styles.featureVisual}>
              <div className={styles.featureCard}>
                <span className={styles.featureCardLabel}>Evidence trace</span>
                <blockquote className={styles.quotePull}>
                  "…using language that frames the policy as an attack on ordinary families…"
                </blockquote>
                <div className={styles.quoteSignal}>
                  <span className={styles.quoteSignalBadge}>Loaded phrasing</span>
                  Paragraph 3
                </div>
              </div>
            </div>
          </motion.div>

          {/* Row 3: Sources — visual left, text right */}
          <motion.div className={styles.featureRow} {...reveal()}>
            <div className={styles.featureVisual}>
              <div className={styles.featureCard}>
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
            </div>
            <div className={styles.featureText}>
              <p className={styles.eyebrow}>What comes next</p>
              <h2>Sources to read alongside</h2>
              <p>Every review ends with publications that cover the same story from a different vantage point, so you can read across the framing.</p>
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

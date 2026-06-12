"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import HeroSystemVisualization from "@/components/HeroSystemVisualization/HeroSystemVisualization";
import MediaBarrier from "@/components/MediaBarrier/MediaBarrier";
import styles from "./page.module.css";

const EASE = [0.22, 1, 0.36, 1];

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

const ANNOTATIONS = [
  {
    signal: "Tone",
    body: "Loaded phrasing — “a decisive step toward long-overdue reform” frames the outcome as overdue progress before the policy itself is explained.",
  },
  {
    signal: "Framing",
    body: "Selective emphasis — the procedural detail leads the story; the policy change itself is three paragraphs down.",
  },
  {
    signal: "Attribution",
    body: "Unnamed sourcing — “three committee aides” is the only attribution offered for a contested figure.",
  },
  {
    signal: "Sources",
    body: "One-sided sourcing — the opposing view gets one sentence out of five paragraphs.",
  },
  {
    signal: "Omission",
    body: "Missing context — the CBO’s same-day cost estimate isn’t referenced anywhere in the piece.",
  },
];

const FURTHER = [
  { name: "The Continental Wire", kind: "Wire service",   note: "Primary committee coverage, both sides quoted", lean: 50 },
  { name: "The Ledger",           kind: "Center-left daily", note: "Same vote, different framing",                lean: 34 },
  { name: "Public Record Review", kind: "Policy desk",     note: "Includes the CBO estimate in full",            lean: 62 },
];

function Mark({ index, active, onActivate, children }) {
  return (
    <span
      className={`${styles.mark} ${active === index ? styles.markActive : ""}`}
      onMouseEnter={() => onActivate(index)}
      onMouseLeave={() => onActivate(null)}
    >
      {children}
      <sup className={styles.markIndex}>{index}</sup>
    </span>
  );
}

export default function Home() {
  const shouldReduce = useReducedMotion();
  const [active, setActive] = useState(null);

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

  const marginContainer = {
    hidden: {},
    show: { transition: { staggerChildren: shouldReduce ? 0 : 0.14, delayChildren: shouldReduce ? 0 : 0.15 } },
  };

  const marginItem = {
    hidden: shouldReduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
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
            <motion.p className={styles.trustSignal} variants={heroItem}>
              No account required · Free to start
            </motion.p>
          </motion.div>
        </section>

        {/* ── Media barrier ── */}
        <MediaBarrier />

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

        {/* ── Annotated read ── */}
        <motion.section className={styles.annotated} {...reveal()}>

          <div className={styles.annotatedIntro}>
            <p className={styles.featureEyebrow}>How it reads</p>
            <h2>Read between the lines</h2>
            <p>NeutralEye marks up an article the way a sharp editor would — five signals, found in context, each tied to the exact language that triggered it.</p>
          </div>

          <div className={styles.spread}>
            <article className={styles.manuscript}>
              <p className={styles.kicker}>Politics · Senate · thenationalstandard.com</p>
              <h3 className={styles.headline}>Senate Committee Advances Border Security Package</h3>
              <p className={styles.byline}>Staff report · 14:22</p>

              <div className={styles.body}>
                <p>
                  After months of stalled negotiations, the Senate Judiciary Committee voted 11–9 along
                  party lines Tuesday to advance the border security package — what its sponsors called{" "}
                  <Mark index={1} active={active} onActivate={setActive}>a decisive step toward long-overdue reform</Mark>{" "}
                  after years of inaction.
                </p>
                <p>
                  Coverage centered on{" "}
                  <Mark index={2} active={active} onActivate={setActive}>the committee&rsquo;s revised inspection timeline</Mark>,
                  framing the vote chiefly as a procedural win for chamber leadership rather than a shift
                  in the underlying policy.
                </p>
                <p>
                  <Mark index={3} active={active} onActivate={setActive}>Three committee aides said</Mark> the
                  new funding formula was negotiated &ldquo;in good faith,&rdquo; though none were named and
                  no on-the-record source confirmed the figures.
                </p>
                <p>
                  Opposition members, who hold one of the package&rsquo;s four amendments, were{" "}
                  <Mark index={4} active={active} onActivate={setActive}>given a single sentence</Mark> near
                  the close of the article to register their objection.
                </p>
                <p>
                  Not mentioned anywhere in the piece:{" "}
                  <Mark index={5} active={active} onActivate={setActive}>the Congressional Budget Office&rsquo;s same-day estimate</Mark>,
                  which projects the package would add $4.2B to the deficit over five years.
                </p>
              </div>
            </article>

            <motion.div
              className={styles.margin}
              variants={marginContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              {ANNOTATIONS.map((note, i) => (
                <motion.div key={note.signal} variants={marginItem}>
                  <div
                    className={styles.note}
                    data-active={active === i + 1}
                    style={{ "--rot": i % 2 === 0 ? "-0.6deg" : "0.6deg" }}
                    onMouseEnter={() => setActive(i + 1)}
                    onMouseLeave={() => setActive(null)}
                  >
                    <div className={styles.noteHead}>
                      <span className={styles.noteIndex}>{i + 1}</span>
                      <span className={styles.noteSignal}>{note.signal}</span>
                    </div>
                    <p className={styles.noteText}>{note.body}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className={styles.further}>
            <p className={styles.furtherLabel}>Further reading</p>
            <div className={styles.furtherGrid}>
              {FURTHER.map((f) => (
                <div key={f.name} className={styles.furtherCard}>
                  <span className={styles.furtherKind}>{f.kind}</span>
                  <h4 className={styles.furtherName}>{f.name}</h4>
                  <p className={styles.furtherNote}>{f.note}</p>
                  <div className={styles.leanTrack}>
                    <span className={styles.leanMarker} style={{ left: `${f.lean}%` }} />
                  </div>
                  <div className={styles.leanLabels}>
                    <span>Left</span>
                    <span>Right</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </motion.section>

        {/* ── CTA ── */}
        <motion.section className={styles.cta} {...reveal(0.05)}>
          <AnalyzerCta />
        </motion.section>

      </main>
    </MarketingShell>
  );
}

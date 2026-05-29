"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./HeroSystemVisualization.module.css";

const SCENES = [
  {
    id: "a",
    url: "reuters.com/world/europe",
    direction: "Center-left",
    dirColor: "#4a7c59",
    confidence: 72,
    signals: [
      { label: "Tone", on: true },
      { label: "Framing", on: true },
      { label: "Attribution", on: false },
      { label: "Sources", on: true },
      { label: "Omission", on: false },
    ],
    quote: "…language frames the subsidy as a lifeline for struggling families…",
    badge: "Loaded phrasing",
    sources: ["Financial Times", "Bloomberg", "The Economist"],
  },
  {
    id: "b",
    url: "foxnews.com/politics",
    direction: "Right-leaning",
    dirColor: "#b94040",
    confidence: 88,
    signals: [
      { label: "Tone", on: true },
      { label: "Framing", on: true },
      { label: "Attribution", on: true },
      { label: "Sources", on: false },
      { label: "Omission", on: true },
    ],
    quote: "…describes the situation as a 'crisis' while limiting opposition voices…",
    badge: "Framing bias",
    sources: ["AP News", "Reuters", "Politico"],
  },
  {
    id: "c",
    url: "theguardian.com/us-news",
    direction: "Left-leaning",
    dirColor: "#3a72a8",
    confidence: 64,
    signals: [
      { label: "Tone", on: true },
      { label: "Framing", on: false },
      { label: "Attribution", on: true },
      { label: "Sources", on: false },
      { label: "Omission", on: true },
    ],
    quote: "…omits economic counterarguments while elevating activist perspectives…",
    badge: "Source imbalance",
    sources: ["Wall Street Journal", "Axios", "NPR"],
  },
];

// Phases: scanning → revealed → done → (next scene)
const PHASE_MS = { scanning: 1700, revealed: 2400, done: 3800 };

const ease = [0.22, 1, 0.36, 1];

export default function HeroSystemVisualization() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("scanning");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("revealed"), PHASE_MS.scanning);
    const t2 = setTimeout(() => setPhase("done"), PHASE_MS.scanning + PHASE_MS.revealed);
    const t3 = setTimeout(() => {
      setPhase("scanning");
      setIdx((i) => (i + 1) % SCENES.length);
    }, PHASE_MS.scanning + PHASE_MS.revealed + PHASE_MS.done);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [idx]);

  const scene = SCENES[idx];

  return (
    <section className={styles.wrap} aria-label="NeutralEye live analysis preview">
      <div className={styles.surface}>

        {/* Dot grid */}
        <div className={styles.dotGrid} aria-hidden="true" />

        {/* Back card — activity feed */}
        <div className={styles.backCard} aria-hidden="true">
          <div className={styles.backCardHeader}>
            <span className={styles.liveIndicator} />
            <span>Analysis queue</span>
          </div>
          {["wsj.com/economy", "bbc.co.uk/news", "nytimes.com"].map((u, i) => (
            <div key={u} className={styles.queueRow} style={{ animationDelay: `${i * 0.3}s` }}>
              <span className={styles.queueDot} />
              <span className={styles.queueUrl}>{u}</span>
              <span className={styles.queueTag}>Done</span>
            </div>
          ))}
        </div>

        {/* Main card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            className={styles.card}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease }}
          >
            {/* Header */}
            <div className={styles.cardHead}>
              <div className={styles.urlChip}>
                <span className={styles.urlDot} />
                <span>{scene.url}</span>
              </div>
              {phase === "scanning" ? (
                <motion.span
                  className={styles.statusScanning}
                  animate={{ opacity: [1, 0.45, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                >
                  Analyzing…
                </motion.span>
              ) : (
                <span className={styles.statusDone}>Complete</span>
              )}
            </div>

            {/* Progress bar during scan */}
            {phase === "scanning" && (
              <div className={styles.progressTrack}>
                <motion.div
                  className={styles.progressBar}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
            )}

            {/* Result row: direction + confidence */}
            <AnimatePresence>
              {phase !== "scanning" && (
                <motion.div
                  className={styles.resultRow}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <span
                    className={styles.dirBadge}
                    style={{
                      color: scene.dirColor,
                      background: `${scene.dirColor}18`,
                      borderColor: `${scene.dirColor}40`,
                    }}
                  >
                    {scene.direction}
                  </span>
                  <div className={styles.confRow}>
                    <span className={styles.confLabel}>Confidence</span>
                    <div className={styles.confTrack}>
                      <motion.div
                        className={styles.confFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${scene.confidence}%` }}
                        transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
                        style={{ background: scene.dirColor }}
                      />
                    </div>
                    <span className={styles.confPct}>{scene.confidence}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Signal chips */}
            <div className={styles.signalRow}>
              {scene.signals.map((sig, i) => (
                <motion.span
                  key={sig.label}
                  className={`${styles.signal} ${sig.on && phase !== "scanning" ? styles.signalOn : ""}`}
                  animate={
                    sig.on && phase !== "scanning"
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0.32, scale: 0.97 }
                  }
                  transition={{ delay: i * 0.08, duration: 0.25 }}
                >
                  <span className={styles.signalDot} />
                  {sig.label}
                </motion.span>
              ))}
            </div>

            {/* Evidence quote */}
            <AnimatePresence>
              {phase === "done" && (
                <motion.div
                  className={styles.evidence}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, delay: 0.1, ease }}
                >
                  <p className={styles.evidenceQuote}>"{scene.quote}"</p>
                  <span className={styles.evidenceBadge}>{scene.badge}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sources */}
            <AnimatePresence>
              {phase === "done" && (
                <motion.div
                  className={styles.sources}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <span className={styles.sourcesLabel}>Read alongside</span>
                  <div className={styles.sourceChips}>
                    {scene.sources.map((s, i) => (
                      <motion.span
                        key={s}
                        className={styles.sourceChip}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08, ease }}
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Scene dots */}
        <div className={styles.dots} aria-hidden="true">
          {SCENES.map((s, i) => (
            <span key={s.id} className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`} />
          ))}
        </div>

      </div>
    </section>
  );
}

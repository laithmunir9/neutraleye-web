"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./HeroSystemVisualization.module.css";

const CYCLE_MS = 9800;
const SIGNAL_APPEAR_MS = 2000;
const SIGNAL_STAGGER_MS = 1100;

const SCENES = [
  {
    id: "tone",
    kicker: "Politics · Senate",
    headline: "Senate Committee Advances Border Security Package",
    segments: [
      { text: "After months of stalled negotiations, the committee voted 11–9 to advance the package, what its sponsors called " },
      { text: "a decisive step toward long-overdue reform", signal: 0 },
      { text: " after years of inaction in Washington." },
    ],
    signals: [
      { label: "Loaded tone", detail: "Frames outcome as overdue progress before the policy is explained" },
    ],
  },
  {
    id: "framing",
    kicker: "Economy · Trade",
    headline: "Trade Deal Hailed as Historic Win for American Workers",
    segments: [
      { text: "Coverage centered on " },
      { text: "the administration's revised inspection timeline", signal: 0 },
      { text: ", framing the vote as procedural. Opposition members were " },
      { text: "given a single sentence", signal: 1 },
      { text: " near the close of the piece." },
    ],
    signals: [
      { label: "Framing", detail: "Procedural detail leads; policy impact buried in paragraph six" },
      { label: "Source balance", detail: "One perspective across five paragraphs" },
    ],
  },
  {
    id: "attribution",
    kicker: "Health · Research",
    headline: "Study Links Ultra-Processed Foods to Cognitive Decline",
    segments: [
      { text: "Researchers identified " },
      { text: "a significant correlation", signal: 0 },
      { text: ", though only " },
      { text: "three unnamed committee aides", signal: 1 },
      { text: " provided on-record comment. The CBO estimate went unmentioned." },
    ],
    signals: [
      { label: "Attribution", detail: "Correlation claimed without citing the peer-reviewed paper" },
      { label: "Omission", detail: "Same-day cost estimate absent from the piece" },
    ],
  },
];

export default function HeroSystemVisualization() {
  const [{ sceneIdx, activeSignals }, setState] = useState({ sceneIdx: 0, activeSignals: [] });

  useEffect(() => {
    const scene = SCENES[sceneIdx];

    const timers = scene.signals.map((_, i) =>
      setTimeout(
        () => setState((prev) => ({ ...prev, activeSignals: [...prev.activeSignals, i] })),
        SIGNAL_APPEAR_MS + i * SIGNAL_STAGGER_MS
      )
    );

    const cycle = setTimeout(
      () => setState((prev) => ({ sceneIdx: (prev.sceneIdx + 1) % SCENES.length, activeSignals: [] })),
      CYCLE_MS
    );

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(cycle);
    };
  }, [sceneIdx]);

  const scene = SCENES[sceneIdx];

  return (
    <section className={styles.system} aria-label="NeutralEye analysis preview">
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          className={styles.card}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.article}>
            <p className={styles.kicker}>{scene.kicker}</p>
            <h3 className={styles.headline}>{scene.headline}</h3>
            <p className={styles.body}>
              {scene.segments.map((seg, i) => {
                if (seg.signal === undefined) {
                  return <span key={i}>{seg.text}</span>;
                }
                const isActive = activeSignals.includes(seg.signal);
                return (
                  <mark
                    key={i}
                    className={`${styles.mark} ${isActive ? styles.markActive : ""}`}
                  >
                    {seg.text}
                    {isActive && <sup className={styles.signalIndex}>{seg.signal + 1}</sup>}
                  </mark>
                );
              })}
            </p>
          </div>

          <div className={styles.signals}>
            {scene.signals.map((sig, i) => (
              <motion.div
                key={`${scene.id}-sig-${i}`}
                className={styles.signal}
                initial={{ opacity: 0, x: -8 }}
                animate={
                  activeSignals.includes(i)
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -8 }
                }
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className={styles.signalNum} aria-hidden="true">{i + 1}</span>
                <span className={styles.signalLabel}>{sig.label}</span>
                <span className={styles.signalDivider} aria-hidden="true">·</span>
                <span className={styles.signalDetail}>{sig.detail}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

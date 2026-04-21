"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "./HeroSystemVisualization.module.css";

const LOOP_DURATION = 8.8;

const NODES = [
  { key: "input", label: "Article input", detail: "Text or URL", className: "nodeInput", delay: 0.15 },
  { key: "extract", label: "Text extracted", detail: "Readable body", className: "nodeExtract", delay: 1.1 },
  { key: "signals", label: "Bias signals", detail: "Tone + framing", className: "nodeSignals", delay: 2.05, primary: true },
  { key: "output", label: "Structured result", detail: "Evidence stack", className: "nodeOutput", delay: 4.2 }
];

const PATHS = [
  { key: "input-extract", d: "M108 286 L206 140", delay: 0.95 },
  { key: "extract-signals", d: "M206 140 L344 204", delay: 1.8 },
  { key: "signals-output", d: "M344 204 L518 314", delay: 3.25 },
  { key: "signals-source", d: "M344 204 L560 154", delay: 3.65 }
];

const SIGNALS = [
  { label: "Emotional wording", className: "signalTone", delay: 2.75 },
  { label: "Framing imbalance", className: "signalFrame", delay: 3.05 },
  { label: "Missing counterargument", className: "signalOmission", delay: 3.35 },
  { label: "Source balance checked", className: "signalSource", delay: 3.65 }
];

function nodeTransition(delay) {
  return {
    duration: 6.9,
    delay,
    times: [0, 0.12, 0.76, 0.9, 1],
    repeat: Infinity,
    repeatDelay: LOOP_DURATION - 6.9,
    ease: "easeInOut"
  };
}

function labelTransition(delay) {
  return {
    duration: 2.55,
    delay,
    times: [0, 0.18, 0.78, 1],
    repeat: Infinity,
    repeatDelay: LOOP_DURATION - 2.55,
    ease: "easeInOut"
  };
}

export default function HeroSystemVisualization() {
  const reduceMotion = useReducedMotion();

  return (
    <section className={styles.system} aria-label="NeutralEye article analysis system visualization">
      <div className={styles.surface}>
        <div className={styles.header}>
          <span>NeutralEye system</span>
          <span className={styles.status}>Live analysis</span>
        </div>

        <div className={styles.field} aria-hidden="true" />

        <svg className={styles.map} viewBox="0 0 640 430" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="neutraleye-live-path" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(32, 27, 22, 0.18)" />
              <stop offset="100%" stopColor="rgba(139, 103, 65, 0.4)" />
            </linearGradient>
          </defs>

          {PATHS.map((path) => (
            <g key={path.key}>
              <path className={styles.pathBase} d={path.d} />
              <motion.path
                className={styles.pathActive}
                d={path.d}
                initial={reduceMotion ? { pathLength: 1, opacity: 0.38 } : { pathLength: 0, opacity: 0 }}
                animate={reduceMotion ? { pathLength: 1, opacity: 0.38 } : { pathLength: [0, 1, 1, 0], opacity: [0, 0.72, 0.42, 0] }}
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 5.1,
                        delay: path.delay,
                        times: [0, 0.24, 0.82, 1],
                        repeat: Infinity,
                        repeatDelay: LOOP_DURATION - 5.1,
                        ease: "easeInOut"
                      }
                }
              />
            </g>
          ))}
        </svg>

        <div className={styles.nodes}>
          {NODES.map((node) => (
            <motion.div
              key={node.key}
              className={`${styles.node} ${styles[node.className]} ${node.primary ? styles.nodePrimary : ""}`}
              initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
              animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.46, 0], scale: [0.94, 1, 1, 1, 0.98] }}
              transition={reduceMotion ? undefined : nodeTransition(node.delay)}
            >
              <span className={styles.pin} />
              <span className={styles.nodeLabel}>
                <strong>{node.label}</strong>
                <span>{node.detail}</span>
              </span>
            </motion.div>
          ))}
        </div>

        <div className={styles.signals}>
          {SIGNALS.map((signal) => (
            <motion.span
              key={signal.label}
              className={`${styles.signal} ${styles[signal.className]}`}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
              transition={reduceMotion ? undefined : labelTransition(signal.delay)}
            >
              {signal.label}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

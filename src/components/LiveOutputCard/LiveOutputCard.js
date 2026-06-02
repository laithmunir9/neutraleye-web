"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import styles from "./LiveOutputCard.module.css";

const ROWS = [
  { label: "Direction", value: "Left-leaning" },
  { label: "Confidence", value: "0.72 · Consistent signals" },
  { label: "Signal", value: "Loaded phrasing in lede" },
  { label: "Signal", value: "Missing counter-source" },
  { label: "Trace", value: "3 sources recommended" },
];

const ROW_INTERVAL = 820;
const RESET_PAUSE = 2600;

export default function LiveOutputCard() {
  const shouldReduce = useReducedMotion();
  const [visible, setVisible] = useState(shouldReduce ? ROWS.length : 0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (shouldReduce) return;

    function schedule(fn, ms) {
      timeoutRef.current = setTimeout(fn, ms);
    }

    function step(count) {
      if (count < ROWS.length) {
        setVisible(count + 1);
        schedule(() => step(count + 1), ROW_INTERVAL);
      } else {
        schedule(() => {
          setVisible(0);
          schedule(() => step(0), 120);
        }, RESET_PAUSE);
      }
    }

    schedule(() => step(0), 500);
    return () => clearTimeout(timeoutRef.current);
  }, [shouldReduce]);

  const analyzing = visible < ROWS.length;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Evidence packet</span>
        <span className={`${styles.badge} ${analyzing ? styles.analyzing : styles.ready}`}>
          {analyzing ? "Analyzing…" : "Review ready"}
        </span>
      </div>

      <div className={styles.metric}>
        <span className={styles.metricLabel}>Reader direction</span>
        <strong className={styles.metricValue}>Framing pressure identified</strong>
      </div>

      <div className={styles.rows}>
        <AnimatePresence>
          {ROWS.slice(0, visible).map((row, i) => (
            <motion.div
              key={i}
              className={styles.row}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowValue}>{row.value}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {Array.from({ length: ROWS.length - visible }).map((_, i) => (
          <div key={`sk-${i}`} className={styles.skeleton} />
        ))}
      </div>
    </div>
  );
}

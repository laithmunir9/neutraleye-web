"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "./MediaBarrier.module.css";

const PUBLICATIONS = [
  { name: "The New York Times", variant: "serif" },
  { name: "Reuters",            variant: "caps" },
  { name: "BBC News",           variant: "block" },
  { name: "AP",                 variant: "mono" },
  { name: "Wall Street Journal",variant: "condensed" },
  { name: "The Guardian",       variant: "editorial" },
  { name: "NPR",                variant: "mono" },
];

function LogoRow({ ariaHidden }) {
  return (
    <ul className={styles.logos} role="list" aria-hidden={ariaHidden || undefined}>
      {PUBLICATIONS.map((pub) => (
        <li key={pub.name} className={styles.logoItem}>
          <span className={`${styles.logo} ${styles[`logo_${pub.variant}`]}`}>{pub.name}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MediaBarrier() {
  const shouldReduce = useReducedMotion();

  return (
    <div className={styles.barrier}>
      <motion.div
        className={styles.inner}
        initial={shouldReduce ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className={styles.label}>
          <span className={styles.labelText}>Reads content from</span>
        </p>

        <div className={styles.track}>
          {shouldReduce ? (
            <LogoRow />
          ) : (
            <div className={styles.marquee}>
              <LogoRow />
              <LogoRow ariaHidden />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

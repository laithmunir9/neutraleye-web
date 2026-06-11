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
        <p className={styles.label}>reads content from</p>

        <ul className={styles.logos} role="list">
          {PUBLICATIONS.map((pub, i) => (
            <li key={pub.name}>
              <motion.span
                className={`${styles.logo} ${styles[`logo_${pub.variant}`]}`}
                initial={shouldReduce ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.065 }}
              >
                {pub.name}
              </motion.span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

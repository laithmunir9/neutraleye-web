"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import styles from "./AnimatedTimeline.module.css";

export default function AnimatedTimeline({ steps }) {
  const shouldReduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (shouldReduce) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % steps.length);
    }, 2200);
    return () => clearInterval(t);
  }, [steps.length, shouldReduce]);

  return (
    <ol className={styles.timeline}>
      <div className={styles.track} aria-hidden="true" />
      {steps.map((step, i) => {
        const isActive = shouldReduce || i === active;
        return (
          <li
            key={step.title}
            className={`${styles.item} ${isActive ? styles.active : ""}`}
          >
            <span className={styles.node} aria-hidden="true" />
            <div className={styles.meta}>
              <span className={styles.time}>{step.time}</span>
              <span className={styles.tag}>{step.meta}</span>
            </div>
            <div className={styles.body}>
              <h3 className={styles.title}>{step.title}</h3>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.p
                    className={styles.detail}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.26, ease: "easeOut" }}
                  >
                    {step.detail}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

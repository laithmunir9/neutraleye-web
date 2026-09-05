"use client";

import { motion, useScroll, useSpring } from "motion/react";
import styles from "./ScrollProgress.module.css";

/**
 * A hairline that tracks how far through the page you are.
 *
 * Scroll-linked, not scroll-triggered: nothing is hidden until you reach it, so
 * this carries none of the blank-page risk that the old scroll reveals did. It
 * also suits a product about reading closely. The spring stops it twitching on
 * fast scrolls.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return <motion.div className={styles.bar} style={{ scaleX }} aria-hidden="true" />;
}

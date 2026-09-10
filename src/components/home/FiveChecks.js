"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FiveChecks.module.css";

/**
 * What actually runs when you point the tool at an article.
 *
 * The five checks are the product's method, and until now they were named in
 * prose on three different pages and drawn nowhere. This is the workflow as a
 * visual: each check runs in turn, its rule draws left to right, and it reports
 * what it found on this article.
 *
 * The drawn rule is deliberate. It is the same 2px accent rule that sits under
 * a mark, so the workflow is built out of the product's own gesture rather than
 * a progress bar borrowed from somewhere else.
 *
 * Numbers are from the stored Honeywell run, the same analysis the coverage
 * matrix below is drawn from. Nothing here is invented for the page.
 */

const CHECKS = [
  { name: "Tone", found: "2 passages", detail: "Loaded or emotive wording" },
  { name: "Framing", found: "1 passage", detail: "What the summary line foregrounds" },
  { name: "Attribution", found: "1 passage", detail: "Claims with no named source" },
  { name: "Source balance", found: "clear", detail: "Both sides quoted directly" },
  { name: "Omission", found: "3 claims", detail: "Carried by other outlets, absent here" },
];

const STEP_MS = 540;

export default function FiveChecks() {
  const [ran, setRan] = useState(0);
  const [started, setStarted] = useState(false);
  const rootRef = useRef(null);

  // Runs once when the section is actually looked at, rather than on page load
  // while it is still far below the fold.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The state change lives in the timeout callback rather than the effect body,
  // which is the pattern this codebase uses to satisfy react-hooks/set-state-in-effect.
  // Under reduced motion the run resolves in one step instead of staggering, so
  // the counts arrive at once rather than animating in over three seconds.
  useEffect(() => {
    if (!started || ran >= CHECKS.length) return undefined;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const timer = window.setTimeout(
      () => setRan(reduced ? CHECKS.length : ran + 1),
      reduced ? 0 : STEP_MS
    );
    return () => window.clearTimeout(timer);
  }, [started, ran]);

  const done = ran >= CHECKS.length;

  return (
    <div className={styles.root} ref={rootRef}>
      <ol className={styles.list}>
        {CHECKS.map((check, index) => {
          const state = index < ran ? "done" : index === ran && started ? "running" : "waiting";
          return (
            <li key={check.name} className={`${styles.row} ${styles[state]}`}>
              <div className={styles.head}>
                <span className={styles.name}>{check.name}</span>
                <span className={styles.found}>{state === "done" ? check.found : ""}</span>
              </div>
              {/* No animation-delay here. The state machine above already
                  sequences the rows, and adding a CSS stagger on top made the
                  two compound: row five waited its own 2480ms delay only after
                  the machine had already waited 2480ms to give it the class, so
                  its rail drew at about five seconds while the count beside it
                  had already landed. */}
              <div className={styles.rail} aria-hidden="true">
                <span className={styles.fill} />
              </div>
              <p className={styles.detail}>{check.detail}</p>
            </li>
          );
        })}
      </ol>

      <p className={`${styles.total} ${done ? styles.totalIn : ""}`}>
        <strong>4 passages marked</strong> on this article, each with the sentence that carries it.
      </p>

      <button
        type="button"
        className={styles.replay}
        onClick={() => {
          setRan(0);
          setStarted(true);
        }}
      >
        Run it again
      </button>
    </div>
  );
}

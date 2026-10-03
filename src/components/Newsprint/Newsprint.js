"use client";

import { useEffect, useRef } from "react";
import { STORIES, parseParagraph } from "./copy";
import styles from "./Newsprint.module.css";

/*
 * The homepage backdrop: columns of faint newsprint drifting upward, with the
 * product's own gesture happening in them. Every so often a loaded phrase gets
 * the annotation mark drawn under it, holds, and lets go. It is the one place
 * the page moves on its own, and it shows what Read does before anyone reads a
 * word of copy.
 *
 * Purely decorative: aria-hidden, no pointer events, and masked away from the
 * centre column so it never sits behind the input or a result. Under
 * prefers-reduced-motion the columns stand still and a few phrases are marked
 * from the start instead.
 */

const COLUMN_COUNT = 7;
const MAX_ACTIVE = 3;
const TICK_MS = 1700;
const HOLD_MS = 5200;
// Half the width of the clear band in the middle, matching the mask in CSS.
const CLEAR_HALF_WIDTH_PX = 400;

function columnStories(index) {
  // Each column starts at a different story so neighbours never line up.
  return STORIES.map((_, i) => STORIES[(i + index * 3) % STORIES.length]);
}

function Story({ paragraphs }) {
  return (
    <article className={styles.story}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 24)}>
          {parseParagraph(paragraph).map((part, i) =>
            part.phrase ? (
              <span key={i} className={styles.phrase} data-phrase="">
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )}
        </p>
      ))}
    </article>
  );
}

function isInOpenArea(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (rect.top < 130 || rect.bottom > vh - 80) return false;
  // Phones have no free margin; marks would land on the copy.
  if (vw < 900) return false;
  return rect.right < vw / 2 - CLEAR_HALF_WIDTH_PX || rect.left > vw / 2 + CLEAR_HALF_WIDTH_PX;
}

export default function Newsprint() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const phrases = Array.from(root.querySelectorAll("[data-phrase]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      phrases.filter((el) => isInOpenArea(el.getBoundingClientRect())).slice(0, 4).forEach((el) => {
        el.dataset.on = "";
      });
      return undefined;
    }

    const timeouts = new Set();

    function tick() {
      if (document.hidden) return;
      if (root.querySelectorAll("[data-on]").length >= MAX_ACTIVE) return;
      const candidates = phrases.filter((el) => !("on" in el.dataset) && isInOpenArea(el.getBoundingClientRect()));
      if (!candidates.length) return;
      const el = candidates[Math.floor(Math.random() * candidates.length)];
      el.dataset.on = "";
      const timeout = window.setTimeout(() => {
        delete el.dataset.on;
        timeouts.delete(timeout);
      }, HOLD_MS);
      timeouts.add(timeout);
    }

    const first = window.setTimeout(tick, 600);
    const interval = window.setInterval(tick, TICK_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.newsprint} aria-hidden="true" data-newsprint="">
      <div className={styles.band}>
        <div className={styles.columns}>
          {Array.from({ length: COLUMN_COUNT }, (_, index) => {
            const stories = columnStories(index);
            return (
              <div
                key={index}
                className={styles.column}
                style={{ "--drift": `${150 + (index % 3) * 28}s`, "--offset": `${-index * 23}s` }}
              >
                {/* Two copies, so the drift loops without a seam. */}
                <div className={styles.track}>
                  {[...stories, ...stories].map((paragraphs, i) => (
                    <Story key={i} paragraphs={paragraphs} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

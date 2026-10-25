"use client";

import { useEffect, useRef } from "react";
import { FINDING_LABEL_TEXT, kindOf } from "@/lib/drafts";
import styles from "./Write.module.css";

/*
 * The right panel after "Check framing": Edit draft, the summary, a one-line
 * index of the notes, and the notes against the writer's target. A note's
 * quote and question show only once it is chosen, from the index or by
 * clicking its marked passage on the sheet, so the panel stays short. The
 * index is what keyboard and screen reader users reach, since the marks on
 * the read-only sheet cannot take focus.
 */
export default function ReviewPanel({ review, active, onSelect, onEdit }) {
  const { summary, findings, target_notes: notes = [], target, kind } = review;
  const open = active ? findings[active - 1] : null;
  const cardRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView?.({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [active]);

  return (
    <aside className={`${styles.panel} ${styles.reviewPanel}`} aria-label="Framing">
      <div className={styles.panelHead}>
        <h2 className={styles.panelLabel}>Framing</h2>
        <button type="button" className={styles.editDraft} onClick={onEdit}>
          Edit draft
        </button>
      </div>

      {summary ? <p className={styles.reviewSummary}>{summary}</p> : null}

      {findings.length ? (
        <div className={styles.findingsBlock}>
          <p className={styles.findingsHint}>
            {findings.length === 1 ? "One passage is marked" : `${findings.length} passages are marked`} on your draft.
            Choose one to see its question.
          </p>
          <ol className={styles.findingIndex}>
            {findings.map((finding, index) => {
              const number = index + 1;
              return (
                <li key={`${number}-${finding.quote}`}>
                  <button
                    type="button"
                    className={styles.findingRow}
                    aria-pressed={active === number}
                    aria-controls={active === number ? "finding-card" : undefined}
                    onClick={() => onSelect(number)}
                  >
                    <span className={styles.findingNumber} aria-hidden="true">
                      {number}
                    </span>
                    <span className={styles.srOnly}>Note {number}: </span>
                    <span className={styles.findingLabel}>{FINDING_LABEL_TEXT[finding.label]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {open ? (
            <div id="finding-card" ref={cardRef} className={styles.findingCard} aria-live="polite">
              <span className={styles.findingHead}>
                <span className={styles.findingNumber} aria-hidden="true">
                  {active}
                </span>
                <span className={styles.findingLabel}>{FINDING_LABEL_TEXT[open.label]}</span>
              </span>
              <q className={styles.findingQuote}>{open.quote}</q>
              <p className={styles.findingQuestion}>{open.question}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className={styles.panelNote}>
          No notes this time. Nothing in the draft stood out against the {kindOf(kind).label} standard.
        </p>
      )}

      {notes.length ? (
        <section className={styles.targetSection} aria-labelledby="against-target">
          <h3 id="against-target" className={styles.panelLabel}>
            Against your target
          </h3>
          {target ? <p className={styles.targetSectionName}>{target}</p> : null}
          <div className={styles.notes}>
            {notes.map((item) => (
              <p key={item.note} className={styles.note}>
                {item.note}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}

"use client";

import { FINDING_LABEL_TEXT, kindOf } from "@/lib/drafts";
import styles from "./Write.module.css";

/*
 * The right panel after "Check framing": Edit draft, the summary, one card
 * per finding, and the notes against the writer's target. Choosing a card
 * scrolls the sheet to its passage and makes that mark stronger.
 */
export default function ReviewPanel({ review, active, onSelect, onEdit }) {
  const { summary, findings, target_notes: notes = [], target, kind } = review;

  return (
    <aside className={styles.panel} aria-label="Framing">
      <div className={styles.panelHead}>
        <h2 className={styles.panelLabel}>Framing</h2>
        <button type="button" className={styles.editDraft} onClick={onEdit}>
          Edit draft
        </button>
      </div>

      {summary ? <p className={styles.reviewSummary}>{summary}</p> : null}

      {findings.length ? (
        <ol className={styles.findings}>
          {findings.map((finding, index) => {
            const number = index + 1;
            return (
              <li key={`${number}-${finding.quote}`}>
                <button
                  type="button"
                  className={styles.finding}
                  aria-pressed={active === number}
                  onClick={() => onSelect(number)}
                >
                  <span className={styles.findingHead}>
                    <span className={styles.findingNumber} aria-hidden="true">
                      {number}
                    </span>
                    <span className={styles.findingLabel}>{FINDING_LABEL_TEXT[finding.label]}</span>
                  </span>
                  <span className={styles.findingQuote}>“{finding.quote}”</span>
                  <span className={styles.findingQuestion}>{finding.question}</span>
                </button>
              </li>
            );
          })}
        </ol>
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

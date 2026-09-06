"use client";

import { useState } from "react";
import styles from "./CoverageMatrixLive.module.css";

/**
 * The coverage matrix as something you interrogate rather than read.
 *
 * Selecting a cell opens what the analysis holds for that claim and outlet:
 * the verbatim spans it was traced to, and the check that let it count as a
 * finding. Data is transcribed from the completed Honeywell run.
 *
 * "Diverges" rather than "Contradicted" is deliberate. Contradicted is an
 * accusation about an outlet; diverges is an observation about two texts, and
 * the analysis does not resolve which figure was right.
 */

const OUTLETS = ["CNBC", "Motley Fool", "Quartz", "AeroTime", "24/7 Wall St"];
const FULL = ["CNBC Investing Club", "The Motley Fool", "Quartz", "AeroTime", "24/7 Wall St"];

const ROWS = [
  {
    claim: "Adjusted EPS estimate for the quarter.",
    cells: ["diverges", "diverges", "none", "none", "none"],
    outlet: "CNBC Investing Club",
    detail: "The two articles give different figures for the same expected number, on the same quarter.",
    spans: [
      { outlet: "CNBC Investing Club", quote: "an adjusted EPS estimate of $2.11" },
      { outlet: "The Motley Fool", quote: "the expected figure was $2.13 per share" },
    ],
    check: "Both spans located verbatim. Reproduced in both independent passes. The analysis records the divergence and does not resolve which figure was right.",
  },
  {
    claim: "Backlog increased 9% year over year.",
    cells: ["omitted", "reported", "reported", "reported", "none"],
    outlet: "CNBC Investing Club",
    detail: "Absent, and carried by three of the other four outlets: The Motley Fool, Quartz, AeroTime.",
    spans: [],
    effect: "Readers receive strong order and win figures but not the clearest quantified measure of accumulated demand.",
    check: "Checked against this article's filing time and its format, and recorded as an editorial choice rather than a consequence of either.",
  },
  {
    claim: "Backlog was approximately $18.2 billion.",
    cells: ["omitted", "none", "reported", "reported", "reported"],
    outlet: "CNBC Investing Club",
    detail: "Absent, and carried by three of the other four outlets: Quartz, AeroTime, 24/7 Wall St.",
    spans: [],
    check: "Reproduced in both independent passes. Filing time does not account for the absence.",
  },
  {
    claim: "Commercial aftermarket sales increased 8%.",
    cells: ["omitted", "none", "reported", "reported", "reported"],
    outlet: "CNBC Investing Club",
    detail: "Absent, and carried by three of the other four outlets: Quartz, AeroTime, 24/7 Wall St.",
    spans: [],
    check: "Reproduced in both independent passes. Filing time does not account for the absence.",
  },
  {
    claim: "Management said customer demand remained strong.",
    cells: ["reported", "reported", "omitted", "reported", "none"],
    outlet: "Quartz",
    detail: "Absent, and carried by three of the other four outlets: CNBC Investing Club, The Motley Fool, AeroTime.",
    spans: [],
    check: "A concise business report. Its format has room for this, so the absence is recorded as an editorial choice.",
  },
];

const LABEL = { reported: "Reported", omitted: "Omitted", diverges: "Diverges", none: "–" };

/* On a phone the shared header row is hidden, so each cell has to name its own
   outlet, and the state has to be spoken rather than shown: "–" is read out as
   a dash, which tells a screen reader user nothing. */
const SPOKEN = { reported: "Reported", omitted: "Omitted", diverges: "Diverges", none: "Not stated" };

/* The panel describes the selected cell: this outlet, this claim, this state.
   Reading it off the row alone told you about whichever outlet the row happened
   to be written around, even when you had clicked a different column. */
function readCell(row, col) {
  const state = row.cells[col];
  const outlet = FULL[col];
  const carried = row.cells
    .map((s, i) => (s === "reported" || s === "diverges" ? FULL[i] : null))
    .filter((o, i) => o && i !== col);

  if (state === "diverges") {
    return {
      outlet,
      detail: "The two articles give different figures for the same expected number, on the same quarter.",
      spans: row.spans || [],
      check: "Both spans located verbatim. Reproduced in both independent passes. The analysis records the divergence and does not resolve which figure was right.",
    };
  }
  if (state === "omitted") {
    return {
      outlet,
      detail: `Absent from ${outlet}, and carried by ${carried.length} of the other four outlets: ${carried.join(", ")}.`,
      spans: [],
      effect: row.effect,
      check: "Checked against this article's filing time and its format, and recorded as an editorial choice rather than a consequence of either.",
    };
  }
  if (state === "reported") {
    return {
      outlet,
      detail: carried.length
        ? `${outlet} carried this claim, as did ${carried.join(", ")}.`
        : `${outlet} carried this claim.`,
      spans: [],
      check: "Located verbatim in the article and reproduced in both independent passes.",
    };
  }
  return {
    outlet,
    detail: `Not stated in ${outlet}'s article.`,
    spans: [],
    check: "Below the corroboration threshold, so this is recorded as not stated rather than counted as a coverage gap.",
  };
}

export default function CoverageMatrixLive() {
  const [sel, setSel] = useState({ row: 1, col: 0 });
  const active = readCell(ROWS[sel.row], sel.col);
  const claim = ROWS[sel.row].claim;

  return (
    <div className={styles.wrap}>
      <div className={styles.matrix}>
        <div className={styles.grid} role="grid" aria-label="Claims set against each outlet">
          <div />
          {OUTLETS.map((o) => (
            <div key={o} className={styles.head} role="columnheader">{o}</div>
          ))}

          {ROWS.map((row, r) => (
            <div key={row.claim} className={styles.rowGroup} role="row">
              <div className={styles.claim} role="rowheader">{row.claim}</div>
              {row.cells.map((state, c) => (
                <button
                  key={OUTLETS[c]}
                  type="button"
                  className={`${styles.cell} ${sel.row === r && sel.col === c ? styles.cellOn : ""}`}
                  onClick={() => setSel({ row: r, col: c })}
                  aria-pressed={sel.row === r && sel.col === c}
                  aria-label={`${FULL[c]}. ${row.claim} ${SPOKEN[state]}.`}
                >
                  <span className={styles.cellOutlet} aria-hidden="true">{OUTLETS[c]}</span>
                  <span className={`${styles.state} ${styles[state]}`}>{LABEL[state]}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <p className={styles.foot}>
          <span>5 of 5 reproduced findings shown</span>
          <span>Corroboration threshold: 3 of the other 4 outlets</span>
        </p>
      </div>

      <div className={styles.panel} aria-live="polite" key={`${sel.row}-${sel.col}`}>
        <p className={styles.panelOutlet}>{active.outlet}</p>
        <h3 className={styles.panelClaim}>{claim}</h3>
        <p className={styles.panelDetail}>{active.detail}</p>

        {active.spans.length > 0 && (
          <div className={styles.spans}>
            {active.spans.map((s) => (
              <div key={s.outlet} className={styles.span}>
                <p className={styles.spanOutlet}>{s.outlet}</p>
                <p className={styles.spanQuote}>{s.quote}</p>
              </div>
            ))}
          </div>
        )}

        {active.effect && <p className={styles.panelEffect}>{active.effect}</p>}
        <p className={styles.panelCheck}>{active.check}</p>
      </div>
    </div>
  );
}

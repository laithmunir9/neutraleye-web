"use client";

import { kindOf } from "@/lib/drafts";
import KindPicker from "./KindPicker";
import styles from "./Write.module.css";

/*
 * The right panel while writing: what the draft is held to, the kind of piece
 * and the standard that comes with it, and the check. The check is wired up in
 * part 3; until then the button is shown but disabled.
 */
export default function FramingPanel({ target, kind, onKindChange, onChangeTarget }) {
  return (
    <aside className={styles.panel} aria-label="Framing">
      <h2 className={styles.panelLabel}>Framing</h2>

      <div className={styles.targetBox}>
        <p className={styles.targetLead}>Writing toward</p>
        <div className={styles.targetRow}>
          <span className={target ? styles.targetName : styles.targetNone}>{target || "No one in particular"}</span>
          <button type="button" className={styles.changeLink} onClick={onChangeTarget}>
            Change
          </button>
        </div>
      </div>

      <div>
        <p id="panel-kind-label" className={styles.kindLead}>
          What are you writing?
        </p>
        <KindPicker value={kind} onChange={onKindChange} labelledBy="panel-kind-label" />
        <p className={styles.kindStandard}>{kindOf(kind).standard}</p>
      </div>

      <button type="button" className={styles.check} disabled title="Coming in the next step">
        Check framing
      </button>

      <p className={styles.panelEmpty}>
        Check framing to see where your draft takes a side, which claims need a source, and what a reader may notice
        is missing. It will not rewrite anything. The fixing stays with you.
      </p>
    </aside>
  );
}

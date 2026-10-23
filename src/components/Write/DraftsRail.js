"use client";

import { draftStatusLine } from "@/lib/drafts";
import styles from "./Write.module.css";

/* "New draft", then the user's drafts, newest first. */
export default function DraftsRail({ drafts, currentId, onSelect, onNew, error }) {
  return (
    <aside className={styles.rail} aria-label="Drafts">
      <button type="button" className={styles.newDraft} onClick={onNew}>
        New draft
      </button>
      <h2 className={styles.railLabel}>Your drafts</h2>
      {error ? (
        <p className={styles.railNote}>Your drafts could not be loaded. Refresh the page to try again.</p>
      ) : (
        <ul className={styles.draftList}>
          {drafts.map((draft) => (
            <li key={draft.id}>
              <button
                type="button"
                className={styles.draftRow}
                aria-current={draft.id === currentId ? "true" : undefined}
                onClick={() => onSelect(draft.id)}
              >
                <span className={styles.draftTitle}>{draft.title || "Untitled"}</span>
                <span className={styles.draftStatus}>{draftStatusLine(draft)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

"use client";

import { KINDS } from "@/lib/drafts";
import styles from "./Write.module.css";

/* Essay / Opinion / News, as one segmented control. Used in the framing panel
   and the setup card. */
export default function KindPicker({ value, onChange, labelledBy }) {
  return (
    <div className={styles.segmented} role="group" aria-labelledby={labelledBy}>
      {KINDS.map((kind) => (
        <button
          key={kind.id}
          type="button"
          aria-pressed={value === kind.id}
          className={styles.segment}
          onClick={() => onChange(kind.id)}
        >
          {kind.label}
        </button>
      ))}
    </div>
  );
}

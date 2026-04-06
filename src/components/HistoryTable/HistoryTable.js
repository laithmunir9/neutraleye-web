"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./HistoryTable.module.css";

function domainOrTitle(record) {
  if (record.title && record.title !== record.url) return record.title;
  if (!record.url) return "Direct text input";
  try {
    return new URL(record.url).hostname;
  } catch {
    return record.url;
  }
}

export default function HistoryTable({ items, onDelete }) {
  const router = useRouter();

  if (!items.length) {
    return (
      <div className={styles.empty}>
        <h3>No analyses yet</h3>
        <p>Run your first text or URL analysis to populate history.</p>
        <Link href="/analyze">Open Analyze</Link>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Domain / Title</th>
            <th>Direction</th>
            <th>Confidence</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} onClick={() => router.push(`/analyze?id=${item.id}`)}>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td>{domainOrTitle(item)}</td>
              <td>{item.directionLabel || item.direction}</td>
              <td>{Math.round((item.confidence || 0) * 100)}%</td>
              <td>
                <details
                  className={styles.menu}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <summary aria-label="Actions">Actions</summary>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item.id);
                    }}
                  >
                    Delete analysis
                  </button>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

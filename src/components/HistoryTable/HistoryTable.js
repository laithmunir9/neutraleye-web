"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [openMenuId, setOpenMenuId] = useState("");
  const tableRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (tableRef.current?.contains(event.target)) return;
      setOpenMenuId("");
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenMenuId("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!items.length) {
    return (
      <div className={styles.empty}>
        <h3>No analyses yet</h3>
        <p>Run your first text or URL analysis to populate history.</p>
        <Link href="/analyze">Open Analyzer</Link>
      </div>
    );
  }

  return (
    <div className={styles.wrap} ref={tableRef}>
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
          {items.map((item, index) => {
            const menuId = item.id || `${item.createdAt}-${index}`;
            const isOpen = openMenuId === menuId;
            const fromExtension = item.requestMeta?.source === "extension";

            return (
              <tr key={menuId}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <span className={styles.titleCell}>
                    {domainOrTitle(item)}
                    {fromExtension && <span className={styles.sourceBadge}>Extension</span>}
                  </span>
                </td>
                <td>{item.directionLabel || item.direction}</td>
                <td>{Math.round((item.confidence || 0) * 100)}%</td>
                <td>
                  <div
                    className={`${styles.menu} ${isOpen ? styles.menuOpen : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <button
                      className={styles.actionButton}
                      type="button"
                      aria-expanded={isOpen}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(isOpen ? "" : menuId);
                      }}
                    >
                      Actions
                    </button>
                    {!fromExtension && (
                      <button
                        className={styles.inspectButton}
                        type="button"
                        aria-hidden={!isOpen}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId("");
                          router.push(`/analyze?id=${item.id}`);
                        }}
                      >
                        Inspect
                      </button>
                    )}
                    <button
                      className={styles.deleteButton}
                      type="button"
                      aria-hidden={!isOpen}
                      tabIndex={isOpen ? 0 : -1}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId("");
                        onDelete(item.id);
                      }}
                    >
                      Delete analysis
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

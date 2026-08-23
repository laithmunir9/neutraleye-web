"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./HistoryTable.module.css";
import { isNoBiasRecord, NO_BIAS_LABEL } from "@/lib/biasLevel";

function domainOrTitle(record) {
  let domain = null;
  if (record.url) {
    try { domain = new URL(record.url).hostname; } catch { domain = null; }
  }
  const title = record.title && record.title !== record.url ? record.title : null;
  if (domain && title) return `${domain}: ${title}`;
  if (title) return title;
  if (domain) return domain;
  return "Direct text input";
}

function directionLabel(record) {
  if (isNoBiasRecord(record)) return NO_BIAS_LABEL;
  return record.directionLabel || record.direction;
}

function confidenceDisplay(record) {
  if (isNoBiasRecord(record)) return "N/A";
  return `${Math.round((record.confidence || 0) * 100)}%`;
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
            const fromWebsite = item.requestMeta?.source === "website";

            return (
              <tr key={menuId}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <span className={styles.titleCell}>
                    {fromExtension && <span className={styles.sourceBadge}>Extension</span>}
                    {fromWebsite && <span className={styles.sourceBadge}>Website</span>}
                    <span>{domainOrTitle(item)}</span>
                  </span>
                </td>
                <td>{directionLabel(item)}</td>
                <td>{confidenceDisplay(item)}</td>
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

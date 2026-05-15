"use client";

import { useSyncExternalStore } from "react";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import HistoryTable from "@/components/HistoryTable/HistoryTable";
import ResultCard from "@/components/ResultCard/ResultCard";
import { deleteAnalysis, listAnalyses } from "@/lib/storage";
import styles from "./page.module.css";

const HISTORY_CHANGE_EVENT = "neutraleye:history-change";
const EMPTY_HISTORY = [];
let cachedHistoryKey = "";
let cachedHistorySnapshot = [];

function subscribeToHistory(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(HISTORY_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(HISTORY_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getHistorySnapshot() {
  const next = listAnalyses();
  const nextKey = JSON.stringify(next);
  if (nextKey !== cachedHistoryKey) {
    cachedHistoryKey = nextKey;
    cachedHistorySnapshot = next;
  }
  return cachedHistorySnapshot;
}

function getServerHistorySnapshot() {
  return EMPTY_HISTORY;
}

export default function HistoryPage() {
  const items = useSyncExternalStore(subscribeToHistory, getHistorySnapshot, getServerHistorySnapshot);

  function handleDelete(id) {
    deleteAnalysis(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
    }
  }

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Analysis History"
          subtitle="Review past article checks, revisit the output, and compare how different stories were framed."
        />
        <section className={styles.stats}>
          <ResultCard title="Saved runs">
            <p className={styles.metric}>{items.length}</p>
            <p className={styles.support}>Analyses currently saved in this browser.</p>
          </ResultCard>
          <ResultCard title="Latest activity">
            <p className={styles.metricSmall}>
              {items[0] ? new Date(items[0].createdAt).toLocaleString() : "No analyses yet"}
            </p>
            <p className={styles.support}>Most recent time an article was reviewed in this workspace.</p>
          </ResultCard>
          <ResultCard title="Storage model">
            <p className={styles.metricSmall}>Browser-local</p>
            <p className={styles.support}>Saved history stays on this device unless you remove it.</p>
          </ResultCard>
        </section>
        <HistoryTable items={items} onDelete={handleDelete} />
      </div>
    </AppShell>
  );
}

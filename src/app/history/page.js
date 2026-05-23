"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import HistoryTable from "@/components/HistoryTable/HistoryTable";
import ResultCard from "@/components/ResultCard/ResultCard";
import { deleteAnalysis, listAnalyses } from "@/lib/storage";
import { deleteAnalysisFromSupabase, listAnalysesFromSupabase } from "@/lib/supabase/analyses";
import { useAuth } from "@/lib/supabase/AuthProvider";
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
  const { user, loading: authLoading } = useAuth();
  const [supabaseItems, setSupabaseItems] = useState(null);
  const [supabaseError, setSupabaseError] = useState(null);

  const localItems = useSyncExternalStore(subscribeToHistory, getHistorySnapshot, getServerHistorySnapshot);

  useEffect(() => {
    if (!user) {
      setSupabaseItems(null);
      setSupabaseError(null);
      return;
    }
    setSupabaseError(null);
    listAnalysesFromSupabase()
      .then(setSupabaseItems)
      .catch((err) => {
        setSupabaseError(err);
        setSupabaseItems(null);
      });
  }, [user]);

  const items = user && supabaseItems !== null ? supabaseItems : localItems;
  const isLoading = authLoading || (user && supabaseItems === null && !supabaseError);

  async function handleDelete(id) {
    if (user) {
      await deleteAnalysisFromSupabase(id);
      setSupabaseItems((prev) => prev ? prev.filter((item) => item.id !== id) : prev);
    } else {
      deleteAnalysis(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
      }
    }
  }

  const storageLabel = user ? "Supabase" : "Browser-local";
  const storageSupport = user
    ? "History is synced to your account and available across devices."
    : "Saved history stays on this device unless you remove it.";

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Analysis History"
          subtitle="Review past article checks, revisit the output, and compare how different stories were framed."
        />
        <section className={styles.stats}>
          <ResultCard title="Saved runs">
            <p className={styles.metric}>{isLoading ? "—" : items.length}</p>
            <p className={styles.support}>Analyses currently saved{user ? " to your account" : " in this browser"}.</p>
          </ResultCard>
          <ResultCard title="Latest activity">
            <p className={styles.metricSmall}>
              {isLoading ? "—" : items[0] ? new Date(items[0].createdAt).toLocaleString() : "No analyses yet"}
            </p>
            <p className={styles.support}>Most recent time an article was reviewed in this workspace.</p>
          </ResultCard>
          <ResultCard title="Storage model">
            <p className={styles.metricSmall}>{storageLabel}</p>
            <p className={styles.support}>{storageSupport}</p>
          </ResultCard>
        </section>
        {supabaseError && (
          <p className={styles.errorNote}>Could not load cloud history. Showing local analyses.</p>
        )}
        <HistoryTable items={items} onDelete={handleDelete} />
      </div>
    </AppShell>
  );
}

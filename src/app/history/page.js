"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import HistoryTable from "@/components/HistoryTable/HistoryTable";
import ResultCard from "@/components/ResultCard/ResultCard";
import { deleteAnalysis, listAnalyses } from "@/lib/storage";
import { deleteAnalysisFromSupabase, listAnalysesFromSupabase } from "@/lib/supabase/analyses";
import { useAuth } from "@/lib/supabase/AuthProvider";
import styles from "./page.module.css";

const SETTINGS_KEY = "neutraleye.settings.v1";
const HISTORY_CHANGE_EVENT = "neutraleye:history-change";
const EMPTY_HISTORY = [];
let cachedHistoryKey = "";
let cachedHistorySnapshot = [];

function readSaveHistorySetting() {
  if (typeof window === "undefined") return true;
  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
    return stored.saveHistory !== false;
  } catch {
    return true;
  }
}

function subscribeToSaveHistorySetting(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSaveHistorySnapshot() {
  return true;
}

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

function HistoryGate() {
  return (
    <div className={styles.gateWrapper}>
      <div className={styles.gateOverlay}>
        <div className={styles.gateCard}>
          <div className={styles.gateIconWrap}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className={styles.gateTitle}>History saving is off</h2>
          <p className={styles.gateDesc}>
            Analysis history is not being saved. Enable it in Settings to start recording your analyses.
          </p>
          <Link href="/settings" className={styles.gateBtn}>Go to Settings</Link>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [supabaseItems, setSupabaseItems] = useState(null);
  const [supabaseError, setSupabaseError] = useState(null);
  const saveHistory = useSyncExternalStore(
    subscribeToSaveHistorySetting,
    readSaveHistorySetting,
    getServerSaveHistorySnapshot
  );

  const localItems = useSyncExternalStore(subscribeToHistory, getHistorySnapshot, getServerHistorySnapshot);

  useEffect(() => {
    if (!user) return;
    listAnalysesFromSupabase()
      .then((data) => {
        setSupabaseItems(data);
        setSupabaseError(null);
      })
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

  const storageLabel = user ? "Cloud" : "This device";
  const storageSupport = user
    ? "History is synced to your account and available on any device."
    : "History is saved in this browser only. Sign in to sync across devices.";

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Analysis History"
          subtitle="Review past article checks and revisit the full output for any saved analysis."
        />

        {!saveHistory ? (
          <HistoryGate />
        ) : (
          <>
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
              <ResultCard title="Sync status">
                <p className={styles.metricSmall}>{storageLabel}</p>
                <p className={styles.support}>{storageSupport}</p>
              </ResultCard>
            </section>
            {user && supabaseError && (
              <p className={styles.errorNote}>Could not load cloud history. Showing local analyses.</p>
            )}
            <HistoryTable items={items} onDelete={handleDelete} />
          </>
        )}
      </div>
    </AppShell>
  );
}

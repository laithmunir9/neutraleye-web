"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import ResultCard from "@/components/ResultCard/ResultCard";
import styles from "./page.module.css";

const KEY = "neutraleye.settings.v1";

const DEFAULTS = {
  reduceMotion: false,
  showDiagnostics: true
};

function readSettings() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(window.localStorage.getItem(KEY) || "{}") || {}) };
  } catch {
    return DEFAULTS;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => readSettings());
  const [savedAt, setSavedAt] = useState("");

  function updateSetting(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    }
    setSavedAt(new Date().toLocaleTimeString());
  }

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Settings"
          subtitle="Adjust how NeutralEye presents analysis details in this browser."
        />
        <section className={styles.grid}>
          <ResultCard title="Display">
            <div className={styles.group}>
              <label className={styles.row}>
                <span>
                  <strong>Show request diagnostics</strong>
                  <small>Show request ids, status codes, and endpoint details on the Analyze page.</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showDiagnostics}
                  onChange={(event) => updateSetting("showDiagnostics", event.target.checked)}
                />
              </label>
              <label className={styles.row}>
                <span>
                  <strong>Reduce loading motion</strong>
                  <small>Use a calmer loading experience while NeutralEye reads and scores an article.</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(event) => updateSetting("reduceMotion", event.target.checked)}
                />
              </label>
            </div>
            <p className={styles.text}>{savedAt ? `Saved at ${savedAt}` : "Changes are saved automatically."}</p>
          </ResultCard>
          <ResultCard title="Workspace notes">
            <div className={styles.noteBlock}>
              <p>These preferences apply only to this browser and only to the website workspace.</p>
              <p>Diagnostics are helpful when checking extraction failures, rate limits, or backend availability.</p>
            </div>
          </ResultCard>
        </section>
      </div>
    </AppShell>
  );
}

"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import ResultCard from "@/components/ResultCard/ResultCard";
import styles from "./page.module.css";

const KEY = "neutraleye.settings.v1";

const DEFAULTS = {
  reduceMotion: false,
  saveHistory: true,
};

function readSettings() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(window.localStorage.getItem(KEY) || "{}") || {}) };
  } catch {
    return DEFAULTS;
  }
}

function Toggle({ checked, onChange }) {
  return (
    <label className={styles.toggleLabel}>
      <input
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.toggleTrack} aria-hidden="true">
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => readSettings());
  const [savedAtDisplay, setSavedAtDisplay] = useState("");
  const [savedAtPrivacy, setSavedAtPrivacy] = useState("");

  function updateSetting(key, value, setSavedAt) {
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
              <div className={styles.row}>
                <span>
                  <strong>Reduce motion</strong>
                  <small>Use a calmer loading experience while NeutralEye reads and analyzes an article.</small>
                </span>
                <Toggle
                  checked={settings.reduceMotion}
                  onChange={(e) => updateSetting("reduceMotion", e.target.checked, setSavedAtDisplay)}
                />
              </div>
            </div>
            <p className={styles.text}>{savedAtDisplay ? `Saved at ${savedAtDisplay}` : "Changes are saved automatically."}</p>
          </ResultCard>
          <ResultCard title="Privacy">
            <div className={styles.group}>
              <div className={styles.row}>
                <span>
                  <strong>Save analysis history</strong>
                  <small>Only articles you run through NeutralEye are saved, nothing else. Disable to stop saving new analyses.</small>
                </span>
                <Toggle
                  checked={settings.saveHistory}
                  onChange={(e) => updateSetting("saveHistory", e.target.checked, setSavedAtPrivacy)}
                />
              </div>
            </div>
            <p className={styles.text}>{savedAtPrivacy ? `Saved at ${savedAtPrivacy}` : "Changes are saved automatically."}</p>
          </ResultCard>
        </section>
        <p className={styles.settingsNote}>These preferences apply only to this browser and are not synced to your account.</p>
      </div>
    </AppShell>
  );
}

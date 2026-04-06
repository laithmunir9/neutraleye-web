"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import ResultCard from "@/components/ResultCard/ResultCard";
import { listAnalyses } from "@/lib/storage";
import styles from "./page.module.css";

function itemLabel(item) {
  return item.title || item.url || `Analysis ${new Date(item.createdAt).toLocaleString()}`;
}

export default function ComparePage() {
  const initialItems = listAnalyses();
  const [items] = useState(() => initialItems);
  const [left, setLeft] = useState(() => initialItems[0]?.id || "");
  const [right, setRight] = useState(() => initialItems[1]?.id || initialItems[0]?.id || "");

  const leftItem = useMemo(() => items.find((item) => item.id === left), [items, left]);
  const rightItem = useMemo(() => items.find((item) => item.id === right), [items, right]);
  const scoreDelta = leftItem && rightItem ? Math.abs((leftItem.score || 0) - (rightItem.score || 0)).toFixed(2) : null;

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Compare Analyses"
          subtitle="Place two saved results side by side to see where tone, framing, and confidence begin to diverge."
        />
        {!items.length ? (
          <ResultCard title="No saved analyses">
            <p className={styles.text}>Run at least two analyses before using comparison view.</p>
          </ResultCard>
        ) : (
          <>
            <ResultCard title="Selection">
              <div className={styles.controls}>
                <label>
                  Left
                  <select value={left} onChange={(event) => setLeft(event.target.value)}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {itemLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Right
                  <select value={right} onChange={(event) => setRight(event.target.value)}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {itemLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {scoreDelta ? (
                <div className={styles.overview}>
                  <div>
                    <span>Bias difference</span>
                    <strong>{scoreDelta}</strong>
                  </div>
                  <div>
                    <span>Confidence gap</span>
                    <strong>{Math.abs(Math.round((leftItem.confidence - rightItem.confidence) * 100))}%</strong>
                  </div>
                </div>
              ) : null}
            </ResultCard>
            <section className={styles.grid}>
              {[leftItem, rightItem].map((item, index) => (
                <ResultCard key={index} title={index === 0 ? "Left Analysis" : "Right Analysis"}>
                  {item ? (
                    <div className={styles.panel}>
                      <p className={styles.directionLine}>
                        <strong>{item.directionLabel || item.direction}</strong>
                        <span>{item.score >= 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2)}</span>
                      </p>
                      <p className={styles.meta}>Confidence: {Math.round((item.confidence || 0) * 100)}%</p>
                      <p className={styles.summary}>{item.summary}</p>
                      <div className={styles.driverList}>
                        {(item.drivers || []).slice(0, 4).map((driver) => (
                          <span key={driver}>{driver}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className={styles.text}>Choose a saved analysis to begin the comparison.</p>
                  )}
                </ResultCard>
              ))}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

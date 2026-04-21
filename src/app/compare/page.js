"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import ResultCard from "@/components/ResultCard/ResultCard";
import { normalizeResponse } from "@/lib/api";
import { listAnalyses } from "@/lib/storage";
import styles from "./page.module.css";

function itemLabel(item) {
  return item.title || item.url || `Analysis ${new Date(item.createdAt).toLocaleString()}`;
}

function normalizeSavedAnalysis(item) {
  if (!item) return null;
  const normalized = normalizeResponse(item, item.inputType || "text", {
    url: item.url,
    title: item.title,
    requestStartedAt: item.createdAt,
    requestId: item.requestMeta?.requestId,
    status: item.requestMeta?.status,
    endpoint: item.requestMeta?.endpoint
  });

  return {
    ...normalized,
    id: item.id || normalized.id,
    createdAt: item.createdAt || normalized.createdAt,
    title: item.title || normalized.title,
    url: item.url || normalized.url,
    inputType: item.inputType || normalized.inputType
  };
}

function directionComparison(leftItem, rightItem) {
  if (!leftItem || !rightItem) return "";
  const leftLabel = String(leftItem.directionLabel || leftItem.direction || "").trim().toLowerCase();
  const rightLabel = String(rightItem.directionLabel || rightItem.direction || "").trim().toLowerCase();
  return leftLabel && rightLabel && leftLabel === rightLabel ? "Same bias direction" : "Different bias direction";
}

export default function ComparePage() {
  const initialItems = listAnalyses();
  const [items] = useState(() => initialItems);
  const [left, setLeft] = useState(() => initialItems[0]?.id || "");
  const [right, setRight] = useState(() => initialItems[1]?.id || initialItems[0]?.id || "");

  const leftItem = useMemo(() => normalizeSavedAnalysis(items.find((item) => item.id === left)), [items, left]);
  const rightItem = useMemo(() => normalizeSavedAnalysis(items.find((item) => item.id === right)), [items, right]);
  const comparisonLabel = directionComparison(leftItem, rightItem);

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
              {comparisonLabel ? (
                <div className={styles.overview}>
                  <div>
                    <span>Bias direction</span>
                    <strong>{comparisonLabel}</strong>
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

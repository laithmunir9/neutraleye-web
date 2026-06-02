"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import ResultCard from "@/components/ResultCard/ResultCard";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useProAccess } from "@/lib/supabase/useProAccess";
import { normalizeResponse } from "@/lib/api";
import { listAnalyses } from "@/lib/storage";
import styles from "./page.module.css";

const LOCK_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function ProGate({ user }) {
  return (
    <div className={styles.gateOverlay}>
      <div className={styles.gateCard}>
        <div className={styles.gateIconWrap}>{LOCK_ICON}</div>
        <span className={styles.gateBadge}>Pro</span>
        <h2 className={styles.gateTitle}>Compare Analyses</h2>
        <p className={styles.gateDesc}>
          Side-by-side comparison of bias results is a Pro feature.
          {!user && " Sign in or upgrade to get access."}
        </p>
        <Link href="/pricing" className={styles.gateBtn}>View Plans</Link>
        {!user && (
          <Link href="/login" className={styles.gateSecondary}>Sign in</Link>
        )}
      </div>
    </div>
  );
}

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

function confidencePercent(item) {
  return Math.round((item?.confidence || 0) * 100);
}

function isNoBiasResult(item) {
  const label = String(item?.directionLabel || item?.direction || "").toLowerCase();
  return label.includes("no significant bias") || label === "neutral";
}

function displayDirection(item) {
  if (!item) return "";
  if (isNoBiasResult(item)) return "No significant bias detected.";
  return item.directionLabel || item.direction || "Analysis result";
}

function directionPhrase(item) {
  return displayDirection(item).replace(/[.!?]+$/u, "");
}

function stripEmoji(value) {
  return String(value || "").replace(/[\u{1f300}-\u{1faff}\u{2600}-\u{27bf}]/gu, "").trim();
}

function neutralSummaryText(item) {
  const drivers = Array.isArray(item?.drivers)
    ? item.drivers.map((driver) => String(driver || "").trim()).filter(Boolean)
    : [];

  if (!drivers.length) {
    return "This read stayed below the threshold for a meaningful bias flag. The review did not find a consistent pattern of loaded wording, one-sided framing, source imbalance, or missing attribution strong enough to mark the article as biased.";
  }

  return `This read stayed below the threshold for a meaningful bias flag. The review did not find a repeated bias signal across ${drivers.slice(0, 3).join(", ").toLowerCase()}, so the article can be read without a strong directional warning from NeutralEye.`;
}

function displaySummary(item) {
  if (!item) return "";
  if (isNoBiasResult(item)) return neutralSummaryText(item);
  return stripEmoji(item.summary) || "No summary returned.";
}

function sameAnalysis(leftItem, rightItem) {
  return Boolean(leftItem?.id && rightItem?.id && leftItem.id === rightItem.id);
}

function comparisonSummary(leftItem, rightItem) {
  if (!leftItem || !rightItem) return "";
  if (sameAnalysis(leftItem, rightItem)) {
    return "Both sides are showing the same saved analysis, so there is no meaningful difference to compare yet.";
  }

  const leftDirection = directionPhrase(leftItem) || "the left result";
  const rightDirection = directionPhrase(rightItem) || "the right result";
  const leftConfidence = confidencePercent(leftItem);
  const rightConfidence = confidencePercent(rightItem);
  const confidenceGap = Math.abs(leftConfidence - rightConfidence);
  const confidenceLine = confidenceGap
    ? `The confidence differs by ${confidenceGap} percentage points.`
    : "Both results carry the same confidence score.";

  if (leftDirection === rightDirection) {
    return `Both analyses point in the same direction: ${leftDirection}. ${confidenceLine} Read the summaries below for the finer difference in emphasis, evidence, and framing.`;
  }

  if (isNoBiasResult(leftItem) && !isNoBiasResult(rightItem)) {
    return `The left analysis did not find a significant bias signal, while the right analysis reads as ${rightDirection}. ${confidenceLine} The main difference is how strongly each result flags directional framing, emphasis, and bias signals.`;
  }

  if (!isNoBiasResult(leftItem) && isNoBiasResult(rightItem)) {
    return `The left analysis reads as ${leftDirection}, while the right analysis did not find a significant bias signal. ${confidenceLine} The main difference is how strongly each result flags directional framing, emphasis, and bias signals.`;
  }

  return `The left analysis reads as ${leftDirection}, while the right analysis reads as ${rightDirection}. ${confidenceLine} The main difference is how each result frames the article's tone, emphasis, and bias signals.`;
}

export default function ComparePage() {
  const { user } = useAuth();
  const { isPro } = useProAccess();

  const initialItems = listAnalyses();
  const [items] = useState(() => initialItems);
  const [left, setLeft] = useState(() => initialItems[0]?.id || "");
  const [right, setRight] = useState(() => initialItems[1]?.id || initialItems[0]?.id || "");

  const leftItem = useMemo(() => normalizeSavedAnalysis(items.find((item) => item.id === left)), [items, left]);
  const rightItem = useMemo(() => normalizeSavedAnalysis(items.find((item) => item.id === right)), [items, right]);
  const summary = comparisonSummary(leftItem, rightItem);

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Compare Analyses"
          subtitle="Place two saved results side by side to see where tone, framing, and confidence begin to diverge."
        />

        {!isPro ? (
          <div className={styles.gateWrapper}>
            <div className={styles.gateGhost} aria-hidden="true">
              <div className={styles.ghostCard}>
                <div className={styles.ghostRow}>
                  <div className={styles.ghostSelect} />
                  <div className={styles.ghostSelect} />
                </div>
                <div className={styles.ghostOverview}>
                  <div className={styles.ghostBlock} />
                  <div className={styles.ghostBlock} />
                </div>
              </div>
              <div className={styles.ghostGrid}>
                <div className={styles.ghostCard} />
                <div className={styles.ghostCard} />
              </div>
            </div>
            <ProGate user={user} />
          </div>
        ) : (
          <>
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
                  {summary ? (
                    <div className={styles.overview}>
                      <div className={styles.summaryCard}>
                        <span>Comparison Summary</span>
                        <p>{summary}</p>
                      </div>
                      <div>
                        <span>Confidence gap</span>
                        <strong>{Math.abs(confidencePercent(leftItem) - confidencePercent(rightItem))}%</strong>
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
                            <strong>{displayDirection(item)}</strong>
                          </p>
                          <p className={styles.meta}>Confidence: {Math.round((item.confidence || 0) * 100)}%</p>
                          <p className={styles.summary}>{displaySummary(item)}</p>
                        </div>
                      ) : (
                        <p className={styles.text}>Choose a saved analysis to begin the comparison.</p>
                      )}
                    </ResultCard>
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

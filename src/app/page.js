"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { analyzeInput, ApiError } from "@/lib/api";
import { BLOG_POSTS } from "@/lib/content";
import { saveAnalysis } from "@/lib/storage";
import styles from "./page.module.css";

const EXAMPLE_INPUT =
  "The article frames one side as reckless and dangerous, quotes only sympathetic experts, and leaves out the strongest objections that would challenge its main thesis.";
const LOADING_LABEL = "Reading...";
const RESULT_ORDER = ["bias", "summary", "examples", "sources", "recommendations", "confidence"];
const LANDING_STORAGE_KEY = "neutraleye.landing.v2";

function detectInputKind(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { kind: "empty", value: "" };

  const hasWhitespace = /\s/.test(trimmed);
  const urlLike = /^https?:\/\//i.test(trimmed) || (!hasWhitespace && /(?:www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(trimmed));

  if (!urlLike) return { kind: "text", value: trimmed };

  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!/^https?:$/.test(parsed.protocol)) {
      return { kind: "invalid-url", value: trimmed };
    }
    return { kind: "url", value: parsed.toString() };
  } catch {
    return { kind: "invalid-url", value: trimmed };
  }
}

function readLandingState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = JSON.parse(window.localStorage.getItem(LANDING_STORAGE_KEY) || "null");
    return raw && typeof raw === "object" ? raw : null;
  } catch {
    return null;
  }
}

function writeLandingState(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANDING_STORAGE_KEY, JSON.stringify(value));
}

function normalizeList(items, emptyLabel) {
  if (!Array.isArray(items) || !items.length) return [emptyLabel];
  return items;
}

function isNoBiasResult(result) {
  const label = String(result?.directionLabel || result?.direction || "").toLowerCase();
  const score = Math.abs(Number(result?.score) || 0);

  return label.includes("neutral") || label.includes("no significant bias") || score < 0.12;
}

function toDisplayResult(result) {
  return {
    isNoBias: isNoBiasResult(result),
    biasLevel: result.directionLabel || result.direction || "Neutral",
    summary: result.summary || "No summary returned.",
    examples: normalizeList(
      (result.examples || []).map((item) => item.quote || item.label).filter(Boolean),
      "No clear examples returned."
    ),
    sources: normalizeList(
      (result.sources || [])
        .map((item) => {
          if (typeof item === "string") return { label: item, href: "" };
          return {
            label: item?.name || item?.url || "Source",
            href: item?.url || ""
          };
        })
        .filter((item) => item.label),
      { label: "No sources returned.", href: "" }
    ),
    recommendations: normalizeList(result.recommendations || [], "No recommendations returned."),
    confidence: `${Math.round((Number(result.confidence) || 0) * 100)}%`
  };
}

function EmptyState() {
  return (
    <section className={styles.outputCard}>
      <p className={styles.outputLead}>Paste article text or a direct article URL to analyze.</p>
    </section>
  );
}

function LoadingState() {
  return (
    <section className={styles.outputCard} aria-live="polite">
      <div className={styles.loadingPulse} aria-hidden="true" />
      <p className={styles.outputLead}>{LOADING_LABEL}</p>
    </section>
  );
}

function ErrorState() {
  return (
    <section className={styles.outputCard} role="alert">
      <p className={styles.errorMessage}>
        {"\u26A0\uFE0F"} Could not analyze this page. Please open a real article or website and try again.
      </p>
    </section>
  );
}

function NoBiasState() {
  return (
    <section className={styles.outputCard}>
      <p className={styles.successMessage}>{"\u2705"} No significant bias detected. Please feel free to continue reading.</p>
    </section>
  );
}

function ResultState({ result, revealStep }) {
  return (
    <section className={styles.outputCard}>
      <div className={`${styles.outputSection} ${revealStep >= 1 ? styles.outputSectionVisible : ""}`}>
        <h3>Bias Level</h3>
        <p>{result.biasLevel}</p>
      </div>

      <div className={`${styles.outputSection} ${revealStep >= 2 ? styles.outputSectionVisible : ""}`}>
        <h3>Summary</h3>
        <p>{result.summary}</p>
      </div>

      <div className={`${styles.outputSection} ${revealStep >= 3 ? styles.outputSectionVisible : ""}`}>
        <h3>Examples of Bias</h3>
        <ul className={styles.outputList}>
          {result.examples.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={`${styles.outputSection} ${revealStep >= 4 ? styles.outputSectionVisible : ""}`}>
        <h3>Suggested Sources</h3>
        <ul className={styles.outputList}>
          {result.sources.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                item.label
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.outputSection} ${revealStep >= 5 ? styles.outputSectionVisible : ""}`}>
        <h3>Recommendations</h3>
        <ul className={styles.outputList}>
          {result.recommendations.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={`${styles.outputSection} ${revealStep >= 6 ? styles.outputSectionVisible : ""}`}>
        <h3>Analysis Confidence</h3>
        <p>{result.confidence}</p>
      </div>
    </section>
  );
}

export default function Home() {
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [analysisState, setAnalysisState] = useState({ status: "idle" });
  const [revealedSections, setRevealedSections] = useState(0);

  const inputKind = useMemo(() => detectInputKind(inputValue), [inputValue]);
  const canAnalyze = analysisState.status !== "loading" && inputKind.kind !== "empty" && inputKind.kind !== "invalid-url";

  useEffect(() => {
    inputRef.current?.focus();

    const restored = readLandingState();
    if (!restored) return;

    setInputValue(String(restored.inputValue || ""));
    if (restored.analysisResult) {
      setAnalysisState({ status: "result", data: restored.analysisResult });
      setRevealedSections(RESULT_ORDER.length);
    }
  }, []);

  useEffect(() => {
    if (analysisState.status !== "result" || analysisState.data.isNoBias) {
      if (analysisState.status !== "result") setRevealedSections(0);
      return undefined;
    }

    const timers = RESULT_ORDER.map((_, index) =>
      window.setTimeout(() => {
        setRevealedSections(index + 1);
      }, 80 + index * 120)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [analysisState]);

  async function handleAnalyze(nextValue = inputValue) {
    const detected = detectInputKind(nextValue);

    if (detected.kind === "empty" || detected.kind === "invalid-url") {
      setAnalysisState({ status: "error" });
      return;
    }

    setAnalysisState({ status: "loading" });
    setRevealedSections(0);
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const response = await analyzeInput({
        text: detected.kind === "text" ? detected.value : "",
        url: detected.kind === "url" ? detected.value : ""
      });
      saveAnalysis(response);
      const displayResult = toDisplayResult(response);
      setAnalysisState({ status: "result", data: displayResult });
      writeLandingState({ inputValue: nextValue, analysisResult: displayResult });
    } catch (error) {
      if (error instanceof ApiError) {
        setAnalysisState({ status: "error" });
        return;
      }

      setAnalysisState({ status: "error" });
    }
  }

  function handleExample() {
    setInputValue(EXAMPLE_INPUT);
    window.requestAnimationFrame(() => {
      handleAnalyze(EXAMPLE_INPUT);
    });
  }

  function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canAnalyze) {
      event.preventDefault();
      handleAnalyze();
    }
  }

  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero} id="analysis">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Manual article analysis</p>
            <h1>One place to check how a story is shaping the reader.</h1>
            <p className={styles.heroLead}>
              Paste article text or a direct article URL. NeutralEye reads the writing, sends it to
              <code>/check-bias</code>, and returns the same structured output used in the extension.
            </p>
          </div>

          <section className={styles.inputCard} aria-labelledby="analysis-title">
            <div className={styles.inputHeader}>
              <div>
                <p className={styles.cardEyebrow}>Primary input</p>
                <h2 id="analysis-title">Analyze an article</h2>
              </div>
            </div>

            <textarea
              ref={inputRef}
              className={styles.input}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste article text or a direct article URL"
              aria-label="Paste article text or a direct article URL"
            />

            <div className={styles.inputFooter}>
              <p className={styles.inputHint}>
                One input. One analysis. One structured result below. Use <span>Cmd/Ctrl + Enter</span> to run.
              </p>

              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={handleExample} disabled={analysisState.status === "loading"}>
                  Try Example
                </button>
                <button type="button" className={styles.primaryButton} onClick={() => handleAnalyze()} disabled={!canAnalyze}>
                  Analyze
                </button>
              </div>
            </div>
          </section>
        </section>

        <section className={styles.output} ref={outputRef} aria-live="polite">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Output</p>
              <h2>Extension output, mirrored on the website.</h2>
            </div>
          </div>

          {analysisState.status === "idle" ? <EmptyState /> : null}
          {analysisState.status === "loading" ? <LoadingState /> : null}
          {analysisState.status === "error" ? <ErrorState /> : null}
          {analysisState.status === "result" && analysisState.data.isNoBias ? <NoBiasState /> : null}
          {analysisState.status === "result" && !analysisState.data.isNoBias ? (
            <ResultState result={analysisState.data} revealStep={revealedSections} />
          ) : null}
        </section>

        <section className={styles.journal} id="journal">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Journal</p>
              <h2>Read more without leaving the product flow.</h2>
            </div>
            <Link href="/blog" className={styles.inlineLink}>
              View all posts
            </Link>
          </div>

          <div className={styles.journalGrid}>
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.journalCard}>
                <div className={styles.journalMeta}>
                  <span>{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}

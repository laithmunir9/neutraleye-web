"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BiasDetectionFlowGraphic from "@/components/BiasDetectionFlowGraphic/BiasDetectionFlowGraphic";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import { analyzeInput, ApiError } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import { BLOG_POSTS, EXTENSION_URL } from "@/lib/content";
import styles from "./page.module.css";

const TRUST_NOTES = [
  "No account required",
  "Website and extension share the same output structure",
  "Analysis focuses on article writing, not publisher labels"
];

const PRODUCT_NOTES = [
  {
    eyebrow: "Product-first",
    title: "The website is a usable analysis surface",
    body: "Paste article text or a URL and get the same structured result format the extension returns while you browse."
  },
  {
    eyebrow: "Bias signals",
    title: "Tone, framing, omission, and attribution",
    body: "NeutralEye surfaces the writing patterns that shape interpretation instead of collapsing everything into source reputation."
  },
  {
    eyebrow: "Designed output",
    title: "Results stay aligned with the extension",
    body: "Bias level, summary, examples, suggested sources, recommendations, and confidence remain in the familiar order."
  }
];

const JOURNAL_PREVIEW = BLOG_POSTS.slice(0, 3);
const EXAMPLE_INPUT =
  "The article frames one side as reckless and dangerous, quotes only sympathetic experts, and leaves out the strongest objections that would challenge its main thesis.";
const LOADING_STEPS = ["Reading article...", "Isolating readable text...", "Reviewing tone and framing..."];
const REVEAL_SEQUENCE = ["biasLevel", "summary", "examples", "sources", "recommendations", "confidence"];
const LANDING_STORAGE_KEY = "neutraleye.landing.v1";

function detectInputKind(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { kind: "empty", label: "" };

  const hasWhitespace = /\s/.test(trimmed);
  const urlLike = /^https?:\/\//i.test(trimmed) || (!hasWhitespace && /(?:www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(trimmed));

  if (urlLike) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
      if (!/^https?:$/.test(parsed.protocol)) {
        return { kind: "invalid-url", label: "Invalid URL" };
      }
      return { kind: "url", label: "URL detected", value: parsed.toString() };
    } catch {
      return { kind: "invalid-url", label: "Invalid URL" };
    }
  }

  return { kind: "text", label: "Text detected", value: trimmed };
}

function toDisplayResult(result) {
  return {
    status: "result",
    biasLevel: result.directionLabel || result.direction || "Neutral",
    summary: result.summary || "No summary returned.",
    examples: (result.examples || []).map((item) => item.quote || item.label).filter(Boolean),
    sources: (result.sources || [])
      .map((item) => (typeof item === "string" ? item : item?.name || item?.url || "Source"))
      .filter(Boolean),
    recommendations: (result.recommendations || []).filter(Boolean),
    confidence: `${Math.round((Number(result.confidence) || 0) * 100)}%`
  };
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

function clearLandingState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LANDING_STORAGE_KEY);
}

function EmptyResult() {
  return (
    <div className={styles.resultBox}>
      <p className={styles.resultLead}>Paste article text or a direct article URL to analyze.</p>
    </div>
  );
}

function LoadingResult({ label }) {
  return (
    <div className={styles.resultBox}>
      <p className={styles.resultLead}>{label}</p>
    </div>
  );
}

function ErrorResult({ message }) {
  return (
    <div className={styles.resultBox}>
      <p className={styles.errorMessage}>{"\u26A0\uFE0F"} {message}</p>
    </div>
  );
}

function ResultSections({ data, revealStep = REVEAL_SEQUENCE.length }) {
  return (
    <div className={styles.resultBox}>
      <div className={`${styles.resultSection} ${styles.revealBlock} ${revealStep >= 1 ? styles.revealVisible : ""}`}>
        <strong>Bias Level</strong>
        <p>{data.biasLevel}</p>
      </div>
      <div className={`${styles.resultSection} ${styles.revealBlock} ${revealStep >= 2 ? styles.revealVisible : ""}`}>
        <strong>Summary</strong>
        <p>{data.summary}</p>
      </div>
      <div className={`${styles.resultSection} ${styles.revealBlock} ${revealStep >= 3 ? styles.revealVisible : ""}`}>
        <strong>Examples of Bias</strong>
        <ul>
          {(data.examples.length ? data.examples : ["No clear examples returned."]).map((item, index) => (
            <li
              key={`${item}-${index}`}
              className={`${styles.revealListItem} ${revealStep >= 3 ? styles.revealVisible : ""}`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className={`${styles.resultSection} ${styles.revealBlock} ${revealStep >= 4 ? styles.revealVisible : ""}`}>
        <strong>Suggested Sources</strong>
        <ul>
          {(data.sources.length ? data.sources : ["No sources returned."]).map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={`${styles.resultSection} ${styles.revealBlock} ${revealStep >= 5 ? styles.revealVisible : ""}`}>
        <strong>Recommendations</strong>
        <ul>
          {(data.recommendations.length ? data.recommendations : ["No recommendations returned."]).map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={`${styles.resultSection} ${styles.revealBlock} ${revealStep >= 6 ? styles.revealVisible : ""}`}>
        <strong>Analysis Confidence</strong>
        <p>{data.confidence}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const heroInputRef = useRef(null);
  const demoInputRef = useRef(null);
  const demoSectionRef = useRef(null);
  const typingTimersRef = useRef([]);

  const [inputValue, setInputValue] = useState("");
  const [analysisState, setAnalysisState] = useState({ status: "idle" });
  const [loadingStep, setLoadingStep] = useState(0);
  const [revealedSections, setRevealedSections] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const inputKind = useMemo(() => detectInputKind(inputValue), [inputValue]);
  const isLoading = analysisState.status === "loading";
  const hasResult = analysisState.status === "result";
  const canAnalyze = !isLoading && inputKind.kind !== "empty" && inputKind.kind !== "invalid-url";
  const activeFlowStage = isLoading ? Math.min(4, Math.max(1, loadingStep + 2)) : Math.min(5, revealedSections || 1);

  useEffect(() => {
    heroInputRef.current?.focus();
    const restored = readLandingState();
    if (!restored) return;
    setInputValue(String(restored.inputValue || ""));
    if (restored.analysisResult) {
      setAnalysisState({ status: "result", data: restored.analysisResult });
    }
  }, []);

  useEffect(() => {
    return () => {
      typingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!isLoading) return undefined;

    setLoadingStep(0);
    const timers = LOADING_STEPS.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setLoadingStep(index + 1);
      }, 360 + index * 340)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isLoading]);

  useEffect(() => {
    if (!hasResult) {
      setRevealedSections(0);
      return undefined;
    }

    const timers = REVEAL_SEQUENCE.map((_, index) =>
      window.setTimeout(() => {
        setRevealedSections(index + 1);
      }, 140 + index * 240)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [hasResult, analysisState]);

  async function animateInputFill(nextValue) {
    typingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    typingTimersRef.current = [];
    setInputValue("");

    await new Promise((resolve) => {
      const totalSteps = Math.max(8, Math.min(nextValue.length, 28));
      const interval = Math.max(10, Math.floor(300 / totalSteps));

      for (let index = 0; index <= totalSteps; index += 1) {
        const timer = window.setTimeout(() => {
          const length = Math.round((nextValue.length * index) / totalSteps);
          setInputValue(nextValue.slice(0, length));
          if (index === totalSteps) {
            resolve();
          }
        }, interval * index);
        typingTimersRef.current.push(timer);
      }
    });
  }

  async function runAnalysis(nextInput = inputValue) {
    const detected = detectInputKind(nextInput);
    setHasInteracted(true);

    if (detected.kind === "empty") {
      setAnalysisState({ status: "error", message: "Paste an article or URL to analyze." });
      return;
    }

    if (detected.kind === "invalid-url") {
      setAnalysisState({ status: "error", message: "Please enter a valid article URL or paste article text." });
      return;
    }

    setAnalysisState({ status: "loading", label: LOADING_STEPS[0] });
    demoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const response = await analyzeInput({
        text: detected.kind === "text" ? detected.value : "",
        url: detected.kind === "url" ? detected.value : ""
      });
      saveAnalysis(response);
      const displayResult = toDisplayResult(response);
      setAnalysisState({ status: "result", data: displayResult });
      writeLandingState({ inputValue: nextInput, analysisResult: displayResult });
    } catch (error) {
      const message = error instanceof ApiError && error.code === "VALIDATION_ERROR"
        ? "Please enter a valid article URL or paste article text."
        : "Analysis failed. Please try again.";
      setAnalysisState({ status: "error", message });
    }
  }

  async function handleExample() {
    const nextValue = EXAMPLE_INPUT;
    setHasInteracted(true);
    await animateInputFill(nextValue);
    await runAnalysis(nextValue);
  }

  function handleReset() {
    typingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    typingTimersRef.current = [];
    setInputValue("");
    setAnalysisState({ status: "idle" });
    setRevealedSections(0);
    setLoadingStep(0);
    clearLandingState();
    demoInputRef.current?.focus();
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canAnalyze) {
        runAnalysis();
      }
    }
  }

  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero} id="product">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Website analyzer</p>
              <h1>Paste a news article. Get a structured bias read in seconds.</h1>
              <p className={styles.heroLead}>
                NeutralEye’s website is a working product surface, not just a landing page. Drop in article text or a
                direct article URL and get the same extension-style output order for tone, framing, omission, and
                confidence.
              </p>

              <div className={styles.heroAnalyzer}>
                <div className={styles.inputHeader}>
                  <div>
                    <p className={styles.panelEyebrow}>Article input</p>
                    <h2>Analyze directly on the page</h2>
                  </div>
                  {inputKind.label ? <span className={styles.detectedTag}>{inputKind.label}</span> : null}
                </div>

                <div className={styles.heroPrimaryRow}>
                  <input
                    ref={heroInputRef}
                    id="hero-analyze-input"
                    className={`${styles.input} ${inputKind.kind !== "empty" ? styles.inputReady : ""}`}
                    value={inputValue}
                    onChange={(event) => {
                      setHasInteracted(true);
                      setInputValue(event.target.value);
                    }}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Paste article URL or article text"
                    aria-label="Paste article URL or text"
                  />
                  <button type="button" className={styles.primaryButton} onClick={() => runAnalysis()} disabled={!canAnalyze}>
                    {isLoading ? LOADING_STEPS[loadingStep] : "Analyze article"}
                  </button>
                </div>

                <div className={styles.metaRow}>
                  <p>Free to use. No login. Best for real article pages and full article body text.</p>
                  <button type="button" className={styles.inlineAction} onClick={handleExample} disabled={isLoading}>
                    Load example
                  </button>
                </div>
              </div>

              <div className={styles.noteRow}>
                {TRUST_NOTES.map((item) => (
                  <span key={item} className={styles.notePill}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.visualSummary}>
                <p className={styles.panelEyebrow}>Active system view</p>
                <p>
                  NeutralEye validates the article first, then moves through extraction, tone review, framing checks,
                  and structured output.
                </p>
              </div>
              <BiasDetectionFlowGraphic activeStage={activeFlowStage} flowing={isLoading || hasResult} />
            </div>
          </div>
        </section>

        <section className={styles.section} id="demo" ref={demoSectionRef}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Live analysis</p>
              <h2>Use the product first. Install later if it fits your reading flow.</h2>
            </div>
            <p className={styles.sectionLead}>
              The website mirrors the extension’s structured response format so users can understand the product before
              deciding whether they want it in-browser.
            </p>
          </div>

          <div className={styles.demoShell}>
            <div className={styles.demoPanel}>
              <div className={styles.inputHeader}>
                <div>
                  <p className={styles.panelEyebrow}>Input panel</p>
                  <h3>Paste URL or article text</h3>
                </div>
                {inputKind.label ? <span className={styles.detectedTag}>{inputKind.label}</span> : null}
              </div>

              <textarea
                ref={demoInputRef}
                className={`${styles.textarea} ${inputKind.kind !== "empty" ? styles.inputReady : ""}`}
                value={inputValue}
                onChange={(event) => {
                  setHasInteracted(true);
                  setInputValue(event.target.value);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Paste a direct article URL or the article body"
              />

              <div className={styles.demoMeta}>
                <p>Outputs: bias level, summary, examples, suggested sources, recommendations, and confidence.</p>
                <button type="button" className={styles.inlineAction} onClick={handleExample} disabled={isLoading}>
                  Use sample article
                </button>
              </div>

              <div className={styles.demoActions}>
                <button type="button" className={styles.primaryButton} onClick={() => runAnalysis()} disabled={!canAnalyze}>
                  {isLoading ? LOADING_STEPS[loadingStep] : "Run live analysis"}
                </button>
                {hasInteracted || hasResult ? (
                  <button type="button" className={styles.tertiaryButton} onClick={handleReset}>
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div className={styles.outputPanel}>
              <div className={styles.inputHeader}>
                <div>
                  <p className={styles.panelEyebrow}>Extension parity</p>
                  <h3>Structured output</h3>
                </div>
                <span className={styles.resultMeta}>Same order as extension</span>
              </div>

              {analysisState.status === "idle" ? <EmptyResult /> : null}
              {analysisState.status === "loading" ? <LoadingResult label={LOADING_STEPS[loadingStep]} /> : null}
              {analysisState.status === "error" ? <ErrorResult message={analysisState.message} /> : null}
              {analysisState.status === "result" ? (
                <>
                  <ResultSections data={analysisState.data} revealStep={revealedSections} />
                  <p className={styles.resultConfidenceNote}>Based on writing patterns rather than publisher identity.</p>
                  <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.textLink}>
                    Use NeutralEye while browsing
                  </a>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.section} id="system">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>How it works</p>
              <h2>A calmer, clearer product story.</h2>
            </div>
            <Link href="/methodology" className={styles.textLink}>
              Read the methodology
            </Link>
          </div>

          <div className={styles.productGrid}>
            <article className={styles.featureLead}>
              <p className={styles.panelEyebrow}>Website before marketing</p>
              <h3>The homepage now behaves like a product workspace, with explanation and conversion sitting behind that core utility.</h3>
              <p>
                NeutralEye should earn trust by being usable immediately. The extension remains valuable, but it is now
                framed as a faster companion surface rather than the only real product.
              </p>
            </article>

            <div className={styles.noteGrid}>
              {PRODUCT_NOTES.map((item) => (
                <article key={item.title} className={styles.noteCard}>
                  <p className={styles.panelEyebrow}>{item.eyebrow}</p>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} id="journal">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Journal</p>
              <h2>Bias literacy content stays inside the product flow.</h2>
            </div>
            <Link href="/blog" className={styles.textLink}>
              Browse the archive
            </Link>
          </div>

          <div className={styles.journalGrid}>
            {JOURNAL_PREVIEW.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.journalCard}>
                <div className={styles.journalMeta}>
                  <span>{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span className={styles.cardLink}>Read article</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BiasDetectionFlowGraphic from "@/components/BiasDetectionFlowGraphic/BiasDetectionFlowGraphic";
import { analyzeInput, ApiError } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import styles from "./page.module.css";

const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/neutraleye-bias-checker/fdkachmcdaebefhpkpjapoglbiakoffe";

const HERO_TRUST_PILLS = ["AI-powered", "Privacy-safe", "No data storage"];

const TRUST_STRIP_ITEMS = [
  "No data stored",
  "Runs only when you click",
  "Article-level analysis, not source bias",
  "No tracking or accounts required"
];

const BLOG_PREVIEW = [
  {
    href: "/blog/what-is-media-bias",
    category: "Media bias",
    title: "What is media bias?",
    copy: "A practical explanation of wording, framing, sourcing, and omission."
  },
  {
    href: "/blog/how-to-detect-bias-in-news",
    category: "Critical thinking",
    title: "How to detect bias in news",
    copy: "A repeatable reading checklist for comparing articles and narratives."
  },
  {
    href: "/blog",
    category: "Media literacy",
    title: "More guides from the NeutralEye blog",
    copy: "Explore explainers on framing, propaganda, and responsible source comparison."
  }
];

const EXAMPLE_INPUT =
  "The article frames one side as reckless and dangerous, quotes only sympathetic experts, and leaves out the strongest objections that would challenge its main thesis.";

const LOADING_STEPS = ["Reading...", "Extracting article text...", "Analyzing tone and framing..."];
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
      <p className={styles.resultLead}>Paste an article or URL to analyze.</p>
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
  const [hoveredAnalyze, setHoveredAnalyze] = useState("");
  const [showDemoNudge, setShowDemoNudge] = useState(false);
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

  useEffect(() => {
    function handleScroll() {
      if (!hasInteracted && window.scrollY > 900) {
        setShowDemoNudge(true);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasInteracted]);

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
    setShowDemoNudge(false);

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

  function getAnalyzeLabel(key) {
    if (isLoading) return LOADING_STEPS[loadingStep];
    return hoveredAnalyze === key ? "Analyze \u2192 see bias" : "Analyze";
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.wordmark} aria-label="NeutralEye home">
          <Image src="/neutraleye-logo-48.png" alt="" width={32} height={32} />
          <span>NeutralEye</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <a href="#product">Product</a>
          <a href="#demo">Live analysis</a>
          <Link href="/blog">Blog</Link>
          <a href="#about">About</a>
        </nav>

        <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.primaryButton}>
          Install Extension
        </a>
      </header>

      <section className={styles.hero} id="product">
        <div className={styles.heroHeader}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AI-powered news bias analysis</p>
            <h1>Detect bias in any news article — instantly.</h1>
            <p className={styles.subheadline}>
              NeutralEye analyzes tone, framing, and omission so readers can understand how a story is being shaped,
              not just where it was published.
            </p>
            <p className={styles.conversionLine}>
              Most tools label sources. NeutralEye analyzes how the article is written.
            </p>
            <div className={styles.heroActionShell}>
              <p className={styles.heroActionLabel}>Paste a news article or URL to analyze</p>
              <div className={styles.heroPrimaryRow}>
                <input
                  ref={heroInputRef}
                  id="hero-analyze-input"
                  className={`${styles.input} ${styles.heroPrimaryInput} ${inputKind.kind !== "empty" ? styles.inputReady : ""}`}
                  value={inputValue}
                  onChange={(event) => {
                    setHasInteracted(true);
                    setInputValue(event.target.value);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Paste article URL or text"
                  aria-label="Paste article URL or text"
                />
                <button
                  type="button"
                  className={`${styles.primaryButton} ${styles.analyzeButton} ${inputKind.kind !== "empty" ? styles.primaryButtonReady : ""}`}
                  onClick={() => runAnalysis()}
                  disabled={!canAnalyze}
                  onMouseEnter={() => setHoveredAnalyze("hero")}
                  onMouseLeave={() => setHoveredAnalyze("")}
                >
                  {getAnalyzeLabel("hero")}
                </button>
              </div>
              <div className={styles.inputMetaRow}>
                <p className={styles.heroActionSubtext}>No signup required. Works instantly.</p>
                {inputKind.label ? <span className={styles.detectedTag}>{inputKind.label}</span> : null}
              </div>
              <p className={styles.resultPreviewHint}>Outputs: Bias level, explanation, examples, and sources</p>
              <p className={styles.microTrustLine}>Used to evaluate real-world news articles in seconds</p>
              <div className={styles.zeroFrictionRow}>
                <span>No login required</span>
                <span>Free to use</span>
                <span>Takes ~5 seconds</span>
              </div>
              <div className={styles.heroQuickActions}>
                <button type="button" className={styles.secondaryButton} onClick={handleExample} disabled={isLoading}>
                  Try Example
                </button>
              </div>
            </div>
            <div className={styles.heroPills} aria-label="Product trust signals">
              {HERO_TRUST_PILLS.map((item) => (
                <span key={item} className={styles.heroPill}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.heroGraphicColumn}>
            <p className={styles.heroSummaryLabel}>How NeutralEye works</p>
            <BiasDetectionFlowGraphic activeStage={activeFlowStage} flowing={isLoading || hasResult} />
          </div>
        </div>

        <div className={styles.trustStrip} aria-label="Trust strip">
          {TRUST_STRIP_ITEMS.map((item) => (
            <span key={item} className={styles.trustStripItem}>
              <span className={styles.trustCheck}>✓</span>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.section} id="demo" ref={demoSectionRef}>
        <div className={styles.sectionHeading}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Live Demo</p>
            <h2>Use the product directly on the page.</h2>
            <p>
              The live tool accepts either a full article URL or pasted article text, then returns a structured result
              using the same extension-style output order.
            </p>
          </div>
        </div>

        <div className={styles.demoShell}>
          <div className={styles.demoGrid}>
            <div className={styles.demoPanel}>
              <div className={styles.demoPanelHeader}>
                <div>
                  <p className={styles.productStageLabel}>Input</p>
                  <h3>Paste URL or text</h3>
                </div>
                {inputKind.label ? <span className={styles.demoBadge}>{inputKind.label}</span> : null}
              </div>
              <label className={styles.inputLabel} htmlFor="demo-text">
                Article input
              </label>
              <textarea
                ref={demoInputRef}
                id="demo-text"
                className={`${styles.textarea} ${inputKind.kind !== "empty" ? styles.inputReady : ""}`}
                value={inputValue}
                onChange={(event) => {
                  setHasInteracted(true);
                  setInputValue(event.target.value);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Paste an article URL or article text"
              />
              <p className={styles.demoZeroFriction}>No login required. Free to use. Takes ~5 seconds.</p>
              <p className={styles.resultPreviewHint}>Outputs: Bias level, explanation, examples, and sources</p>
              <p className={styles.microTrustLine}>Used to evaluate real-world news articles in seconds</p>
              <div className={styles.demoActions}>
                <button
                  type="button"
                  className={`${styles.primaryButton} ${styles.analyzeButton} ${inputKind.kind !== "empty" ? styles.primaryButtonReady : ""}`}
                  onClick={() => runAnalysis()}
                  disabled={!canAnalyze}
                  onMouseEnter={() => setHoveredAnalyze("demo")}
                  onMouseLeave={() => setHoveredAnalyze("")}
                >
                  {getAnalyzeLabel("demo")}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleExample} disabled={isLoading}>
                  Try Example
                </button>
              </div>
              {hasResult ? (
                <button type="button" className={styles.resetButton} onClick={handleReset}>
                  Analyze another article
                </button>
              ) : null}
            </div>

            <div className={`${styles.demoOutputPanel} ${isLoading || hasResult ? styles.demoOutputFocused : ""}`}>
              <div className={styles.demoPanelHeader}>
                <div>
                  <p className={styles.productStageLabel}>Live analysis result</p>
                  <h3>Structured output</h3>
                </div>
                {inputValue ? (
                  <button type="button" className={styles.clearButton} onClick={handleReset}>
                    Clear
                  </button>
                ) : null}
              </div>

              {analysisState.status === "idle" ? <EmptyResult /> : null}
              {analysisState.status === "loading" ? <LoadingResult label={analysisState.label} /> : null}
              {analysisState.status === "error" ? <ErrorResult message={analysisState.message} /> : null}
              {analysisState.status === "result" ? (
                <>
                  <ResultSections data={analysisState.data} revealStep={revealedSections} />
                  <p className={styles.resultConfidenceNote}>Based on writing patterns, not publisher identity</p>
                  <a
                    href={EXTENSION_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inlineInstallCta}
                  >
                    Analyze articles directly while browsing → Install Extension
                  </a>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {showDemoNudge && !hasInteracted ? (
          <p className={styles.demoNudge}>Paste any article above to test how it works.</p>
        ) : null}
      </section>

      <section className={`${styles.section} ${styles.deferredSection}`} id="about">
        <div className={styles.sectionHeading}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>From The Blog</p>
            <h2>Bias literacy content supports the product experience.</h2>
            <p>Use the blog to understand bias patterns, then run your own article through the tool.</p>
          </div>
          <div className={styles.heroActions}>
            <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.primaryButton}>
              Install Extension
            </a>
          </div>
        </div>

        <div className={styles.blogGrid}>
          {BLOG_PREVIEW.map((post) => (
            <article key={post.title} className={styles.blogCard}>
              <p className={styles.blogCategory}>{post.category}</p>
              <h3>{post.title}</h3>
              <p>{post.copy}</p>
              <Link href={post.href} className={styles.textLink}>
                Read article
              </Link>
            </article>
          ))}
        </div>
        <div className={styles.blogDemoCta}>
          <p>Try analyzing an article yourself.</p>
          <a
            href="#demo"
            className={styles.secondaryButton}
            onClick={() => {
              setHasInteracted(true);
              setInputValue(EXAMPLE_INPUT);
            }}
          >
            Try Demo
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.wordmark}>
            <Image src="/neutraleye-logo-48.png" alt="" width={28} height={28} />
            <span>NeutralEye</span>
          </Link>
          <p className={styles.footerCopy}>Transparent AI analysis for tone, framing, and omission in news articles.</p>
        </div>

        <nav className={styles.footerNav} aria-label="Footer">
          <a href="#privacy">Privacy Policy</a>
          <Link href="/blog">Blog</Link>
          <a href="#about">About</a>
          <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
            Install Extension
          </a>
        </nav>
      </footer>
    </main>
  );
}

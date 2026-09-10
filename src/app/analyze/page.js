"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import InputPanel from "@/components/InputPanel/InputPanel";
import QuoteEvidence from "@/components/QuoteEvidence/QuoteEvidence";
import Link from "next/link";
import { analyzeText, analyzeUrl, ApiError } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import { resolveAnalysis } from "@/lib/supabase/analyses";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useAnalysisLimit } from "@/lib/supabase/useAnalysisLimit";
import styles from "./page.module.css";
import { isNoBiasRecord, NO_BIAS_LABEL } from "@/lib/biasLevel";

const STAGES = ["Reading", "Checking framing", "Reviewing tone", "Writing analysis"];
/** Shared with InputPanel's readiness label. Below this there is not enough article to read. */
const MIN_TEXT_CHARS = 200;
const SETTINGS_KEY = "neutraleye.settings.v1";
const DEFAULT_SUMMARY = "A focused summary of the detected framing will appear here after analysis.";
const NEUTRAL_SUMMARY_TEMPLATE =
  "This read stayed below the threshold for a meaningful framing flag. The review did not find a consistent pattern of loaded wording, one-sided framing, source imbalance, or missing attribution strong enough to mark the article as slanted.";
const NEUTRAL_NOTE_ITEMS = [
  "No strong directional pattern repeated across wording, framing, and attribution.",
  "Visible signals stayed below the threshold required for a meaningful framing flag.",
  "This result reflects the current text only and is not a guarantee that every relevant context is present."
];
const CONTENT_TYPE_LABELS = {
  news: "News",
  opinion: "Opinion",
  analysis: "Analysis/Commentary"
};
const DEFAULT_RESULT = {
  id: "",
  createdAt: "",
  inputType: "text",
  contentType: "news",
  direction: "Neutral",
  directionLabel: "Neutral",
  confidence: 0.5,
  summary: DEFAULT_SUMMARY,
  drivers: ["Loaded wording", "Framing", "Source imbalance", "Attribution gaps"],
  examples: [],
  sources: [],
  recommendations: []
};
const UNREADABLE_PAGE_TITLE = "Could not analyze this page";
const UNREADABLE_PAGE_MESSAGE = "Please open a real article or website and try again.";
const UNREADABLE_TEXT_TITLE = "Could not analyze this text";
const UNREADABLE_TEXT_MESSAGE = "Please paste a real article body and try again.";
const INVALID_URL_TITLE = "Could not analyze this URL";
const INVALID_URL_MESSAGE = "Please enter a full article URL and try again.";

function isHistorySavingEnabled() {
  if (typeof window === "undefined") return true;
  try {
    const settings = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") || {};
    return settings.saveHistory !== false;
  } catch {
    return true;
  }
}

// Keyed off the model's enum in requestMeta; the display label is a fallback for
// pre-rename records only. Never match on display copy.
const isNoBiasResult = (result) => isNoBiasRecord(result);

function contentTypeLabel(result, hasAnalysis) {
  if (!hasAnalysis) return "";
  return CONTENT_TYPE_LABELS[result?.contentType] || "";
}

/*
 * The direction template in src/lib/analysis.js asks the model for
 * "toward <entity>" / "against <entity>", and the model sometimes returns the
 * placeholder unsubstituted. That string is the largest text on the result
 * screen, so an unfilled template renders as "Moderate framing against
 * <entity>" at display size. Strip any angle-bracket placeholder rather than
 * print it; the framing level on its own is still true.
 */
function stripPlaceholders(value) {
  return String(value || "")
    .replace(/\s*(?:toward|towards|against)?\s*<[^>]*>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function resultTitle(result, hasAnalysis) {
  if (!hasAnalysis) return "Ready to analyze";
  if (isNoBiasResult(result)) return `${NO_BIAS_LABEL}.`;
  const label = stripPlaceholders(result.directionLabel || result.direction);
  return label || "Framing signal found";
}

function resultHelperText(result, hasAnalysis) {
  if (!hasAnalysis) return "Run an analysis to see tone, framing, and omission.";
  if (isNoBiasResult(result)) return "Please feel free to continue reading.";
  return "Overall finding based on the article's tone, framing, sourcing, and attribution.";
}

function summaryText(result, hasAnalysis) {
  if (!hasAnalysis) return DEFAULT_SUMMARY;
  if (isNoBiasResult(result)) return neutralSummaryText(result);
  return result?.summary || "No summary returned.";
}

function neutralNoteItems(result) {
  const customDrivers = Array.isArray(result?.drivers)
    ? result.drivers.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!customDrivers.length) return NEUTRAL_NOTE_ITEMS;

  return [
    `No strong framing signal repeated consistently across ${customDrivers.slice(0, 3).join(", ").toLowerCase()}.`,
    "Visible signals stayed below the threshold required for a meaningful framing flag.",
    "This result reflects the current text only and is not a guarantee that every relevant context is present."
  ];
}

function neutralSummaryText(result) {
  const drivers = Array.isArray(result?.drivers)
    ? result.drivers.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!drivers.length) return NEUTRAL_SUMMARY_TEMPLATE;

  return `This read stayed below the threshold for a meaningful framing flag. The review did not find a repeated framing signal across ${drivers.slice(0, 3).join(", ").toLowerCase()}, so the article can be read without a strong directional warning from NeutralEye.`;
}

function confidenceLevel(value) {
  const pct = Math.round((Number(value) || 0) * 100);
  if (pct >= 80) return "High";
  if (pct >= 60) return "Moderate–high";
  if (pct >= 40) return "Moderate";
  if (pct >= 20) return "Low–moderate";
  return "Low";
}

function getTextQualityError(value) {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  const words = cleaned.toLowerCase().match(/[a-z0-9']+/g) || [];
  const sentences = cleaned.split(/[.!?]+/).map((item) => item.trim()).filter((item) => item.length >= 18);
  const uniqueWords = new Set(words);
  const uniqueRatio = words.length ? uniqueWords.size / words.length : 0;
  const counts = words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());
  const mostRepeatedCount = counts.size ? Math.max(...counts.values()) : 0;
  const repeatedShare = words.length ? mostRepeatedCount / words.length : 0;

  if (words.length >= 40 && (uniqueWords.size < 12 || uniqueRatio < 0.18 || repeatedShare > 0.45)) {
    return "Text appears too repetitive to evaluate as an article.";
  }

  if (cleaned.length >= 200 && sentences.length < 2) {
    return "Text does not appear to contain enough article-like sentences.";
  }

  return null;
}

function getUrlQualityError(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Paste the full article link, including https://.";
  if (!/^https?:\/\//i.test(cleaned)) return "Start the link with https:// or http://.";

  try {
    const parsed = new URL(cleaned);
    const hostname = parsed.hostname.replace(/^www\./i, "");
    const hasReadableHost = hostname.includes(".") && hostname.split(".").some((part) => part.length >= 2);
    const isLocalhost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(hostname);

    if (!hasReadableHost && !isLocalhost) {
      return "Use a complete website address, like https://example.com/news/story.";
    }

    if (!parsed.pathname || parsed.pathname === "/") {
      return "Open the specific article page first, then paste that full URL here.";
    }
  } catch {
    return "This does not look like a usable article link yet.";
  }

  return null;
}

function AnalyzePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { increment } = useAnalysisLimit();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(DEFAULT_RESULT);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(STAGES[0]);
  const [errorState, setErrorState] = useState(null);
  const [extractionStatus, setExtractionStatus] = useState("Extraction status: idle");
  const [extractedPreview, setExtractedPreview] = useState("");
  const [extractedPreviewUrl, setExtractedPreviewUrl] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [examplePending, setExamplePending] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    resolveAnalysis(id, user).then((saved) => {
      if (saved) {
        setResult(saved);
        setHasAnalysis(true);
        setMode(saved.inputType || "text");
        setUrl(saved.url || "");
        setErrorState(null);
      }
    });
  }, [searchParams, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const settings = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") || {};
      setReduceMotion(Boolean(settings.reduceMotion));
    } catch {
      setReduceMotion(false);
    }
  }, []);

  useEffect(() => {
    if (!loading || reduceMotion) return undefined;
    let index = 0;
    setLoadingStage(STAGES[0]);
    const timer = window.setInterval(() => {
      index = (index + 1) % STAGES.length;
      setLoadingStage(STAGES[index]);
    }, 900);
    return () => window.clearInterval(timer);
  }, [loading, reduceMotion]);

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setErrorState(null);
  }

  function handleTextChange(nextText) {
    setText(nextText);
    if (errorState) setErrorState(null);
  }

  function handleUrlChange(nextUrl) {
    const cleaned = String(nextUrl || "").trim();
    if (!cleaned || cleaned !== extractedPreviewUrl) {
      setExtractedPreview("");
      setExtractedPreviewUrl("");
      setExtractionStatus("Extraction status: idle");
    }
    if (errorState) setErrorState(null);
    setUrl(nextUrl);
  }

  const handleAnalyze = useCallback(async () => {
    // Pressing analyze without usable input answers the question rather than
    // doing nothing. The button is live in every state, so this is where the
    // requirement gets stated.
    if (mode === "url" && !url.trim()) {
      setErrorState({
        title: "Add the article link",
        message: "Paste the full link to the article you want read, including https://."
      });
      return;
    }
    if (mode === "text" && text.trim().length < MIN_TEXT_CHARS) {
      const short = text.trim().length;
      setErrorState({
        title: short ? "That is not enough of the article yet" : "Paste the article text",
        message: `Paste at least ${MIN_TEXT_CHARS} characters of the article body${short ? `, ${MIN_TEXT_CHARS - short} more to go` : ""}. Or press Try Example to see a finished read first.`
      });
      return;
    }

    setErrorState(null);
    setLoading(true);
    if (mode === "url") {
      setExtractedPreview("");
      setExtractionStatus("Extraction status: fetching article");
    } else {
      setExtractionStatus("Extraction status: idle");
    }
    const startedAt = new Date().toISOString();
    if (process.env.NODE_ENV !== "production") {
      console.info("[neutraleye:web] analyze click", { mode, startedAt, url: mode === "url" ? url.trim() : undefined });
    }

    try {
      let response;
      if (mode === "url") {
        const urlQualityError = getUrlQualityError(url);
        if (urlQualityError) {
          throw new ApiError(INVALID_URL_MESSAGE, {
            status: 0,
            code: "URL_VALIDATION_FAILED",
            endpoint: "/analyze-url",
            details: urlQualityError
          });
        }
        response = await analyzeUrl(url.trim());
        if (response.extractedText) {
          setExtractedPreview(response.extractedText);
          setExtractedPreviewUrl(url.trim());
          setExtractionStatus("Extraction status: extracted and analyzed");
        } else {
          setExtractionStatus("Extraction status: analyzed from backend pipeline");
        }
      } else {
        const textQualityError = getTextQualityError(text);
        if (textQualityError) {
          throw new ApiError(UNREADABLE_TEXT_MESSAGE, {
            status: 0,
            code: "ARTICLE_VALIDATION_FAILED",
            endpoint: "/analyze-text",
            details: textQualityError
          });
        }
        response = await analyzeText(text.trim());
      }

      if (isHistorySavingEnabled()) {
        saveAnalysis(response, user);
      }
      increment();
      setResult(response);
      setHasAnalysis(true);
      setErrorState(null);
      if (process.env.NODE_ENV !== "production") {
        console.info("[neutraleye:web] analyze success", {
          mode,
          status: response.requestMeta?.status || 200,
          requestId: response.requestMeta?.requestId || "",
          completedAt: response.requestMeta?.requestCompletedAt || new Date().toISOString()
        });
      }
    } catch (analysisError) {
      const isApiError = analysisError instanceof ApiError;
      const baseMessage = String(analysisError?.message || "Failed to analyze.").trim();
      const status = isApiError ? analysisError.status : 0;
      const details = isApiError ? analysisError.details : "";
      const code = isApiError ? analysisError.code : "";
      let message = details ? `${baseMessage} ${details}` : baseMessage;
      let title = mode === "url" ? "URL analysis failed" : "Text analysis failed";

      if (status === 429) {
        title = "Rate limit exceeded";
        message = "Too many requests. Please wait a minute and try again.";
      }

      if (status === 503 || code === "AI_DISABLED") {
        title = "Analysis unavailable";
        message = "Failed to analyze framing. Please try again later.";
      }

      if (code === "VALIDATION_ERROR") {
        title = mode === "url" ? INVALID_URL_TITLE : "Check the article text";
        message = mode === "url"
          ? INVALID_URL_MESSAGE
          : "Please paste a real article body and try again.";
      }

      if (code === "URL_VALIDATION_FAILED") {
        title = INVALID_URL_TITLE;
        message = INVALID_URL_MESSAGE;
      }

      if (code === "ARTICLE_VALIDATION_FAILED") {
        title = mode === "url" ? UNREADABLE_PAGE_TITLE : UNREADABLE_TEXT_TITLE;
        message = mode === "url" ? UNREADABLE_PAGE_MESSAGE : UNREADABLE_TEXT_MESSAGE;
      }

      if (code === "URL_FETCH_TIMEOUT") {
        title = "URL fetch timed out";
        message = "The article took too long to load for analysis.";
      }

      if (code === "URL_FETCH_FAILED" || code === "URL_EXTRACTION_ERROR") {
        title = UNREADABLE_PAGE_TITLE;
        message = UNREADABLE_PAGE_MESSAGE;
      }

      if (code === "URL_EXTRACTION_TOO_SHORT") {
        title = UNREADABLE_PAGE_TITLE;
        message = UNREADABLE_PAGE_MESSAGE;
      }

      if (code === "TIMEOUT") {
        title = "Analysis timed out";
        message = "Failed to analyze framing. Please try again later.";
      }

      if (code === "NETWORK_ERROR") {
        title = "Analysis unavailable";
        message = "Failed to analyze framing. Please try again later.";
      }

      if (mode === "url") {
        setExtractionStatus(`Extraction status: failed${code ? ` (${code})` : ""}`);
      }
      if (process.env.NODE_ENV !== "production") {
        console.info("[neutraleye:web] analyze failed", {
          mode,
          status,
          message,
          requestId: analysisError?.requestId || ""
        });
      }
      setErrorState({
        title,
        message,
        detail: details
      });
    } finally {
      setLoading(false);
    }
  }, [mode, text, url, increment]);

  function handleExample() {
    const sampleText =
      "The article frames one side as reckless and dangerous, quotes only sympathetic experts, and leaves out the strongest objections that would challenge its main thesis. It repeatedly describes one group as responsible while portraying the opposing view as chaotic and unserious. The piece includes supportive quotes from aligned analysts but gives little space to counterarguments or competing evidence. Readers are guided toward a single interpretation through selective emphasis and emotionally weighted wording.";
    setMode("text");
    setText(sampleText);
    setUrl("");
    setExamplePending(true);
  }

  useEffect(() => {
    if (!examplePending) return;
    setExamplePending(false);
    handleAnalyze();
  }, [examplePending, handleAnalyze]);

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Analyze an Article"
          subtitle="Paste article text or a URL. NeutralEye checks tone, framing, and omission and returns what it finds."
        />

        <section className={styles.grid}>
          <div className={styles.inputColumn}>
            <InputPanel
              mode={mode}
              onModeChange={handleModeChange}
              text={text}
              url={url}
              onTextChange={handleTextChange}
              onUrlChange={handleUrlChange}
              onAnalyze={handleAnalyze}
              onExample={handleExample}
              loading={loading}
              loadingStage={loadingStage}
              extractedPreview={extractedPreview}
              errorState={errorState}
              analysisComplete={hasAnalysis && !loading}
            />
          </div>

          <section
            className={`${styles.outputColumn} ${loading ? styles.isLoading : ""} ${
              hasAnalysis ? styles.hasResult : styles.emptyState
            }`}
          >
            {/* The finding leads, in the reading voice. It used to be the third
                line of a card headed "Analysis Result", set smaller than the
                confidence decimal below it, so the least meaningful number on
                the screen was the largest thing on it. */}
            <div className={styles.resultHead}>
              <p className={styles.finding}>{resultTitle(result, hasAnalysis)}</p>
              <p className={styles.helperText}>{resultHelperText(result, hasAnalysis)}</p>
              {contentTypeLabel(result, hasAnalysis) ? (
                <p className={styles.contentTypeBadge}>{contentTypeLabel(result, hasAnalysis)}</p>
              ) : null}
            </div>

            <p className={`${styles.bodyText} ${!hasAnalysis ? styles.placeholderText : ""}`}>
              {summaryText(result, hasAnalysis)}
            </p>

            {/* The evidence, promoted. This is the differentiator and it sat
                fourth of seven, in a container identical to the ones holding
                suggested reading. */}
            {result.examples.length ? (
              <div className={styles.evidence}>
                <h2 className={styles.blockHeading}>
                  {result.examples.length === 1 ? "1 marked passage" : `${result.examples.length} marked passages`}
                </h2>
                <div className={styles.examplesList}>
                  {result.examples.map((example, index) => (
                    <QuoteEvidence
                      key={`${example.quote}-${index}`}
                      quote={example.quote}
                      label={example.label}
                      explanation={example.explanation}
                      highlight={example.highlights || []}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className={`${styles.bodyText} ${styles.placeholderText}`}>
                {hasAnalysis && isNoBiasResult(result)
                  ? "No passage crossed the threshold for a meaningful framing flag in this pass."
                  : "Marked passages will appear here, each with the sentence that carries it."}
              </p>
            )}

            {hasAnalysis && isNoBiasResult(result) ? (
              <details className={styles.more}>
                <summary>Why nothing was flagged</summary>
                <ul className={styles.simpleList}>
                  {neutralNoteItems(result).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}

            {/* Secondary by design. Front-loading seven equal sections is what
                made this screen hard to read: everything arrived at once and
                nothing said what to look at first. */}
            {hasAnalysis ? (
              <div className={styles.secondary}>
                <details className={styles.more}>
                  <summary>Other coverage of this story</summary>
                  {result.sources.length ? (
                    <ul className={styles.simpleList}>
                      {result.sources.map((source, index) => (
                        <li key={`${index}-${typeof source === "string" ? source : source?.url || source?.name}`}>
                          {typeof source === "string" ? (
                            source
                          ) : source?.url ? (
                            <a href={source.url} target="_blank" rel="noreferrer">
                              {source.name || source.url}
                            </a>
                          ) : (
                            source?.name || "Source"
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.bodyText}>
                      No comparison sources were suggested for this read.
                    </p>
                  )}
                </details>

                <details className={styles.more}>
                  <summary>What to read next</summary>
                  {result.recommendations.length ? (
                    <ul className={styles.simpleList}>
                      {result.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.bodyText}>
                      No follow-up steps were generated for this read.
                    </p>
                  )}
                </details>

                <details className={styles.more}>
                  <summary>How confident this read is</summary>
                  {!isNoBiasResult(result) ? (
                    <div className={styles.confidence}>
                      <div className={styles.confTrack}>
                        <div
                          className={styles.confFill}
                          style={{ width: `${Math.round(result.confidence * 100)}%` }}
                        />
                      </div>
                      <p className={styles.bodyText}>
                        {confidenceLevel(result.confidence)}. Confidence reflects how consistently the
                        signals appear across tone, framing, sourcing and omission. It is not a claim
                        of factual certainty.
                      </p>
                    </div>
                  ) : (
                    <p className={styles.bodyText}>
                      Confidence is only reported when there is a framing pattern to measure. This
                      read did not find one.
                    </p>
                  )}
                </details>
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </AppShell>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={null}>
      <AnalyzePageContent />
    </Suspense>
  );
}

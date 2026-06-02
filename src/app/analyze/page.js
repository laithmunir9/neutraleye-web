"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import InputPanel from "@/components/InputPanel/InputPanel";
import Link from "next/link";
import { analyzeText, analyzeUrl, ApiError } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import { resolveAnalysis } from "@/lib/supabase/analyses";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useAnalysisLimit } from "@/lib/supabase/useAnalysisLimit";
import styles from "./page.module.css";

const STAGES = ["Reading", "Checking framing", "Reviewing tone", "Writing analysis"];
const SETTINGS_KEY = "neutraleye.settings.v1";
const DEFAULT_SUMMARY = "A focused summary of the detected bias will appear here after analysis.";
const NEUTRAL_SUMMARY_TEMPLATE =
  "This read stayed below the threshold for a meaningful bias flag. The review did not find a consistent pattern of loaded wording, one-sided framing, source imbalance, or missing attribution strong enough to mark the article as biased.";
const NEUTRAL_NOTE_ITEMS = [
  "No strong directional pattern repeated across wording, framing, and attribution.",
  "Visible signals stayed below the threshold required for a meaningful bias flag.",
  "This result reflects the current text only and is not a guarantee that every relevant context is present."
];
const DEFAULT_RESULT = {
  id: "",
  createdAt: "",
  inputType: "text",
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

function isNoBiasResult(result) {
  const label = String(result?.directionLabel || result?.direction || "").toLowerCase();

  return label.includes("no significant bias") || label === "neutral";
}

function resultTitle(result, hasAnalysis) {
  if (!hasAnalysis) return "Ready to analyze";
  if (isNoBiasResult(result)) return "No significant bias detected.";
  return result.directionLabel || result.direction;
}

function resultHelperText(result, hasAnalysis) {
  if (!hasAnalysis) return "Run an analysis to see tone, framing, and omissions.";
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
    `No strong bias signal repeated consistently across ${customDrivers.slice(0, 3).join(", ").toLowerCase()}.`,
    "Visible signals stayed below the threshold required for a meaningful bias flag.",
    "This result reflects the current text only and is not a guarantee that every relevant context is present."
  ];
}

function neutralSummaryText(result) {
  const drivers = Array.isArray(result?.drivers)
    ? result.drivers.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!drivers.length) return NEUTRAL_SUMMARY_TEMPLATE;

  return `This read stayed below the threshold for a meaningful bias flag. The review did not find a repeated bias signal across ${drivers.slice(0, 3).join(", ").toLowerCase()}, so the article can be read without a strong directional warning from NeutralEye.`;
}

function formatConfidenceScore(value) {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return "--";
  return confidence.toFixed(2);
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
  const { remaining, limited, ready: limitReady, increment } = useAnalysisLimit();
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

  const canAnalyze = useMemo(() => {
    if (loading) return false;
    if (limited) return false;
    if (mode === "url") return Boolean(url.trim());
    return text.trim().length >= 200;
  }, [mode, text, url, loading, limited]);

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
    if (limited) {
      setErrorState({ title: "Daily limit reached", message: "You've used all 10 free analyses for today. Come back tomorrow or upgrade to Pro for unlimited access." });
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

      saveAnalysis(response, user);
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
        message = "Failed to check bias. Please try again later.";
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
        message = "Failed to check bias. Please try again later.";
      }

      if (code === "NETWORK_ERROR") {
        title = "Analysis unavailable";
        message = "Failed to check bias. Please try again later.";
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
  }, [mode, text, url, limited, increment]);

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
          subtitle="Paste article text or a URL to check how tone, framing, and omission may be influencing the reader."
        />

        {limitReady && limited && (
          <div className={styles.limitBanner}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            You've used all 10 free analyses for today.{" "}
            <Link href="/pricing" className={styles.limitLink}>Upgrade to Pro</Link>
            {" "}for unlimited access.
          </div>
        )}
        {limitReady && !limited && remaining <= 3 && (
          <div className={styles.limitChip}>
            {remaining} {remaining === 1 ? "analysis" : "analyses"} remaining today
          </div>
        )}

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
              canAnalyze={canAnalyze}
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
            <section className={`${styles.outputCard} ${styles.resultHero}`}>
              <div className={styles.sectionHeader}>
                <span>Analysis Result</span>
              </div>
              <div className={styles.biasRow}>
                <strong>{resultTitle(result, hasAnalysis)}</strong>
              </div>
              <p className={styles.helperText}>{resultHelperText(result, hasAnalysis)}</p>
            </section>

            <section className={styles.outputCard}>
              <div className={styles.sectionHeader}>
                <span>Summary of Bias</span>
              </div>
              <p className={`${styles.bodyText} ${!hasAnalysis ? styles.placeholderText : ""}`}>
                {summaryText(result, hasAnalysis)}
              </p>
            </section>

            {hasAnalysis && isNoBiasResult(result) ? (
              <section className={styles.outputCard}>
                <div className={styles.sectionHeader}>
                  <span>Why this was judged low-bias</span>
                </div>
                <ul className={styles.simpleList}>
                  {neutralNoteItems(result).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className={styles.outputCard}>
              <div className={styles.sectionHeader}>
                <span>Examples of Bias</span>
              </div>
              {result.examples.length ? (
                <ul className={styles.simpleList}>
                  {result.examples.map((example, index) => (
                    <li key={`${example.quote}-${index}`}>{example.quote}</li>
                  ))}
                </ul>
              ) : (
                <p className={`${styles.bodyText} ${styles.placeholderText}`}>
                  {hasAnalysis && isNoBiasResult(result)
                    ? "No strong language or framing examples crossed the threshold for a meaningful bias flag in this pass."
                    : "Quoted language and framing examples will appear here."}
                </p>
              )}
            </section>

            <section className={styles.outputCard}>
              <div className={styles.sectionHeader}>
                <span>Suggested Unbiased Sources</span>
              </div>
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
                <ul className={styles.simpleList}>
                  <li className={styles.placeholderText}>
                    {hasAnalysis && isNoBiasResult(result)
                      ? "No specific comparison sources were required to clarify a strong directional pattern. A second source may still be useful for high-stakes topics."
                      : "Suggested sources will appear here when the analysis has comparison ideas."}
                  </li>
                </ul>
              )}
            </section>

            <section className={styles.outputCard}>
              <div className={styles.sectionHeader}>
                <span>Recommendations</span>
              </div>
              {result.recommendations.length ? (
                <ul className={styles.simpleList}>
                  {result.recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className={`${styles.bodyText} ${styles.placeholderText}`}>
                  {hasAnalysis && isNoBiasResult(result)
                    ? "No urgent follow-up steps were generated. For consequential topics, compare with one additional source and continue reading with normal judgment."
                    : "Useful next reading steps will appear here."}
                </p>
              )}
            </section>

            <section className={styles.outputCard}>
              <div className={styles.sectionHeader}>
                <span>Analysis Confidence</span>
              </div>
              <div className={styles.confidenceScore}>
                <strong>{hasAnalysis ? formatConfidenceScore(result.confidence) : "--"}</strong>
                {!hasAnalysis ? (
                  <p>
                    Confidence reflects how consistently the analysis signals appear across tone, framing, sourcing,
                    and omission. It is not a claim of factual certainty.
                  </p>
                ) : null}
              </div>
            </section>
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

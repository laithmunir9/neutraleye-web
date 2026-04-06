"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import InputPanel from "@/components/InputPanel/InputPanel";
import ResultsHeader from "@/components/ResultsHeader/ResultsHeader";
import ResultCard from "@/components/ResultCard/ResultCard";
import QuoteEvidence from "@/components/QuoteEvidence/QuoteEvidence";
import { analyzeText, analyzeUrl, ApiError } from "@/lib/api";
import { getAnalysis, saveAnalysis } from "@/lib/storage";
import styles from "./page.module.css";

const STAGES = ["Reading...", "Checking framing...", "Reviewing tone...", "Writing analysis..."];
const SETTINGS_KEY = "neutraleye.settings.v1";

const DEFAULT_RESULT = {
  id: "",
  createdAt: "",
  inputType: "text",
  direction: "Neutral",
  directionLabel: "Neutral",
  confidence: 0.5,
  score: 0,
  summary: "Run an analysis to see how the article's tone, framing, and omissions may shape the story.",
  drivers: ["Loaded wording", "Framing", "Source imbalance", "Attribution gaps"],
  examples: [],
  sources: [],
  recommendations: []
};

function sourcesToText(sources) {
  return (sources || [])
    .map((item) => (typeof item === "string" ? item : `${item.name || "Source"}${item.url ? ` (${item.url})` : ""}`))
    .join("\n");
}

function AnalyzePageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(DEFAULT_RESULT);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(STAGES[0]);
  const [errorState, setErrorState] = useState(null);
  const [copied, setCopied] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState("Extraction status: idle");
  const [extractedPreview, setExtractedPreview] = useState("");
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const saved = getAnalysis(id);
    if (saved) {
      setResult(saved);
      setMode(saved.inputType || "text");
      setUrl(saved.url || "");
      setErrorState(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const settings = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") || {};
      setShowDiagnostics(settings.showDiagnostics !== false);
      setReduceMotion(Boolean(settings.reduceMotion));
    } catch {
      setShowDiagnostics(true);
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
    if (mode === "url") return /^https?:\/\//i.test(url.trim());
    return text.trim().length >= 200;
  }, [mode, text, url, loading]);

  async function handleAnalyze() {
    setErrorState(null);
    setCopied(false);
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
        response = await analyzeUrl(url.trim());
        if (response.extractedText) {
          setExtractedPreview(response.extractedText);
          setExtractionStatus("Extraction status: extracted and analyzed");
        } else {
          setExtractionStatus("Extraction status: analyzed from backend pipeline");
        }
      } else {
        response = await analyzeText(text.trim());
      }

      saveAnalysis(response);
      setResult(response);
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
      const baseMessage = String(analysisError?.message || "Failed to analyze.");
      const status = isApiError ? analysisError.status : 0;
      const details = isApiError ? analysisError.details : "";
      const code = isApiError ? analysisError.code : "";
      let message = details ? `${baseMessage} ${details}` : baseMessage;
      let title = mode === "url" ? "URL analysis failed" : "Text analysis failed";
      let suggestions = mode === "url"
        ? ["Try Paste Text mode with article body text.", "Try another URL (non-paywalled article)."]
        : ["Reduce text length and retry.", "Refresh and run analysis again."];

      if (status === 429) {
        title = "Rate limit exceeded";
        message = "Too many requests. Please wait a minute and try again.";
        suggestions = ["Wait 60 seconds and retry.", "Send fewer requests per minute."];
      }

      if (status === 503 || code === "AI_DISABLED") {
        title = "Analysis unavailable";
        message = "Analysis is temporarily unavailable.";
        suggestions = ["Try again later."];
      }

      if (code === "VALIDATION_ERROR") {
        title = mode === "url" ? "Check the URL" : "Check the article text";
        suggestions = mode === "url"
          ? ["Use a full article URL starting with http:// or https://.", "If extraction keeps failing, use Paste Text mode."]
          : ["Paste more article text before retrying.", "Use article body content instead of a short snippet."];
      }

      if (code === "ARTICLE_VALIDATION_FAILED") {
        title = "Article text required";
        message = "NeutralEye could not confirm that this content is a readable article.";
        suggestions = ["Paste a full article body.", "Use a direct article URL instead of a homepage or feed."];
      }

      if (code === "URL_FETCH_TIMEOUT") {
        title = "URL fetch timed out";
        message = "The article took too long to load for analysis.";
        suggestions = ["Retry in a moment.", "Try another direct article URL or paste the text manually."];
      }

      if (code === "URL_FETCH_FAILED" || code === "URL_EXTRACTION_ERROR") {
        title = "Article could not be retrieved";
        message = "NeutralEye could not fetch readable content from that URL.";
        suggestions = ["Try a public non-paywalled article URL.", "Use Paste Text mode if the page blocks extraction."];
      }

      if (code === "URL_EXTRACTION_TOO_SHORT") {
        title = "Not enough article text";
        message = "NeutralEye found the page, but not enough readable article text to analyze.";
        suggestions = ["Open the full article page and retry.", "Use Paste Text mode with the article body."];
      }

      if (code === "TIMEOUT") {
        title = "Analysis timed out";
        message = "The analysis service took too long to respond.";
        suggestions = ["Retry in a moment.", "Try a shorter article or another URL."];
      }

      if (code === "NETWORK_ERROR") {
        title = "Service connection failed";
        message = "NeutralEye could not reach the analysis backend.";
        suggestions = ["Confirm the website backend is running.", "Check NEXT_PUBLIC_NEUTRALEYE_API_URL and retry."];
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
        status,
        code,
        endpoint: analysisError?.endpoint || "",
        details,
        requestId: analysisError?.requestId || "",
        suggestions
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const payload = [
      `Direction: ${result.direction}`,
      `Score: ${result.score.toFixed(2)}`,
      `Confidence: ${Math.round(result.confidence * 100)}%`,
      "",
      "Summary",
      result.summary,
      "",
      "Examples",
      result.examples.map((item) => `- ${item.label}: ${item.quote}`).join("\n") || "- None",
      "",
      "Sources",
      sourcesToText(result.sources) || "- None",
      "",
      "Recommendations",
      (result.recommendations || []).map((item) => `- ${item}`).join("\n") || "- None"
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setErrorState({
        title: "Copy failed",
        message: "Try again.",
        status: 0,
        requestId: "",
        suggestions: []
      });
    }
  }

  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Analyze An Article"
          subtitle="Paste article text or a URL to check how tone, framing, and omission may be influencing the reader."
        />

        <section className={styles.grid}>
          <InputPanel
            mode={mode}
            onModeChange={setMode}
            text={text}
            url={url}
            onTextChange={setText}
            onUrlChange={setUrl}
            onAnalyze={handleAnalyze}
            onCopy={handleCopy}
            canAnalyze={canAnalyze}
            loading={loading}
            loadingStage={loadingStage}
            extractionStatus={extractionStatus}
            extractedPreview={extractedPreview}
            errorState={errorState}
            copied={copied}
            requestMeta={showDiagnostics ? result.requestMeta : null}
          />

          <ResultsHeader
            direction={result.directionLabel || result.direction}
            score={result.score}
            confidence={result.confidence}
            drivers={result.drivers}
          />

          <ResultCard title="Summary">
            <p className={styles.paragraph}>{result.summary}</p>
          </ResultCard>

          <ResultCard title="Examples Of Bias">
            <div className={styles.examples}>
              {result.examples.length ? (
                result.examples.map((example, index) => (
                  <QuoteEvidence
                    key={`${example.quote}-${index}`}
                    quote={example.quote}
                    label={example.label}
                    explanation={example.explanation}
                    highlight={example.highlights}
                  />
                ))
              ) : (
                <p className={styles.muted}>Run an analysis to see quoted language and framing examples.</p>
              )}
            </div>
          </ResultCard>

          <ResultCard title="Suggested Sources">
            {result.sources.length ? (
              <ul className={styles.list}>
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
              <p className={styles.muted}>Suggested sources will appear here when the analysis has comparison ideas.</p>
            )}
          </ResultCard>

          <ResultCard title="Recommendations">
            {result.recommendations.length ? (
              <ul className={styles.list}>
                {result.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Recommendations will appear here when NeutralEye finds useful next reading steps.</p>
            )}
          </ResultCard>
        </section>

        <aside className={styles.note}>
          Confidence reflects how consistent the signals are in the writing, not whether the article is objectively
          true. <Link href="/methodology">Read the full methodology</Link>.
        </aside>
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

"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeText, ApiError } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import { resolveAnalysis } from "@/lib/supabase/analyses";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useAnalysisLimit } from "@/lib/supabase/useAnalysisLimit";
import ReadResult from "./ReadResult";
import styles from "./Workbench.module.css";

const STAGES = ["Reading", "Checking framing", "Reviewing tone", "Writing analysis"];
/** Below this there is not enough article to read. */
const MIN_TEXT_CHARS = 200;
/* The settings page is gone, but a reader who turned history saving off there
   still has that preference stored, so it keeps being honoured. */
const SETTINGS_KEY = "neutraleye.settings.v1";
const UNREADABLE_TEXT_TITLE = "Could not analyze this text";
const UNREADABLE_TEXT_MESSAGE = "Please paste a real article body and try again.";
const UNAVAILABLE_MESSAGE = "Failed to analyze framing. Please try again later.";
const EXAMPLE_TEXT =
  "The article frames one side as reckless and dangerous, quotes only sympathetic experts, and leaves out the strongest objections that would challenge its main thesis. It repeatedly describes one group as responsible while portraying the opposing view as chaotic and unserious. The piece includes supportive quotes from aligned analysts but gives little space to counterarguments or competing evidence. Readers are guided toward a single interpretation through selective emphasis and emotionally weighted wording.";

function isHistorySavingEnabled() {
  if (typeof window === "undefined") return true;
  try {
    const settings = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") || {};
    return settings.saveHistory !== false;
  } catch {
    return true;
  }
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

function errorFor(analysisError) {
  const isApiError = analysisError instanceof ApiError;
  const status = isApiError ? analysisError.status : 0;
  const code = isApiError ? analysisError.code : "";
  const details = isApiError ? analysisError.details : "";
  const base = String(analysisError?.message || "Failed to analyze.").trim();

  if (code === "DAILY_LIMIT_REACHED") {
    return { title: "Daily limit reached", message: base };
  }
  // Only the route's own limiter means "slow down". Any other 429 is upstream
  // (the model provider out of quota, say), which the reader cannot fix by
  // waiting a minute.
  if (code === "RATE_LIMITED") {
    return { title: "Rate limit exceeded", message: "Too many requests. Please wait a minute and try again." };
  }
  if (status === 429) {
    return { title: "Analysis unavailable", message: UNAVAILABLE_MESSAGE };
  }
  if (code === "ARTICLE_VALIDATION_FAILED") {
    return { title: UNREADABLE_TEXT_TITLE, message: UNREADABLE_TEXT_MESSAGE };
  }
  if (code === "VALIDATION_ERROR") {
    return { title: "Check the article text", message: UNREADABLE_TEXT_MESSAGE };
  }
  if (code === "TIMEOUT") {
    return { title: "Analysis timed out", message: UNAVAILABLE_MESSAGE };
  }
  if (status === 503 || code === "AI_DISABLED" || code === "NETWORK_ERROR") {
    return { title: "Analysis unavailable", message: UNAVAILABLE_MESSAGE };
  }
  return { title: "Text analysis failed", message: details ? `${base} ${details}` : base };
}

function countLabel(chars) {
  if (!chars) return `Paste at least ${MIN_TEXT_CHARS} characters`;
  if (chars < MIN_TEXT_CHARS) return `${chars} of ${MIN_TEXT_CHARS} characters`;
  return `${chars.toLocaleString("en-US")} characters`;
}

export default function ReadMode({ savedId = null }) {
  const { user } = useAuth();
  const { increment } = useAnalysisLimit();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [editing, setEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [errorState, setErrorState] = useState(null);
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  // Old /analyze?id= links redirect here with the query intact; load the saved
  // result the way /analyze did.
  useEffect(() => {
    if (!savedId) return;
    resolveAnalysis(savedId, user).then((saved) => {
      if (!saved) return;
      setResult(saved);
      setEditing(false);
      setErrorState(null);
    });
  }, [savedId, user]);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = window.setInterval(() => {
      setStageIndex((index) => (index + 1) % STAGES.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function runAnalysis(source) {
    const body = source.trim();
    // Pressing the button without usable input answers the question rather
    // than doing nothing. The button is live in every state.
    if (body.length < MIN_TEXT_CHARS) {
      setErrorState({
        title: body.length ? "That is not enough of the article yet" : "Paste the article text",
        message: `Paste at least ${MIN_TEXT_CHARS} characters of the article body${
          body.length ? `, ${MIN_TEXT_CHARS - body.length} more to go` : ""
        }. Or try the example to see a finished read first.`
      });
      textareaRef.current?.focus();
      return;
    }

    const qualityError = getTextQualityError(body);
    if (qualityError) {
      setErrorState({ title: UNREADABLE_TEXT_TITLE, message: UNREADABLE_TEXT_MESSAGE });
      return;
    }

    setErrorState(null);
    setStageIndex(0);
    setLoading(true);
    try {
      const response = await analyzeText(body);
      if (isHistorySavingEnabled()) saveAnalysis(response, user);
      increment();
      setResult(response);
      setEditing(false);
      window.requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: false }));
    } catch (analysisError) {
      setErrorState(errorFor(analysisError));
    } finally {
      setLoading(false);
    }
  }

  function handleExample() {
    setText(EXAMPLE_TEXT);
    runAnalysis(EXAMPLE_TEXT);
  }

  function handleEdit() {
    setEditing(true);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleStartOver() {
    setText("");
    setResult(null);
    setEditing(true);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const chars = text.trim().length;
  const collapsed = result && !editing;

  return (
    <>
      <div className={styles.inputBlock}>
        {collapsed ? (
          <div className={`${styles.frame} ${styles.collapsed}`}>
            <p className={styles.excerpt}>{text.trim() || "Saved analysis"}</p>
            <button type="button" className={styles.quiet} onClick={text.trim() ? handleEdit : handleStartOver}>
              {text.trim() ? "Edit text" : "Analyze new text"}
            </button>
          </div>
        ) : (
          <>
            <div className={`${styles.frame} ${loading ? styles.busy : ""}`}>
              <label htmlFor="read-text" className={styles.srOnly}>
                Article text
              </label>
              <textarea
                id="read-text"
                ref={textareaRef}
                className={styles.textarea}
                value={text}
                placeholder="Paste the article text here"
                spellCheck={false}
                readOnly={loading}
                aria-invalid={Boolean(errorState)}
                aria-describedby="read-status"
                onChange={(event) => {
                  setText(event.target.value);
                  if (errorState) setErrorState(null);
                }}
              />
            </div>

            {errorState ? (
              <div className={styles.error} role="alert">
                <strong>{errorState.title}</strong>
                <p>{errorState.message}</p>
              </div>
            ) : null}

            <div className={styles.actions}>
              <p id="read-status" className={styles.status} aria-live="polite">
                {loading ? `${STAGES[stageIndex]}…` : countLabel(chars)}
              </p>
              <div className={styles.buttons}>
                {!text.trim() && !loading ? (
                  <button type="button" className={styles.quiet} onClick={handleExample}>
                    Try an example
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.primary}
                  disabled={loading}
                  onClick={() => runAnalysis(text)}
                >
                  {loading ? "Analyzing" : "Analyze framing"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {result ? (
        <div ref={resultRef} tabIndex={-1} className={styles.resultWrap}>
          <ReadResult result={result} />
        </div>
      ) : null}
    </>
  );
}

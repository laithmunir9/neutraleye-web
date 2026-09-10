import styles from "./InputPanel.module.css";

const MIN_CHARS = 200;

export default function InputPanel({
  mode,
  onModeChange,
  text,
  url,
  onTextChange,
  onUrlChange,
  onAnalyze,
  onExample,
  loading,
  loadingStage,
  extractedPreview,
  errorState,
  analysisComplete = false
}) {
  const activeText = mode === "text" ? text : extractedPreview || url;
  const chars = activeText.length;
  const words = activeText.trim() ? activeText.trim().split(/\s+/).length : 0;
  const remaining = Math.max(0, MIN_CHARS - chars);
  const trimmedUrl = url.trim();
  const hasUrl = Boolean(trimmedUrl);
  const validUrl = /^https?:\/\//i.test(trimmedUrl);
  const textReadinessLabel = remaining > 0 ? `Minimum ${MIN_CHARS} chars` : "Ready to analyze";
  const urlReadinessLabel = extractedPreview
    ? "Article text ready"
    : validUrl
      ? "Ready to fetch"
      : "Invalid URL";
  const readinessLabel = analysisComplete ? "Analyzed!" : mode === "url" ? urlReadinessLabel : textReadinessLabel;
  /* The button names the action it performs, in every state. It used to carry an
     instruction ("Enter Article Text") while disabled, which made the highest
     contrast control on the page a dead end for exactly the person who had not
     worked out what to do yet. It stays live now, and pressing it without usable
     input answers the question instead of ignoring the press. */
  const analyzeLabel = loading ? "Analyzing" : mode === "url" ? "Fetch and analyze" : "Analyze";

  return (
    <section className={`${styles.panel} ${loading ? styles.isAnalyzing : ""}`} aria-busy={loading}>
      <div className={styles.panelHeader}>
        <div>
          <span>Analyzer</span>
          <strong>Article input</strong>
        </div>
        <span className={`${styles.panelStatus} ${loading ? styles.panelStatusActive : ""}`}>
          {loading ? loadingStage : readinessLabel}
        </span>
      </div>

      <div className={styles.tabs}>
        <button
          className={mode === "text" ? styles.active : ""}
          onClick={() => onModeChange("text")}
          type="button"
          aria-pressed={mode === "text"}
        >
          Paste Text
        </button>
        <button
          className={mode === "url" ? styles.active : ""}
          onClick={() => onModeChange("url")}
          type="button"
          aria-pressed={mode === "url"}
        >
          Paste URL
        </button>
      </div>

      {mode === "text" ? (
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Paste article text for analysis"
        />
      ) : (
        <>
          <input
            className={styles.input}
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://example.com/news/article"
          />
          {extractedPreview ? (
            <details className={styles.preview}>
              <summary>Preview extracted text</summary>
              <p>{extractedPreview}</p>
            </details>
          ) : null}
        </>
      )}

      <div className={styles.metrics}>
        <span>{words} words</span>
        <span>{chars} chars</span>
      </div>

      {loading ? (
        <div className={styles.loading} aria-live="polite">
          <div className={styles.loadingHeader}>
            <strong>Analysis in progress</strong>
            <span>{loadingStage}</span>
          </div>
          <div className={styles.loadingRail} aria-hidden>
            <span />
          </div>
          <div className={styles.loadingGrid} aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}
      {errorState ? (
        <div className={styles.error} role="alert">
          <strong>{errorState.title || "Request failed"}</strong>
          <p>{errorState.message || "Analysis failed."}</p>
          {errorState.detail ? <p className={styles.errorDetail}>{errorState.detail}</p> : null}
        </div>
      ) : null}

      <div className={styles.actions}>
        <button
          className={styles.primary}
          type="button"
          disabled={loading}
          onClick={onAnalyze}
        >
          {analyzeLabel}
        </button>
        <button className={styles.secondary} type="button" disabled={loading} onClick={onExample}>
          Try Example
        </button>
      </div>
    </section>
  );
}

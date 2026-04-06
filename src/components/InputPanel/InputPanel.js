import styles from "./InputPanel.module.css";

const MIN_CHARS = 200;

function formatErrorDetail(details) {
  const value = String(details || "").trim();
  if (!value) return "";

  const retryAfterMatch = value.match(/retry_after_seconds=(\d+)/i);
  if (retryAfterMatch) return `Retry after ${retryAfterMatch[1]} seconds.`;

  const minimumCharsMatch = value.match(/minimum_characters=(\d+)/i);
  if (minimumCharsMatch) return `Minimum readable text required: ${minimumCharsMatch[1]} characters.`;

  const upstreamStatusMatch = value.match(/^status=(.+)$/i);
  if (upstreamStatusMatch) return `Upstream fetch status: ${upstreamStatusMatch[1]}.`;

  return value;
}

export default function InputPanel({
  mode,
  onModeChange,
  text,
  url,
  onTextChange,
  onUrlChange,
  onAnalyze,
  onCopy,
  canAnalyze,
  loading,
  loadingStage,
  extractionStatus,
  extractedPreview,
  errorState,
  copied,
  requestMeta
}) {
  const activeText = mode === "text" ? text : extractedPreview || "";
  const chars = activeText.length;
  const words = activeText.trim() ? activeText.trim().split(/\s+/).length : 0;
  const remaining = Math.max(0, MIN_CHARS - chars);
  const friendlyDetail = formatErrorDetail(errorState?.details);

  return (
    <section className={styles.panel}>
      <div className={styles.tabs}>
        <button className={mode === "text" ? styles.active : ""} onClick={() => onModeChange("text")} type="button">
          Paste Text
        </button>
        <button className={mode === "url" ? styles.active : ""} onClick={() => onModeChange("url")} type="button">
          Paste URL
        </button>
      </div>

      {mode === "text" ? (
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Paste article text for analysis..."
        />
      ) : (
        <>
          <input
            className={styles.input}
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://example.com/news/article"
          />
          <div className={styles.status}>{extractionStatus || "Extraction status: idle"}</div>
          {extractedPreview ? (
            <details className={styles.preview}>
              <summary>Preview extracted text</summary>
              <p>{extractedPreview.slice(0, 1200)}</p>
            </details>
          ) : null}
        </>
      )}

      <div className={styles.metrics}>
        <span>{words} words</span>
        <span>{chars} chars</span>
        <span>{remaining > 0 ? `Minimum ${MIN_CHARS} chars (${remaining} remaining)` : "Minimum reached"}</span>
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
          <div className={styles.errorMetaRow}>
            {errorState.status ? <p className={styles.errorMeta}>Status: {errorState.status}</p> : null}
            {errorState.code ? <p className={styles.errorMeta}>Code: {errorState.code}</p> : null}
            {errorState.endpoint ? <p className={styles.errorMeta}>Endpoint: {errorState.endpoint}</p> : null}
            {errorState.requestId ? <p className={styles.errorMeta}>Request ID: {errorState.requestId}</p> : null}
          </div>
          {friendlyDetail ? <p className={styles.errorDetails}>{friendlyDetail}</p> : null}
          {errorState.suggestions?.length ? (
            <ul className={styles.suggestions}>
              {errorState.suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {requestMeta?.requestCompletedAt ? (
        <div className={styles.requestMeta}>
          <span>Last response: {new Date(requestMeta.requestCompletedAt).toLocaleTimeString()}</span>
          <span>Status {requestMeta.status || 200}</span>
          {requestMeta.requestId ? <span>Req {requestMeta.requestId}</span> : null}
        </div>
      ) : null}

      <div className={styles.actions}>
        <button className={styles.primary} type="button" disabled={!canAnalyze || loading} onClick={onAnalyze}>
          {mode === "url" ? "Fetch & Analyze" : "Analyze"}
        </button>
        <button className={styles.secondary} type="button" disabled={loading} onClick={onCopy}>
          {copied ? "Copied" : "Copy result"}
        </button>
      </div>
    </section>
  );
}

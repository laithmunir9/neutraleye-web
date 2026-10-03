import QuoteEvidence from "@/components/QuoteEvidence/QuoteEvidence";
import { isNoBiasRecord, NO_BIAS_LABEL } from "@/lib/biasLevel";
import styles from "./Workbench.module.css";

/* Moved from the retired /analyze page. The copy and the no-framing handling are
   unchanged; only the layout moved into the single homepage column. */

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
  analysis: "Analysis or commentary"
};

// Keyed off the model's enum in requestMeta; the display label is a fallback for
// pre-rename records only. Never match on display copy.
const isNoBiasResult = (result) => isNoBiasRecord(result);

function cleanDrivers(result) {
  return Array.isArray(result?.drivers)
    ? result.drivers.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

/*
 * The direction template in src/lib/analysis.js asks the model for
 * "toward <entity>" / "against <entity>", and the model sometimes returns the
 * placeholder unsubstituted. That string is the largest text on the result, so
 * strip any angle-bracket placeholder rather than print it; the framing level
 * on its own is still true.
 */
function stripPlaceholders(value) {
  return String(value || "")
    .replace(/\s*(?:toward|towards|against)?\s*<[^>]*>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function resultTitle(result) {
  if (isNoBiasResult(result)) return `${NO_BIAS_LABEL}.`;
  return stripPlaceholders(result.directionLabel || result.direction) || "Framing signal found";
}

function resultHelperText(result) {
  if (isNoBiasResult(result)) return "Please feel free to continue reading.";
  return "Overall finding based on the article's tone, framing, sourcing, and attribution.";
}

function neutralSummaryText(result) {
  const drivers = cleanDrivers(result);
  if (!drivers.length) return NEUTRAL_SUMMARY_TEMPLATE;
  return `This read stayed below the threshold for a meaningful framing flag. The review did not find a repeated framing signal across ${drivers.slice(0, 3).join(", ").toLowerCase()}, so the article can be read without a strong directional warning from NeutralEye.`;
}

function neutralNoteItems(result) {
  const drivers = cleanDrivers(result);
  if (!drivers.length) return NEUTRAL_NOTE_ITEMS;
  return [
    `No strong framing signal repeated consistently across ${drivers.slice(0, 3).join(", ").toLowerCase()}.`,
    NEUTRAL_NOTE_ITEMS[1],
    NEUTRAL_NOTE_ITEMS[2]
  ];
}

function confidenceLevel(value) {
  const pct = Math.round((Number(value) || 0) * 100);
  if (pct >= 80) return "High";
  if (pct >= 60) return "Moderate to high";
  if (pct >= 40) return "Moderate";
  if (pct >= 20) return "Low to moderate";
  return "Low";
}

function sourceKey(source, index) {
  return `${index}-${typeof source === "string" ? source : source?.url || source?.name}`;
}

export default function ReadResult({ result }) {
  const noFraming = isNoBiasResult(result);
  const contentType = CONTENT_TYPE_LABELS[result?.contentType] || "";
  const drivers = noFraming ? [] : cleanDrivers(result);
  const examples = result.examples || [];
  const sources = result.sources || [];
  const recommendations = result.recommendations || [];

  return (
    <article className={styles.result} aria-label="Framing analysis">
      <header className={styles.resultHead}>
        <p className={styles.finding}>{resultTitle(result)}</p>
        <p className={styles.helper}>
          {contentType ? <span className={styles.contentType}>{contentType}</span> : null}
          {resultHelperText(result)}
        </p>
      </header>

      <p className={styles.summary}>
        {noFraming ? neutralSummaryText(result) : result.summary || "No summary returned."}
      </p>

      {drivers.length ? (
        <ul className={styles.signals} aria-label="Signals">
          {drivers.map((driver) => (
            <li key={driver}>{driver}</li>
          ))}
        </ul>
      ) : null}

      {examples.length ? (
        <section className={styles.evidence}>
          <h2 className={styles.blockHeading}>
            {examples.length === 1 ? "1 marked passage" : `${examples.length} marked passages`}
          </h2>
          {examples.map((example, index) => (
            <QuoteEvidence
              key={`${example.quote}-${index}`}
              quote={example.quote}
              label={example.label}
              explanation={example.explanation}
              highlight={example.highlights || []}
              sweep
              index={index}
            />
          ))}
        </section>
      ) : (
        <p className={styles.muted}>
          {noFraming
            ? "No passage crossed the threshold for a meaningful framing flag in this pass."
            : "No individual passage was marked in this pass."}
        </p>
      )}

      <div className={styles.more}>
        {noFraming ? (
          <details>
            <summary>Why nothing was flagged</summary>
            <ul>
              {neutralNoteItems(result).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        ) : null}

        <details>
          <summary>Other coverage of this story</summary>
          {sources.length ? (
            <ul>
              {sources.map((source, index) => (
                <li key={sourceKey(source, index)}>
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
            <p>No comparison sources were suggested for this read.</p>
          )}
        </details>

        <details>
          <summary>What to read next</summary>
          {recommendations.length ? (
            <ul>
              {recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No follow-up steps were generated for this read.</p>
          )}
        </details>

        <details>
          <summary>How confident this read is</summary>
          {noFraming ? (
            <p>
              Confidence is only reported when there is a framing pattern to measure. This read did
              not find one.
            </p>
          ) : (
            <p>
              {confidenceLevel(result.confidence)}. Confidence reflects how consistently the signals
              appear across tone, framing, sourcing and omission. It is not a claim of factual
              certainty.
            </p>
          )}
        </details>
      </div>
    </article>
  );
}

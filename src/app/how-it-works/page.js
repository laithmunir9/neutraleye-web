import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import styles from "../overview/page.module.css";

const heroInputs = ["Article text", "Source mix", "Framing", "Attribution"];
const heroOutputs = ["Summary", "Examples", "Confidence", "Next reads"];
const heroRailY = [193, 238, 282, 327];

const pipelineSteps = [
  {
    number: "01",
    title: "Submit",
    body: "Paste article text or provide a URL. NeutralEye accepts both — URL submissions extract the article body automatically.",
  },
  {
    number: "02",
    title: "Validate",
    body: "The system confirms the material is article-like. Short passages, navigation text, and blocked pages are flagged before analysis starts.",
  },
  {
    number: "03",
    title: "Analyze",
    body: "Tone, framing, attribution, source balance, and omission are reviewed together in one pass — not as five independent checks.",
  },
  {
    number: "04",
    title: "Score",
    body: "A confidence score is calibrated against how consistently signals appeared. Articles where all five checks point the same way score higher than those with mixed or thin evidence.",
  },
  {
    number: "05",
    title: "Return",
    body: "The result comes back with a direction label, confidence score, quoted evidence, and sources to read alongside — everything needed to check the reasoning yourself.",
  },
];

const principleCards = [
  {
    title: "One pipeline",
    body: "Article intake, content extraction, signal review, and evidence packaging run as a single sequence — not independent steps stitched together.",
  },
  {
    title: "Structured output",
    body: "Every result uses the same schema: direction, confidence, summary, examples, sources, and recommendations — making results comparable across runs.",
  },
  {
    title: "No black box",
    body: "The system returns what it found and where. Quoted language and sourcing patterns are included so the output can be checked against the original text.",
  },
];

function FeatureVisual({ visual }) {
  if (visual === "pipeline") {
    return (
      <div className={styles.visualShell}>
        <div className={styles.pipelineCard}>
          <div className={styles.pipelineHeader}>System flow</div>
          <div className={styles.pipelineRow}>
            <span className={styles.pipelineDot} />
            <div className={styles.pipelineBar}>Readable article material confirmed</div>
          </div>
          <div className={styles.pipelineRow}>
            <span className={styles.pipelineDot} />
            <div className={styles.pipelineDetail}>
              <strong>Signal families checked together</strong>
              <p>Framing, source balance, attribution, and omission reviewed in one pass.</p>
            </div>
          </div>
          <div className={styles.pipelineRow}>
            <span className={styles.pipelineDot} />
            <div className={styles.pipelineDetail}>
              <strong>Structured result assembled</strong>
              <p>Summary, examples, confidence, and next-reading context stay attached.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (visual === "confidence") {
    const signals = [
      { name: "Framing",     width: "82%", label: "High" },
      { name: "Language",    width: "61%", label: "Moderate" },
      { name: "Attribution", width: "38%", label: "Low" },
    ];
    return (
      <div className={styles.visualShell}>
        <div className={styles.confidenceCard}>
          <div className={styles.resultChrome}>
            <span /><span /><span />
          </div>
          <div className={styles.confReport}>
            <div className={styles.confHeaderLabel}>Confidence report</div>
            <div className={styles.confDirectionBlock}>
              <span className={styles.confDirectionKey}>Direction</span>
              <span className={styles.confDirectionVal}>Moderate bias — toward government sources</span>
            </div>
            <div className={styles.confScoreBlock}>
              <div className={styles.confScoreRow}>
                <span className={styles.confScoreLabel}>Analysis confidence</span>
                <span className={styles.confScoreNum}>0.74</span>
              </div>
              <div className={styles.confBar}>
                <div className={styles.confBarFill} style={{ width: "74%" }} />
              </div>
            </div>
            <div className={styles.confSignals}>
              <div className={styles.confSignalsTitle}>Signal strengths</div>
              {signals.map((s) => (
                <div key={s.name} className={styles.confSignalRow}>
                  <span className={styles.confSignalName}>{s.name}</span>
                  <div className={styles.confSignalBar}>
                    <div className={styles.confSignalFill} style={{ width: s.width }} />
                  </div>
                  <span className={styles.confSignalVal}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.visualShell}>
      <div className={styles.resultCard}>
        <div className={styles.resultChrome}>
          <span /><span /><span />
        </div>
        <div className={styles.resultHead}>
          <div>
            <strong>Structured result</strong>
            <p>Readable explanation with evidence attached.</p>
          </div>
          <span className={styles.approvalPill}>Inspectable</span>
        </div>
        <div className={styles.resultChecklist}>
          <div className={styles.checkRow}>
            <span className={styles.checkMark}>+</span>
            <span>Summary grounded in article text</span>
            <span className={styles.countPill}>1</span>
          </div>
          <div className={styles.checkRow}>
            <span className={styles.checkMark}>+</span>
            <span>Quoted evidence linked</span>
            <span className={styles.countPill}>2</span>
          </div>
          <div className={styles.checkRow}>
            <span className={styles.checkMark}>+</span>
            <span>Next-read suggestions included</span>
            <span className={styles.countPill}>3</span>
          </div>
        </div>
        <div className={styles.citationBlock}>
          <span>Evidence packet</span>
          <div className={styles.citationItem}>1 Quoted phrase with explanation</div>
          <div className={styles.citationItem}>2 Source balance note</div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <MarketingShell darkHeader>
      <main className={styles.page}>

        {/* ── Dark hero ── */}
        <section className={styles.hero} data-header-theme="dark">
          <div className={styles.heroInner}>
            <svg className={styles.heroConnections} viewBox="0 0 1600 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <linearGradient id="hero-line-left-fade" x1="370" x2="790" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.13)" />
                  <stop offset="68%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient id="hero-line-right-fade" x1="810" x2="1230" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="32%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.13)" />
                </linearGradient>
              </defs>
              <path className={styles.heroConnectionLeft} d="M370 193 C500 192 590 238 740 270" />
              <path className={styles.heroConnectionLeft} d="M370 238 C500 237 610 260 750 278" />
              <path className={styles.heroConnectionLeft} d="M370 282 C520 282 625 282 760 282" />
              <path className={styles.heroConnectionLeft} d="M370 327 C505 327 600 302 750 290" />
              <path className={styles.heroConnectionRight} d="M1230 193 C1100 192 1010 238 860 270" />
              <path className={styles.heroConnectionRight} d="M1230 238 C1100 237 990 260 850 278" />
              <path className={styles.heroConnectionRight} d="M1230 282 C1080 282 975 282 840 282" />
              <path className={styles.heroConnectionRight} d="M1230 327 C1095 327 1000 302 850 290" />
              {heroInputs.map((item, i) => (
                <g key={item}>
                  <text className={styles.heroSvgLabel} x="345" y={heroRailY[i]} textAnchor="end" dominantBaseline="middle">{item}</text>
                  <circle className={styles.heroSvgNode} cx="370" cy={heroRailY[i]} r="5.5" />
                </g>
              ))}
              {heroOutputs.map((item, i) => (
                <g key={item}>
                  <circle className={styles.heroSvgNode} cx="1230" cy={heroRailY[i]} r="5.5" />
                  <text className={styles.heroSvgLabel} x="1255" y={heroRailY[i]} textAnchor="start" dominantBaseline="middle">{item}</text>
                </g>
              ))}
            </svg>
            <div className={styles.heroCopy}>
              <h1>How NeutralEye<br />Works</h1>
              <p className={styles.lead}>
                Article text goes in. A structured bias analysis — direction, evidence, confidence, and next reads — comes out.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.heroButton} href="/analyze">Open Analyzer</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pipeline steps ── */}
        <ScrollReveal>
          <section className={styles.stepsSection} aria-label="Pipeline steps">
            <div className={styles.stepsGrid}>
              {pipelineSteps.map((step) => (
                <div key={step.number} className={styles.step}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <strong className={styles.stepTitle}>{step.title}</strong>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── Principle cards ── */}
        <ScrollReveal>
          <section className={styles.principleRow} aria-label="System principles">
            {principleCards.map((item) => (
              <article key={item.title} className={styles.principleCard}>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </section>
        </ScrollReveal>

        {/* ── Feature row 1: processing ── */}
        <ScrollReveal>
          <section className={styles.featureSection}>
            <div className={styles.featureCopy}>
              <span className={styles.featureEyebrow}>Processing</span>
              <h2>One pass, five signals</h2>
              <p>Every article goes through tone, framing, attribution, source balance, and omission in a single sequence — not as independent checks stitched together. The output stays tied to what was actually in the text.</p>
            </div>
            <FeatureVisual visual="pipeline" />
          </section>
        </ScrollReveal>

        {/* ── Feature row 2: output ── */}
        <ScrollReveal>
          <section className={`${styles.featureSection} ${styles.featureReverse}`}>
            <div className={styles.featureCopy}>
              <span className={styles.featureEyebrow}>Output</span>
              <h2>Evidence exits with the result</h2>
              <p>Every result includes the direction label, a confidence score, quoted examples of the signals that shaped it, and sources to read alongside — so the analysis is a starting point, not a final word.</p>
            </div>
            <FeatureVisual visual="result" />
          </section>
        </ScrollReveal>

        {/* ── Feature row 3: confidence ── */}
        <ScrollReveal>
          <section className={styles.featureSection}>
            <div className={styles.featureCopy}>
              <span className={styles.featureEyebrow}>Confidence</span>
              <h2>A score, not just a label</h2>
              <p>Every result includes a confidence score reflecting how consistently the detected signals appeared across the article. When evidence is sparse or ambiguous, the score drops — so you know when to read the analysis with more caution.</p>
            </div>
            <FeatureVisual visual="confidence" />
          </section>
        </ScrollReveal>

        {/* ── CTA ── */}
        <ScrollReveal>
          <section className={styles.cta}>
            <AnalyzerCta heading="Put the pipeline to work" label="Open Analyzer" />
          </section>
        </ScrollReveal>

      </main>
    </MarketingShell>
  );
}

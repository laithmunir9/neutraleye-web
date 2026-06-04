import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import styles from "./page.module.css";

const heroInputs = ["Article text", "Source mix", "Framing", "Attribution"];
const heroOutputs = ["Summary", "Examples", "Confidence", "Next reads"];
const heroRailY = [193, 238, 282, 327];

const principleCards = [
  {
    title: "One pipeline",
    body: "Article intake, content extraction, signal review, and evidence packaging run as a single sequence — not independent steps stitched together after the fact."
  },
  {
    title: "Structured output",
    body: "Every result is assembled in the same schema: direction, confidence, summary, examples, sources, and recommendations — making results comparable across runs."
  },
  {
    title: "No black box",
    body: "The system returns what it found and where it found it. Quoted language and sourcing patterns are included so the output can be checked against the original text."
  }
];

const featureSections = [
  {
    eyebrow: "Structured read",
    title: "Readable by design",
    body: "NeutralEye checks that the submitted material is article-like, reviews wording and sourcing together, and returns a result that stays tied to text.",
    side: "right",
    visual: "result"
  },
  {
    eyebrow: "Article material",
    title: "One checked flow",
    body: "Intake, extraction, review, and evidence packaging stay in one sequence so the output explains what was found and how it was assembled.",
    side: "left",
    visual: "pipeline"
  },
  {
    eyebrow: "Open-web context",
    title: "Context stays visible",
    body: "Source balance, missing background, and next-reading prompts help the reader compare context rather than stopping at a single article summary.",
    side: "right",
    visual: "sources"
  },
  {
    eyebrow: "Linked evidence",
    title: "Links stay intact",
    body: "Findings can connect quotes, source roles, and related entities so the system supports comparison reading instead of reducing everything to one label.",
    side: "left",
    visual: "network"
  }
];

const useCases = [
  {
    title: "Quick article checks",
    text: "Run a fast read on tone, framing, and source balance before sharing, citing, or reacting to a story."
  },
  {
    title: "Comparison reading",
    text: "Compare reports on the same event and see where language, omitted context, or sourcing begin to diverge."
  },
  {
    title: "Evidence-first habits",
    text: "Use the output as a reading aid that points back to text and suggests what context to inspect next."
  },
  {
    title: "Reader workflows",
    text: "Use the website or extension to slow down interpretation and keep evidence visible while a story is still unfolding."
  }
];

function FeatureVisual({ visual }) {
  if (visual === "result") {
    return (
      <div className={styles.visualShell}>
        <div className={styles.resultCard}>
          <div className={styles.resultChrome}>
            <span />
            <span />
            <span />
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
              <span>Context prompts kept in view</span>
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
              <p>Framing, source balance, attribution, and omission are reviewed in one pass.</p>
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

  if (visual === "sources") {
    return (
      <div className={styles.visualShell}>
        <div className={styles.sourcePanel}>
          <div className={styles.searchBar}>Related context search</div>
          <div className={styles.sourceList}>
            <div className={styles.sourceItem}>
              <span className={styles.sourceIcon} />
              <div>
                <strong>Wire report</strong>
                <p>Baseline account of the event.</p>
              </div>
            </div>
            <div className={styles.sourceItem}>
              <span className={styles.sourceIcon} />
              <div>
                <strong>Local reporting</strong>
                <p>On-the-ground context and quotes.</p>
              </div>
            </div>
            <div className={styles.sourceItem}>
              <span className={styles.sourceIcon} />
              <div>
                <strong>Primary document</strong>
                <p>Statement, filing, or official release.</p>
              </div>
            </div>
            <div className={styles.sourceItem}>
              <span className={styles.sourceIcon} />
              <div>
                <strong>Follow-up commentary</strong>
                <p>Interpretation that can be compared back to source text.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.visualShell}>
      <div className={styles.networkCard}>
        <svg className={styles.networkLines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M26 24 L31 34" />
          <path d="M52 39 L53 49" />
          <path d="M56 57 L50 68" />
          <path d="M55 72 L68 80" />
        </svg>
        <div className={`${styles.networkNode} ${styles.networkSourceRole}`}>Source role</div>
        <div className={`${styles.networkNode} ${styles.networkQuotedLanguage}`}>Quoted language</div>
        <div className={`${styles.networkNode} ${styles.networkContextGap}`}>Context gap</div>
        <div className={`${styles.networkNode} ${styles.networkComparisonRead}`}>Comparison read</div>
        <div className={`${styles.networkNode} ${styles.networkReaderStep}`}>Reader next step</div>
      </div>
    </div>
  );
}

export default function SystemPage() {
  return (
    <MarketingShell darkHeader>
      <main className={styles.page}>
        <section className={styles.hero} data-header-theme="dark">
          <div className={styles.heroInner}>
            <svg className={styles.heroConnections} viewBox="0 0 1600 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <linearGradient id="hero-line-left-fade" x1="370" x2="790" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.13)" />
                  <stop offset="68%" stopColor="rgba(255, 255, 255, 0.1)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                </linearGradient>
                <linearGradient id="hero-line-right-fade" x1="810" x2="1230" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                  <stop offset="32%" stopColor="rgba(255, 255, 255, 0.1)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.13)" />
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
              {heroInputs.map((item, index) => (
                <g key={item}>
                  <text className={styles.heroSvgLabel} x="345" y={heroRailY[index]} textAnchor="end" dominantBaseline="middle">
                    {item}
                  </text>
                  <circle className={styles.heroSvgNode} cx="370" cy={heroRailY[index]} r="5.5" />
                </g>
              ))}
              {heroOutputs.map((item, index) => (
                <g key={item}>
                  <circle className={styles.heroSvgNode} cx="1230" cy={heroRailY[index]} r="5.5" />
                  <text className={styles.heroSvgLabel} x="1255" y={heroRailY[index]} textAnchor="start" dominantBaseline="middle">
                    {item}
                  </text>
                </g>
              ))}
            </svg>
            <div className={styles.heroCopy}>
              <h1>How NeutralEye works</h1>
              <p className={styles.lead}>
                Article text goes in. A structured bias analysis — direction, evidence, confidence, and next reads — comes out.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.heroButton} href="/analyze">
                  Open Analyzer
                </a>
              </div>
            </div>
          </div>
        </section>

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

        <section className={styles.featureStack}>
          {featureSections.map((section) => (
            <ScrollReveal key={section.title}>
              <section
                className={`${styles.featureSection} ${section.side === "left" ? styles.featureReverse : ""}`}
              >
                <div className={styles.featureCopy}>
                  <span className={styles.featureEyebrow}>{section.eyebrow}</span>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </div>
                <FeatureVisual visual={section.visual} />
              </section>
            </ScrollReveal>
          ))}
        </section>

        <ScrollReveal>
          <section className={styles.section}>
            <div className={styles.sectionIntro}>
              <h2>Where it fits</h2>
              <p>NeutralEye slots into reading workflows where a fast, structured second opinion helps before sharing, citing, or reacting.</p>
            </div>

            <div className={styles.useCaseGrid}>
              {useCases.map((item) => (
                <article key={item.title} className={styles.useCaseCard}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={styles.cta}>
            <AnalyzerCta heading="Put the pipeline to work" label="Open Analyzer" />
          </section>
        </ScrollReveal>
      </main>
    </MarketingShell>
  );
}

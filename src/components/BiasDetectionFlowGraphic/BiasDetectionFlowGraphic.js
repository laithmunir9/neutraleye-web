import styles from "./BiasDetectionFlowGraphic.module.css";

const NODES = [
  {
    key: "input",
    title: "Article intake",
    description: "Paste text or submit a direct article URL.",
    positionClass: "nodeInput",
    pulseDelay: "0.2s"
  },
  {
    key: "extract",
    title: "Readable text isolated",
    description: "NeutralEye confirms the content is a real article before analysis.",
    positionClass: "nodeExtract",
    pulseDelay: "1.1s"
  },
  {
    key: "tone",
    title: "Tone signals reviewed",
    description: "Loaded phrasing, emotional emphasis, and asymmetry are scanned.",
    positionClass: "nodeTone",
    pulseDelay: "2s"
  },
  {
    key: "frame",
    title: "Framing compared",
    description: "Narrative structure, omitted context, and source balance are checked.",
    positionClass: "nodeFrame",
    pulseDelay: "2.9s"
  },
  {
    key: "output",
    title: "Structured result built",
    description: "Summary, examples, sources, recommendation, and confidence are returned.",
    positionClass: "nodeOutput",
    pulseDelay: "3.8s"
  }
];

const SIGNALS = [
  { label: "Article verified", positionClass: "signalOne", tone: "warm" },
  { label: "Tone spike flagged", positionClass: "signalTwo", tone: "neutral" },
  { label: "Missing context surfaced", positionClass: "signalThree", tone: "cool" },
  { label: "Output delivered", positionClass: "signalFour", tone: "warm" }
];

export default function BiasDetectionFlowGraphic({ activeStage = 0, flowing = false }) {
  const active = flowing ? activeStage || 1 : 0;

  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.grid} />
      <div className={styles.glow} />

      <svg className={styles.connections} viewBox="0 0 680 520" preserveAspectRatio="none">
        <defs>
          <linearGradient id="neutraleye-flow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 103, 65, 0.22)" />
            <stop offset="100%" stopColor="rgba(42, 35, 29, 0.52)" />
          </linearGradient>
          <path id="neutraleye-main-flow" d="M92 104 C168 128 204 144 250 194 C306 252 348 286 418 286 C474 286 514 252 548 204 C578 162 600 128 616 112" />
          <path id="neutraleye-branch-flow" d="M418 286 C402 340 374 386 324 432" />
        </defs>

        <path className={styles.pathBase} d="M92 104 C168 128 204 144 250 194 C306 252 348 286 418 286 C474 286 514 252 548 204 C578 162 600 128 616 112" />
        <path className={styles.pathHighlight} d="M92 104 C168 128 204 144 250 194 C306 252 348 286 418 286 C474 286 514 252 548 204 C578 162 600 128 616 112" />
        <path className={styles.pathBase} d="M418 286 C402 340 374 386 324 432" />
        <path className={styles.pathHighlight} d="M418 286 C402 340 374 386 324 432" />

        <circle r="7" className={styles.tracer}>
          <animateMotion dur="6.8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#neutraleye-main-flow" />
          </animateMotion>
        </circle>

        <circle r="5" className={styles.tracerSecondary}>
          <animateMotion begin="3.1s" dur="2.1s" repeatCount="indefinite" rotate="auto">
            <mpath href="#neutraleye-branch-flow" />
          </animateMotion>
        </circle>
      </svg>

      {NODES.map((node, index) => {
        const isActive = active === index + 1;
        return (
          <div
            key={node.key}
            className={`${styles.node} ${styles[node.positionClass]} ${isActive ? styles.nodeActive : ""}`}
            style={{ animationDelay: node.pulseDelay }}
          >
            <span className={styles.nodePin} />
            <div className={styles.nodeCard}>
              <p className={styles.nodeIndex}>0{index + 1}</p>
              <p className={styles.nodeTitle}>{node.title}</p>
              <p className={styles.nodeDescription}>{node.description}</p>
            </div>
          </div>
        );
      })}

      {SIGNALS.map((signal, index) => (
        <div
          key={signal.label}
          className={`${styles.signal} ${styles[signal.positionClass]} ${styles[`tone${signal.tone[0].toUpperCase()}${signal.tone.slice(1)}`]}`}
          style={{ animationDelay: `${1.1 + index * 1.05}s` }}
        >
          {signal.label}
        </div>
      ))}

      <div className={styles.legend}>
        <span className={styles.legendLabel}>System flow</span>
        <p>The website follows the same extension logic: validate article, inspect writing patterns, and return structured output.</p>
      </div>
    </div>
  );
}

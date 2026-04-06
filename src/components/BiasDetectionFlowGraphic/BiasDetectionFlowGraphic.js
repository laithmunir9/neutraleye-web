import styles from "./BiasDetectionFlowGraphic.module.css";

const NODES = [
  {
    title: "Article Input",
    description: "Article URL or pasted text"
  },
  {
    title: "Text Extraction",
    description: "Visible article content isolated"
  },
  {
    title: "Tone Analysis",
    description: "Language and emphasis reviewed",
    tags: ["Emotional wording detected", "Selective emphasis"]
  },
  {
    title: "Framing Detection",
    description: "Narrative structure compared",
    tags: ["Missing counterargument", "Framing imbalance"]
  },
  {
    title: "Structured Output",
    description: "Bias, examples, sources, confidence"
  }
];

export default function BiasDetectionFlowGraphic() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.backdrop} />
      <svg className={styles.connections} viewBox="0 0 320 500" preserveAspectRatio="none">
        <path className={styles.path} d="M60 52 C110 76, 132 92, 142 132" />
        <path className={styles.path} d="M150 174 C166 212, 186 238, 212 276" />
        <path className={styles.path} d="M214 318 C198 352, 178 382, 168 414" />
        <path className={styles.path} d="M164 454 C154 470, 154 480, 160 492" />
      </svg>

      <div className={styles.graphic}>
        {NODES.map((node, index) => (
          <div key={node.title} className={`${styles.node} ${styles[`node${index + 1}`]}`}>
            <div className={styles.nodeMarker}>
              <span className={styles.nodeCore} />
            </div>
            <div className={styles.nodeCard}>
              <p className={styles.nodeTitle}>{node.title}</p>
              <p className={styles.nodeDescription}>{node.description}</p>
              {node.tags ? (
                <div className={styles.tags}>
                  {node.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

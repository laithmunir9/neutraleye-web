"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./HeroSystemVisualization.module.css";

const N = 8; // half-size of square node

const SCENES = [
  {
    id: "flow",
    nodes: [
      { key: "a", x: 58,  y: 390, label: "Article input",    labelDx: 16, labelDy: 4,   accent: false },
      { key: "b", x: 195, y: 308, label: "Text extracted",   labelDx: 16, labelDy: 4,   accent: false },
      { key: "c", x: 338, y: 200, label: "Signals checked",  labelDx: 0,  labelDy: -18, accent: true  },
      { key: "d", x: 465, y: 268, label: "Evidence linked",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "e", x: 585, y: 105, label: "Bias verdict",     labelDx: 0,  labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 58,  y1: 390, x2: 195, y2: 308 },
      { key: "bc", x1: 195, y1: 308, x2: 338, y2: 200 },
      { key: "cd", x1: 338, y1: 200, x2: 465, y2: 268 },
      { key: "de", x1: 465, y1: 268, x2: 585, y2: 105 },
    ],
  },
  {
    id: "branch",
    nodes: [
      { key: "a", x: 58,  y: 385, label: "Article URL",      labelDx: 16, labelDy: 4,   accent: false },
      { key: "b", x: 200, y: 290, label: "Text parsed",      labelDx: 16, labelDy: 4,   accent: false },
      { key: "c", x: 370, y: 158, label: "Tone: loaded",     labelDx: 16, labelDy: 4,   accent: true  },
      { key: "d", x: 370, y: 368, label: "Sources: sparse",  labelDx: 16, labelDy: 4,   accent: true  },
      { key: "e", x: 555, y: 255, label: "Left-leaning",     labelDx: 0,  labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 58,  y1: 385, x2: 200, y2: 290 },
      { key: "bc", x1: 200, y1: 290, x2: 370, y2: 158 },
      { key: "bd", x1: 200, y1: 290, x2: 370, y2: 368 },
      { key: "ce", x1: 370, y1: 158, x2: 555, y2: 255 },
      { key: "de", x1: 370, y1: 368, x2: 555, y2: 255 },
    ],
  },
  {
    id: "confidence",
    nodes: [
      { key: "a", x: 52,  y: 395, label: "Text input",       labelDx: 16, labelDy: 4,   accent: false },
      { key: "b", x: 190, y: 315, label: "Framing detected", labelDx: 16, labelDy: 4,   accent: true  },
      { key: "c", x: 332, y: 212, label: "Omission gap",     labelDx: 16, labelDy: 4,   accent: true  },
      { key: "d", x: 462, y: 308, label: "Confidence: 77%",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "e", x: 580, y: 108, label: "Analysis ready",   labelDx: 0,  labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 52,  y1: 395, x2: 190, y2: 315 },
      { key: "bc", x1: 190, y1: 315, x2: 332, y2: 212 },
      { key: "cd", x1: 332, y1: 212, x2: 462, y2: 308 },
      { key: "de", x1: 462, y1: 308, x2: 580, y2: 108 },
    ],
  },
  {
    id: "audit",
    nodes: [
      { key: "a", x: 62,  y: 338, label: "URL submitted",    labelDx: 16, labelDy: 4,   accent: false },
      { key: "b", x: 205, y: 245, label: "Article scraped",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "c", x: 345, y: 138, label: "Attribution gap",  labelDx: 16, labelDy: 4,   accent: true  },
      { key: "d", x: 345, y: 338, label: "Counter-context",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "e", x: 478, y: 228, label: "Right-leaning",    labelDx: 0,  labelDy: -18, accent: true  },
      { key: "f", x: 588, y: 118, label: "Sources flagged",  labelDx: 0,  labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 62,  y1: 338, x2: 205, y2: 245 },
      { key: "bc", x1: 205, y1: 245, x2: 345, y2: 138 },
      { key: "bd", x1: 205, y1: 245, x2: 345, y2: 338 },
      { key: "ce", x1: 345, y1: 138, x2: 478, y2: 228 },
      { key: "de", x1: 345, y1: 338, x2: 478, y2: 228 },
      { key: "ef", x1: 478, y1: 228, x2: 588, y2: 118 },
    ],
  },
];

const CYCLE_MS = 6800;
const STAGGER = 620;

function nodeDelay(i) { return `${i * STAGGER}ms`; }
function edgeDelay(i) { return `${i * STAGGER + 280}ms`; }

export default function HeroSystemVisualization() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SCENES.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const scene = SCENES[idx];

  return (
    <section className={styles.system} aria-label="NeutralEye analysis graph">
      <div className={styles.surface}>
        <div className={styles.field} aria-hidden="true" />

        <AnimatePresence mode="wait">
          <motion.svg
            key={scene.id}
            className={styles.map}
            viewBox="0 0 640 430"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Edges */}
            {scene.edges.map((edge, i) => (
              <path
                key={edge.key}
                className={styles.edge}
                d={`M${edge.x1} ${edge.y1} L${edge.x2} ${edge.y2}`}
                pathLength="1"
                style={{ animationDelay: edgeDelay(i) }}
              />
            ))}

            {/* Nodes */}
            {scene.nodes.map((node, i) => (
              <g
                key={node.key}
                className={styles.nodeGroup}
                style={{ animationDelay: nodeDelay(i) }}
              >
                {node.accent && (
                  <rect
                    className={styles.nodeGlow}
                    x={node.x - N - 5}
                    y={node.y - N - 5}
                    width={N * 2 + 10}
                    height={N * 2 + 10}
                    rx="5"
                  />
                )}
                <rect
                  className={`${styles.nodeRect} ${node.accent ? styles.nodeAccent : ""}`}
                  x={node.x - N}
                  y={node.y - N}
                  width={N * 2}
                  height={N * 2}
                  rx="2.5"
                />
                <text
                  className={`${styles.nodeLabel} ${node.accent ? styles.nodeLabelAccent : ""}`}
                  x={node.x + node.labelDx}
                  y={node.y + node.labelDy}
                  textAnchor={node.labelDx === 0 ? "middle" : "start"}
                >
                  {node.label}
                </text>
              </g>
            ))}
          </motion.svg>
        </AnimatePresence>

        {/* Scene dots */}
        <div className={styles.dots} aria-hidden="true">
          {SCENES.map((s, i) => (
            <span key={s.id} className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

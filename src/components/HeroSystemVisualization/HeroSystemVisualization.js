"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./HeroSystemVisualization.module.css";

const N = 8; // half-size of square node

const SCENES = [
  {
    id: "flow",
    nodes: [
      { key: "a", x: 90,  y: 330, label: "Article input",    labelDx: 16, labelDy: 4,   accent: false },
      { key: "b", x: 215, y: 265, label: "Text extracted",   labelDx: 16, labelDy: 4,   accent: false },
      { key: "c", x: 345, y: 200, label: "Signals checked",  labelDx: 0,  labelDy: -18, accent: true  },
      { key: "d", x: 462, y: 250, label: "Evidence linked",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "e", x: 562, y: 148, label: "Bias verdict",     labelDx: 0,  labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 90,  y1: 330, x2: 215, y2: 265 },
      { key: "bc", x1: 215, y1: 265, x2: 345, y2: 200 },
      { key: "cd", x1: 345, y1: 200, x2: 462, y2: 250 },
      { key: "de", x1: 462, y1: 250, x2: 562, y2: 148 },
    ],
  },
  {
    id: "branch",
    nodes: [
      { key: "a", x: 100, y: 350, label: "Article URL",      labelDx: 16,  labelDy: 4,   accent: false },
      { key: "b", x: 228, y: 275, label: "Text parsed",      labelDx: 16,  labelDy: 4,   accent: false },
      { key: "c", x: 378, y: 185, label: "Tone: loaded",     labelDx: 16,  labelDy: 4,   accent: true  },
      { key: "d", x: 378, y: 335, label: "Sources: sparse",  labelDx: 16,  labelDy: 4,   accent: true  },
      { key: "e", x: 532, y: 258, label: "Left-leaning",     labelDx: 0,   labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 100, y1: 350, x2: 228, y2: 275 },
      { key: "bc", x1: 228, y1: 275, x2: 378, y2: 185 },
      { key: "bd", x1: 228, y1: 275, x2: 378, y2: 335 },
      { key: "ce", x1: 378, y1: 185, x2: 532, y2: 258 },
      { key: "de", x1: 378, y1: 335, x2: 532, y2: 258 },
    ],
  },
  {
    id: "confidence",
    nodes: [
      { key: "a", x: 85,  y: 370, label: "Text input",       labelDx: 16, labelDy: 4,   accent: false },
      { key: "b", x: 208, y: 300, label: "Framing detected", labelDx: 16, labelDy: 4,   accent: true  },
      { key: "c", x: 340, y: 215, label: "Omission gap",     labelDx: 16, labelDy: 4,   accent: true  },
      { key: "d", x: 462, y: 295, label: "Confidence: 77%",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "e", x: 565, y: 168, label: "Analysis ready",   labelDx: 0,  labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 85,  y1: 370, x2: 208, y2: 300 },
      { key: "bc", x1: 208, y1: 300, x2: 340, y2: 215 },
      { key: "cd", x1: 340, y1: 215, x2: 462, y2: 295 },
      { key: "de", x1: 462, y1: 295, x2: 565, y2: 168 },
    ],
  },
  {
    id: "audit",
    nodes: [
      { key: "a", x: 108, y: 310, label: "URL submitted",    labelDx: 16, labelDy: 4,   accent: false },
      { key: "b", x: 240, y: 230, label: "Article scraped",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "c", x: 355, y: 160, label: "Attribution gap",  labelDx: 16, labelDy: 4,   accent: true  },
      { key: "d", x: 355, y: 310, label: "Counter-context",  labelDx: 16, labelDy: 4,   accent: false },
      { key: "e", x: 482, y: 235, label: "Right-leaning",    labelDx: 0,  labelDy: -18, accent: true  },
      { key: "f", x: 565, y: 158, label: "Sources flagged",  labelDx: 0,  labelDy: -18, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 108, y1: 310, x2: 240, y2: 230 },
      { key: "bc", x1: 240, y1: 230, x2: 355, y2: 160 },
      { key: "bd", x1: 240, y1: 230, x2: 355, y2: 310 },
      { key: "ce", x1: 355, y1: 160, x2: 482, y2: 235 },
      { key: "de", x1: 355, y1: 310, x2: 482, y2: 235 },
      { key: "ef", x1: 482, y1: 235, x2: 565, y2: 158 },
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

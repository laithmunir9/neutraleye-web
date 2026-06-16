"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./HeroSystemVisualization.module.css";

const N = 12; // node half-size (24×24 squares)

// All scenes are strict linear chains: a→b→c→d→e
// Visual variety comes from each scene's distinct path through the space
const SCENES = [
  {
    // Mostly rising — gentle staircase with a dip at d
    id: "flow",
    nodes: [
      { key: "a", x: 42,  y: 395, label: "Article input",    labelDx: 18, labelDy: 4,   accent: false },
      { key: "b", x: 185, y: 288, label: "Text extracted",   labelDx: 18, labelDy: 4,   accent: false },
      { key: "c", x: 328, y: 155, label: "Signals checked",  labelDx: 0,  labelDy: -22, accent: true  },
      { key: "d", x: 462, y: 248, label: "Evidence linked",  labelDx: 18, labelDy: 4,   accent: false },
      { key: "e", x: 572, y: 55,  label: "Bias verdict",     labelDx: 0,  labelDy: -22, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 42,  y1: 395, x2: 185, y2: 288 },
      { key: "bc", x1: 185, y1: 288, x2: 328, y2: 155 },
      { key: "cd", x1: 328, y1: 155, x2: 462, y2: 248 },
      { key: "de", x1: 462, y1: 248, x2: 572, y2: 55  },
    ],
  },
  {
    // Sharp W — low→top→bottom→top→mid, dramatic oscillation
    id: "branch",
    nodes: [
      { key: "a", x: 42,  y: 345, label: "Article URL",      labelDx: 18, labelDy: 4,   accent: false },
      { key: "b", x: 172, y: 78,  label: "Text parsed",      labelDx: 18, labelDy: 4,   accent: false },
      { key: "c", x: 322, y: 332, label: "Tone: loaded",     labelDx: 0,  labelDy: 28,  accent: true  },
      { key: "d", x: 455, y: 72,  label: "Sources: sparse",  labelDx: 0,  labelDy: -22, accent: true  },
      { key: "e", x: 568, y: 295, label: "Left-leaning",     labelDx: 0,  labelDy: 28,  accent: true  },
    ],
    edges: [
      { key: "ab", x1: 42,  y1: 345, x2: 172, y2: 78  },
      { key: "bc", x1: 172, y1: 78,  x2: 322, y2: 332 },
      { key: "cd", x1: 322, y1: 332, x2: 455, y2: 72  },
      { key: "de", x1: 455, y1: 72,  x2: 568, y2: 295 },
    ],
  },
  {
    // Rise then dramatic dip then spike — tension and release
    id: "confidence",
    nodes: [
      { key: "a", x: 42,  y: 415, label: "Text input",       labelDx: 18, labelDy: 4,   accent: false },
      { key: "b", x: 192, y: 305, label: "Framing detected", labelDx: 18, labelDy: 4,   accent: true  },
      { key: "c", x: 338, y: 168, label: "Omission gap",     labelDx: 18, labelDy: 4,   accent: true  },
      { key: "d", x: 482, y: 365, label: "Confidence: 77%",  labelDx: 0,  labelDy: 28,  accent: false },
      { key: "e", x: 574, y: 58,  label: "Analysis ready",   labelDx: 0,  labelDy: -22, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 42,  y1: 415, x2: 192, y2: 305 },
      { key: "bc", x1: 192, y1: 305, x2: 338, y2: 168 },
      { key: "cd", x1: 338, y1: 168, x2: 482, y2: 365 },
      { key: "de", x1: 482, y1: 365, x2: 574, y2: 58  },
    ],
  },
  {
    // High→low→mid→very-low→high — starts at top, distinct phase from other scenes
    id: "audit",
    nodes: [
      { key: "a", x: 42,  y: 145, label: "URL submitted",    labelDx: 18, labelDy: 4,   accent: false },
      { key: "b", x: 185, y: 348, label: "Article scraped",  labelDx: 18, labelDy: 4,   accent: false },
      { key: "c", x: 325, y: 178, label: "Attribution gap",  labelDx: 18, labelDy: 4,   accent: true  },
      { key: "d", x: 462, y: 372, label: "Right-leaning",    labelDx: 0,  labelDy: 28,  accent: true  },
      { key: "e", x: 564, y: 132, label: "Sources flagged",  labelDx: 0,  labelDy: -22, accent: true  },
    ],
    edges: [
      { key: "ab", x1: 42,  y1: 145, x2: 185, y2: 348 },
      { key: "bc", x1: 185, y1: 348, x2: 325, y2: 178 },
      { key: "cd", x1: 325, y1: 178, x2: 462, y2: 372 },
      { key: "de", x1: 462, y1: 372, x2: 564, y2: 132 },
    ],
  },
];

const CYCLE_MS = 6200;
const STAGGER = 700;

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
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            className={styles.sceneLayer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.field} aria-hidden="true" />
            <div className={styles.fieldOverlay} aria-hidden="true" />
            <svg className={styles.map} viewBox="0 0 640 430" aria-hidden="true">
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
                    textAnchor={node.labelDx === 0 ? "middle" : node.labelDx < 0 ? "end" : "start"}
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

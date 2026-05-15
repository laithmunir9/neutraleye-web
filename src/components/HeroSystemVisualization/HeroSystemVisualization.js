"use client";

import { useState } from "react";
import styles from "./HeroSystemVisualization.module.css";

const NODES = [
  {
    key: "input",
    x: 82,
    y: 318,
    className: "nodeInput",
    labelX: 98,
    labelY: 332,
    title: "Article input"
  },
  {
    key: "extract",
    x: 196,
    y: 264,
    className: "nodeExtract",
    labelX: 214,
    labelY: 281,
    title: "Text extracted"
  },
  {
    key: "signals",
    x: 324,
    y: 204,
    className: "nodeSignals",
    primary: true,
    labelX: 338,
    labelY: 194,
    title: "Signals checked"
  },
  {
    key: "evidence",
    x: 448,
    y: 246,
    className: "nodeEvidence",
    labelX: 462,
    labelY: 258,
    title: "Evidence linked"
  },
  {
    key: "output",
    x: 562,
    y: 148,
    className: "nodeOutput",
    labelX: 558,
    labelY: 128,
    title: "Structured output",
    align: "end"
  }
];

const PATHS = [
  { key: "input-extract", d: "M82 318 C116 304 156 286 196 264", className: "pathOne" },
  { key: "extract-signals", d: "M196 264 C236 244 278 222 324 204", className: "pathTwo" },
  { key: "signals-evidence", d: "M324 204 C364 214 404 230 448 246", className: "pathThree" },
  { key: "evidence-output", d: "M448 246 C482 224 524 182 562 148", className: "pathFour" }
];

export default function HeroSystemVisualization() {
  const [paused, setPaused] = useState(false);

  return (
    <section className={styles.system} aria-label="NeutralEye article analysis system visualization">
      <div className={`${styles.surface} ${paused ? styles.paused : ""}`}>
        <button
          className={styles.playToggle}
          type="button"
          aria-pressed={paused}
          aria-label={paused ? "Play graph animation" : "Pause graph animation"}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          )}
        </button>

        <div className={styles.field} aria-hidden="true" />

        <svg className={styles.map} viewBox="0 0 640 430" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="neutraleye-live-path" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(32, 27, 22, 0.18)" />
              <stop offset="100%" stopColor="rgba(139, 103, 65, 0.42)" />
            </linearGradient>
          </defs>

          {PATHS.map((path) => (
            <g key={path.key}>
              <path className={styles.pathBase} d={path.d} />
              <path
                className={`${styles.pathActive} ${styles[path.className]}`}
                d={path.d}
                pathLength="1"
              />
            </g>
          ))}

          {NODES.map((node) => (
            <g
              key={node.key}
              className={`${styles.nodeGroup} ${styles[node.className]} ${node.primary ? styles.nodePrimary : ""}`}
            >
              <circle className={styles.node} cx={node.x} cy={node.y} r="7" />
              <text
                className={styles.nodeLabel}
                x={node.labelX}
                y={node.labelY}
                textAnchor={node.align ?? "start"}
              >
                {node.title}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

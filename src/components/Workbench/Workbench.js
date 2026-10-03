"use client";

import { useRef, useState } from "react";
import { MODES, DEFAULT_MODE, resolveMode } from "./modes";
import styles from "./Workbench.module.css";

/*
 * One product, two modes. The toggle swaps what the slot does and nothing
 * else: the tabs, the prompt line and the slot keep their position, so
 * switching reads as flipping a mode rather than going somewhere new.
 *
 * Every mode stays mounted and inactive ones are hidden, so text pasted into
 * Read survives a look at Write and back. The mode is mirrored into the URL
 * (?mode=) so Write can be linked to directly; the page reads it on the server
 * and passes it in, and switching only rewrites the address, with no request.
 */
export default function Workbench({ initialMode = DEFAULT_MODE, savedId = null }) {
  const [active, setActive] = useState(resolveMode(initialMode));
  const activeIndex = MODES.findIndex((mode) => mode.id === active);
  const tabRefs = useRef([]);

  function select(id) {
    if (id === active) return;
    setActive(id);
    window.history.replaceState(null, "", id === DEFAULT_MODE ? "/" : `/?mode=${id}`);
  }

  // Arrow keys move between tabs, per the WAI-ARIA tabs pattern.
  function handleKeyDown(event) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (activeIndex + step + MODES.length) % MODES.length;
    select(MODES[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={styles.workbench}>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Mode"
        style={{ "--tab-count": MODES.length, "--tab-index": activeIndex }}
        onKeyDown={handleKeyDown}
      >
        {MODES.map((mode, index) => (
          <button
            key={mode.id}
            ref={(el) => { tabRefs.current[index] = el; }}
            type="button"
            role="tab"
            id={`tab-${mode.id}`}
            aria-selected={mode.id === active}
            aria-controls={`panel-${mode.id}`}
            tabIndex={mode.id === active ? 0 : -1}
            className={styles.tab}
            onClick={() => select(mode.id)}
          >
            {mode.label}
          </button>
        ))}
        <span className={styles.tabRule} aria-hidden="true" />
      </div>

      {MODES.map(({ id, prompt, Component }) => (
        <section
          key={id}
          role="tabpanel"
          id={`panel-${id}`}
          aria-labelledby={`tab-${id}`}
          hidden={id !== active}
          className={styles.panel}
        >
          <p className={styles.prompt}>{prompt}</p>
          <Component savedId={savedId} />
        </section>
      ))}
    </div>
  );
}

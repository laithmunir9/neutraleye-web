"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import Annotation from "@/components/for-comms/Annotation";
import CoverageMatrix from "@/components/for-comms/CoverageMatrix";
import matrix from "@/components/for-comms/CoverageMatrix.module.css";
import shell from "./marketing.module.css";
import styles from "./page.module.css";

const EASE = [0.22, 1, 0.36, 1];

const ANNOTATIONS = [
  {
    signal: "Tone",
    body: "Loaded phrasing. “a decisive step toward long-overdue reform” frames the outcome as overdue progress before the policy itself is explained.",
  },
  {
    signal: "Framing",
    body: "Selective emphasis. The procedural detail leads the story; the policy change itself is three paragraphs down.",
  },
  {
    signal: "Attribution",
    body: "Unnamed sourcing. “three committee aides” is the only attribution offered for a contested figure.",
  },
  {
    signal: "Sources",
    body: "One-sided sourcing. The opposing view gets one sentence out of five paragraphs.",
  },
  {
    signal: "Omission",
    body: "Missing context. The CBO’s same-day cost estimate isn’t referenced anywhere in the piece.",
  },
];

const REASONS = [
  "Every quote is verified against the source text before it appears in a report. Nothing gets attributed to the wrong article.",
  "Which claims get examined is decided by deterministic code, not by model judgment, so the same set of articles produces the same set of claims.",
  "Each analysis runs twice and reports a stability score. Where the two runs differ, you see it, rather than being told the result is reproducible.",
];

function Mark({ index, active, onActivate, children }) {
  return (
    <span
      className={`${styles.mark} ${active === index ? styles.markActive : ""}`}
      onMouseEnter={() => onActivate(index)}
      onMouseLeave={() => onActivate(null)}
    >
      {children}
      <sup className={styles.markIndex}>{index}</sup>
    </span>
  );
}

export default function Home() {
  const [active, setActive] = useState(null);

  // No reduced-motion branch here on purpose. useReducedMotion() is false during
  // SSR and true on the client for those users, so branching on it made the
  // server and client markup disagree and broke hydration. Reduced motion is
  // handled once, in CSS, where it cannot race.
  const heroContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const heroItem = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };

  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <motion.div
            className={styles.heroText}
            variants={heroContainer}
            initial="hidden"
            animate="show"
          >
            <div className={styles.copy}>
              <motion.h1 variants={heroItem}>
                See how one story was covered across every outlet that covered it
              </motion.h1>
              <motion.p className={styles.lead} variants={heroItem}>
                Send the coverage of a single story. Get back what each outlet reported, what each
                one left out, and where an outlet&rsquo;s own text does not support its summary.
                Every quote is checked against the source before it reaches you.
              </motion.p>
            </div>
            <motion.div className={styles.actions} variants={heroItem}>
              <a href="mailto:contact@tryneutraleye.com?subject=NeutralEye%20demo" className={styles.heroBtn}>
                Book a demo
              </a>
              <Link href="/analyze" className={styles.heroBtnQuiet}>
                Or try it on one article
              </Link>
            </motion.div>
          </motion.div>

          {/* The hook is the finding itself, not a decorative graphic. */}
          <motion.figure
            className={styles.exhibit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
          >
            <p className={styles.exhibitBody}>
              24/7 Wall St&rsquo;s summary of Honeywell Aerospace&rsquo;s earnings said shares{" "}
              <Annotation sweep index={0}>crashed 34% after the earnings report</Annotation>. The article&rsquo;s own
              body says shares <Annotation sweep index={1}>fell 23.2% in the session</Annotation> and were{" "}
              <Annotation sweep index={2}>down 34.3% over the past month</Annotation>. The unqualified number is the
              one a reader takes away, and it is 11.1 points from the one the body supports.
            </p>
            <figcaption className={styles.exhibitMeta}>
              Both figures are in the same article, so this takes about thirty seconds to check.
            </figcaption>
          </motion.figure>
        </section>

        {/* ── The deliverable ── */}
        <section className={shell.section}>
          <h2>What you get back</h2>
          <div className={shell.measure}>
            <p>
              One story, every outlet that covered it, and the claims laid side by side. Not a
              score, not a spectrum, and not a verdict on the outlet.
            </p>
          </div>

          <div className={shell.full}>
            <CoverageMatrix />
          </div>

          <ul className={`${styles.legend} ${shell.full}`}>
            <li>
              <h3 className={styles.legendLabel}>
                <span className={`${matrix.state} ${matrix.reported}`}>Reported</span>
              </h3>
              <p>A matrix of the claims each outlet made, laid out side by side.</p>
            </li>
            <li>
              <h3 className={styles.legendLabel}>
                <span className={`${matrix.state} ${matrix.omitted}`}>Omitted</span>
              </h3>
              <p>What appeared in some outlets and not in others.</p>
            </li>
            <li>
              <h3 className={styles.legendLabel}>
                <span className={`${matrix.state} ${matrix.contradicted}`}>Contradicted</span>
              </h3>
              <p>Where an outlet&rsquo;s own text does not support its own summary.</p>
            </li>
          </ul>
        </section>

        {/* ── Why it holds up ── */}
        <section className={shell.section}>
          <h2>Why the output holds up</h2>
          <ul className={shell.rows}>
            {REASONS.map((r) => (
              <li key={r} className={shell.row}>{r}</li>
            ))}
          </ul>
        </section>

        {/* ── One method, two directions ── */}
        <section className={shell.section}>
          <h2>The same method, pointed at your own draft</h2>
          <div className={shell.measure}>
            <p>
              Tone, framing, attribution, source balance, and omission, reviewed together in a
              single pass. It reads someone else&rsquo;s article the way a sharp editor would, with
              every signal tied to the exact language that triggered it. The reports above are this
              same read, run across five outlets at once.
            </p>
          </div>

          <div className={`${styles.spread} ${shell.full}`}>
            <article className={styles.manuscript}>
              <p className={styles.kicker}>Politics · Senate · thenationalstandard.com</p>
              <h3 className={styles.headline}>Senate Committee Advances Border Security Package</h3>
              <p className={styles.byline}>Staff report · 14:22</p>

              <div className={styles.body}>
                <p>
                  After months of stalled negotiations, the Senate Judiciary Committee voted 11–9 along
                  party lines Tuesday to advance the border security package, what its sponsors called{" "}
                  <Mark index={1} active={active} onActivate={setActive}>a decisive step toward long-overdue reform</Mark>{" "}
                  after years of inaction.
                </p>
                <p>
                  Coverage centered on{" "}
                  <Mark index={2} active={active} onActivate={setActive}>the committee&rsquo;s revised inspection timeline</Mark>,
                  framing the vote chiefly as a procedural win for chamber leadership rather than a shift
                  in the underlying policy.
                </p>
                <p>
                  <Mark index={3} active={active} onActivate={setActive}>Three committee aides said</Mark> the
                  new funding formula was negotiated &ldquo;in good faith,&rdquo; though none were named and
                  no on-the-record source confirmed the figures.
                </p>
                <p>
                  Opposition members, who hold one of the package&rsquo;s four amendments, were{" "}
                  <Mark index={4} active={active} onActivate={setActive}>given a single sentence</Mark> near
                  the close of the article to register their objection.
                </p>
                <p>
                  Not mentioned anywhere in the piece:{" "}
                  <Mark index={5} active={active} onActivate={setActive}>the Congressional Budget Office&rsquo;s same-day estimate</Mark>,
                  which projects the package would add $4.2B to the deficit over five years.
                </p>
              </div>
            </article>

            <div className={styles.margin}>
              {ANNOTATIONS.map((note, i) => (
                <div key={note.signal}>
                  <div
                    className={styles.note}
                    data-active={active === i + 1}
                    style={{ "--rot": i % 2 === 0 ? "-0.6deg" : "0.6deg" }}
                    onMouseEnter={() => setActive(i + 1)}
                    onMouseLeave={() => setActive(null)}
                  >
                    <div className={styles.noteHead}>
                      <span className={styles.noteIndex}>{i + 1}</span>
                      <span className={styles.noteSignal}>{note.signal}</span>
                    </div>
                    <p className={styles.noteText}>{note.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${styles.directions} ${shell.full}`}>
            <div className={styles.direction}>
              <h3>Reading</h3>
              <p>
                Run it on any article, free, in the browser or as a Chrome extension. No account
                needed.
              </p>
              <Link href="/analyze" className={styles.directionLink}>Open the analyzer</Link>
            </div>
            <div className={styles.direction}>
              <h3>Writing</h3>
              <p>
                The same five checks pointed at a draft you are about to publish, before anyone
                else reads it. In development.
              </p>
              <span className={styles.directionSoon}>Not yet available</span>
            </div>
          </div>
        </section>

        {/* ── What this is not ── */}
        <section className={shell.section}>
          <h2>What this is not</h2>
          <div className={shell.measure}>
            <p>
              Not media monitoring, not sentiment scoring, and not a volume dashboard. It does not
              tell you how many mentions you got or whether the tone was positive. It is a close
              read of a small number of articles about one story, and it answers a narrower
              question than a monitoring tool does.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={shell.cta}>
          <h2>Bring a story you already know well</h2>
          <p>
            The fastest way to judge this is on coverage you have already read closely. Bring one
            and we will go through what it finds.
          </p>
          <div className={shell.actions}>
          <a href="mailto:contact@tryneutraleye.com?subject=NeutralEye%20demo" className={shell.btn}>Book a demo</a>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}

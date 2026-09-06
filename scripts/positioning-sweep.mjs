#!/usr/bin/env node
/**
 * Positioning sweep.
 *
 * Written against the RULE, not against a list of phrases. The rule is:
 * framing analysis only, never place an outlet or article on a spectrum, never
 * score or rate one, never imply fact-checking, never advertise a route or
 * feature that does not exist.
 *
 * This replaces an earlier grep that tested for four marketing taglines
 * ("bias comparison|side-by-side bias|bias detection|detects bias"). That
 * pattern could not have found a Left-leaning / Right-leaning label, which is
 * the rule violation in its purest form, and it did not: /methodology carried a
 * full political spectrum while the sweep reported clean. A sweep that tests
 * for the phrases you already removed will always pass.
 *
 * Scope: user-visible copy. Source comments are stripped before matching, so a
 * comment may name what it is refusing to do. Everything else is fair game.
 *
 * Usage:  node scripts/positioning-sweep.mjs [--json]
 * Exit 1 on any live hit. Deferred items print but do not fail.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const CATEGORIES = [
  ["SPECTRUM PLACEMENT", /left[- ]leaning|right[- ]leaning|left of cent|right of cent|political spectrum|leans? (?:left|right)|centrist/i],
  ["SCORING / RATING", /confidence score|direction label|bias direction|\bscores? an outlet|\brates? (?:an )?outlet|pass\/fail|clean bill/i],
  ["BANNED TERM", /bias detection|detects? bias|bias comparison|bias checker|biased publications|bias signals?|bias level/i],
  ["FACT-CHECK IMPLIED", /\b(?:we|it|neutraleye) (?:fact[- ]checks?|verif(?:y|ies) (?:the )?(?:facts|claims))\b/i],
  ["DEAD ROUTE / FEATURE", /\/pricing|\/compare\b|pricing page|Pro plan|Compare Analyses|join the waitlist/i],
];

/* Copy that matches a pattern and is correct as written: the site disowning the
   thing by name. Matched as a substring of the line. */
const ALLOW = [
  "do not rate outlets or place them on a spectrum",
  "does not place them on a spectrum",
  "It does not rate outlets",
  "Nothing here rates an outlet",
  "No waitlist and no email capture",
  "There is no paid tier",
  "No payment processor is",
  "no payment provider, because NeutralEye is free",
  "not a value the analyzer can return",
  "on a political spectrum requires a fixed idea",
  "There is no left, centre, or right",
  "It is not a political placement",
  "there is no left, centre, or right result",
  "It never reads",
  // The changelog's standing correction has to name what it is correcting.
  "describe a direction label with left, centre and right values",
];

/* Known and deliberately not fixed. Printed every run so they stay visible,
   but they do not fail the sweep. Anything added here needs a reason and a
   matching entry in CLAUDE.md Known Issues. */
const DEFERRED = [
  {
    file: "src/app/changelog/page.js",
    reason: "Historical record. Entries are never edited to match current vocabulary; the standing correction note above the timeline carries the fix.",
  },
  {
    file: "src/app/analyze/page.js",
    line: 585,
    reason: "Live tool empty state. Changing it is a product change, not a copy fix. Deferred to the next product change.",
  },
];

const ROOTS = ["src/app", "src/components", "src/lib/content.js"];
const SKIP = /(?:\/api\/|__tests__|\.test\.)/;
const EXT = /\.(?:js|jsx|ts|tsx)$/;

/* Comments are source commentary, not copy. Stripped so a comment can explain
   what it refuses to do without tripping the sweep. Replaced with spaces so
   line numbers survive. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isFile()) {
    if (EXT.test(p) && !SKIP.test(p)) out.push(p);
    return out;
  }
  for (const e of readdirSync(p)) walk(join(p, e), out);
  return out;
}

function deferralFor(file, line) {
  return DEFERRED.find((d) => d.file === file && (d.line === undefined || d.line === line));
}

const files = ROOTS.flatMap((r) => walk(r));
const live = [];
const deferred = [];

for (const file of files.sort()) {
  const rel = relative(process.cwd(), file);
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    if (ALLOW.some((a) => line.includes(a))) return;
    for (const [category, re] of CATEGORIES) {
      const m = line.match(re);
      if (!m) continue;
      const hit = { category, file: rel, line: i + 1, term: m[0], text: line.trim().slice(0, 160) };
      const d = deferralFor(rel, i + 1);
      (d ? deferred : live).push(d ? { ...hit, reason: d.reason } : hit);
    }
  });
}

/* The changelog exemption is only honest while the correction note is actually
   on the page. If someone deletes the note, the exemption must stop applying. */
const changelog = readFileSync("src/app/changelog/page.js", "utf8");
const noteMissing = deferred.some((h) => h.file === "src/app/changelog/page.js")
  && !changelog.includes("historyNote");

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ filesScanned: files.length, live, deferred, noteMissing }, null, 2));
} else {
  for (const [cat] of CATEGORIES) {
    const group = live.filter((h) => h.category === cat);
    console.log(`\n=== ${cat}  (${group.length}) ===`);
    for (const h of group) console.log(`  ${h.file}:${h.line}  [${h.term}]\n      ${h.text}`);
  }
  if (deferred.length) {
    console.log(`\n=== KNOWN, DEFERRED  (${deferred.length}) ===`);
    for (const h of deferred) console.log(`  ${h.file}:${h.line}  [${h.term}]  ${h.reason}`);
  }
  console.log(`\n${live.length} live hit(s), ${deferred.length} deferred, across ${files.length} files.`);
  if (noteMissing) console.log("FAIL: changelog is exempt but its correction note is gone.");
  if (!live.length && !noteMissing) console.log("Clean.");
}

process.exit(live.length || noteMissing ? 1 : 0);

# Verify Loop — Design

**Date:** 2026-07-11
**Goal:** One command (`npm run verify`) that gives a fast, honest pass/fail signal after any code change, so changes are self-checked before being handed to the founder for review.

## Audit findings (verified by running each check)

| Check | State |
|-------|-------|
| Tests | Jest 30 + RTL, 7 suites / 71 tests, all passing. `src/lib/analysis.js` and the analyze route's AI-JSON normalization are untested. |
| TypeScript | `strict: true`, `tsc --noEmit` clean — but only `.ts`/`.tsx` files are checked (shadcn components). |
| ESLint | Flat config, `eslint-config-next/core-web-vitals`. 41 errors + 3 warnings: 37× `react/no-unescaped-entities` (noise), 4× `react-hooks/set-state-in-effect`, 2× `react-hooks/exhaustive-deps`. |
| Build | `npm run build` exits 0 locally (~1 min). CLAUDE.md's "local build fails on @next/swc" note is stale. |
| CI | None. No GitHub Actions. Vercel builds on deploy are the only implicit check. |

## Design

### 1. `npm run verify`
`typecheck && lint && test && build` — fail-fast, fastest first, build (~1 min) last.
New script `typecheck: tsc --noEmit --incremental false`.

### 2. Lint baseline (approved decision)
- `react/no-unescaped-entities`: **off** — apostrophes in JSX copy are fine; the rule is noise here.
- `react-hooks/set-state-in-effect`: **warn** with a TODO — the 4 occurrences need deliberate hook restructuring (behavior risk); deferred to a separate task, rule restored to error afterwards.
- Everything else unchanged. Verify fails on any lint *error*.

### 3. High-risk tests (small, targeted)
The named risks (quote exclusion, news/opinion classification, minimum bias threshold) live in the LLM prompt, so they get **prompt-contract tests**: mock the OpenAI client, capture the prompt `generateBiasAnalysis` builds, assert the load-bearing rules are present. Deterministic post-processing gets behavior tests.

- `src/lib/__tests__/analysis.test.js` — `buildHumanResult` (no-bias message, section assembly, confidence formatting), `contentTypeFromAiJson` (opinion/analysis pass through, everything else → news).
- `src/lib/__tests__/promptContract.test.js` — quote-attribution exclusion rule, content-type classification section, minimum-impact threshold rule, required JSON schema keys, source-domain exclusion line present only when a URL is passed, `response_format: json_object`.
- `src/lib/__tests__/normalizeAiResult.test.js` — full AI JSON → response shape (directionLabel, signed score, drivers, examples), `bias_level: "none"` → score 0 / "No significant bias detected", malformed JSON fallback, `driverLabelFromReason` mapping + title-case passthrough, `scoreFromBiasLevel` magnitudes and direction sign.

**Refactor required:** Next.js route files may only export HTTP handlers, so the normalization cluster in `src/app/api/analyze/route.js` (lines ~80–239: `standardizeOutput` … `parseAiResponse`) moves verbatim to `src/lib/normalizeAiResult.js`; the route imports `parseAiResponse` + `normalizeAiResult`. No behavior change.

### 4. Process rule
CLAUDE.md gains a "Verify loop" section: after any code change, run `npm run verify` and fix failures before presenting the change; only surface work once verify passes or when blocked on a user decision. Stale build note corrected. Rule also saved to Claude's persistent memory.

## Out of scope
GitHub Actions CI (Vercel deploy builds + local verify are enough pre-revenue), fixing the 4 hook lint findings, broadening tsconfig to check `.js` files.

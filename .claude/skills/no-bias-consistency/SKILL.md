---
name: no-bias-consistency
description: Background knowledge for keeping the 5 no-bias-result surfaces in sync in neutraleye-web. Triggers whenever bias_level "none" handling, buildDirectionLabel, isNoBiasRecord, or the no-bias confidence display changes.
user-invocable: false
---

When `bias_level === "none"` handling changes anywhere in this repo, all five surfaces below must stay consistent — showing "No significant bias detected" (not "No bias detected") and hiding or dashing out the confidence score. This rule and the exact surfaces are documented in `CLAUDE.md` under "No-Bias Result Consistency"; treat that section as the source of truth if it and this skill ever disagree.

Check all five before considering a no-bias-related change done:

1. **Extension API** — `src/app/api/extension/route.js`, `buildDirectionLabel`: must return `"No significant bias detected"`, never `"unknown"`.
2. **HistoryTable** — `src/components/HistoryTable/`, `isNoBiasRecord()`: must still catch `"unknown"`, empty, and `"no significant bias"`; confidence column shows `"—"`.
3. **Analyze page** — `src/app/analyze/page.js`: confidence section shows `"--"` with the no-bias-specific message instead of the score/bar.
4. **ResultsHeader** — `src/components/ResultsHeader/`: confidence ring and percentage are hidden entirely.
5. **Compare page** — `src/app/compare/page.js`: confidence shows `"—"` for no-bias items.

If a change only touches one of these five, flag to the user that the other four should be checked too, rather than assuming they're unaffected.

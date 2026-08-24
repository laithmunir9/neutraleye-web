---
name: no-bias-consistency
description: Background knowledge for keeping the 4 no-bias-result surfaces in sync in neutraleye-web. Triggers whenever bias_level "none" handling, buildDirectionLabel, isNoBiasRecord, or the no-bias confidence display changes.
user-invocable: false
---

When `bias_level === "none"` handling changes anywhere in this repo, all five surfaces below must stay consistent — showing "No significant bias detected" (not "No bias detected") and replacing the confidence score with "N/A". This rule and the exact surfaces are documented in `CLAUDE.md` under "No-Bias Result Consistency"; treat that section as the source of truth if it and this skill ever disagree.

The check itself lives in `src/lib/biasLevel.js` and keys off the `bias_level` enum, never display copy. If you find yourself substring-matching a rendered label, that is the bug.

Check all four before considering a no-bias-related change done:

1. **Extension API** — `src/app/api/extension/route.js`, `buildDirectionLabel`: must return `NO_BIAS_LABEL`, never `"unknown"`.
2. **HistoryTable** — `src/components/HistoryTable/`: uses the shared `isNoBiasRecord()`; confidence column shows `"N/A"`.
3. **Analyze page** — `src/app/analyze/page.js`: confidence section shows `"N/A"` with the no-bias-specific message instead of the score/bar.
4. **Compare page** — `src/app/compare/page.js`: uses the shared `isNoBiasRecord()`; confidence shows `"N/A"` for no-bias items.

If a change only touches one of these four, flag to the user that the other three should be checked too, rather than assuming they're unaffected.

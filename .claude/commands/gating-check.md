---
description: Check site copy against what actually exists in code — positioning vocabulary, gating state, and routes that still resolve
---

You're checking whether NeutralEye's public copy accurately reflects what the code actually does. Run this after editing gating logic, pricing/plan copy, the analyzer's output contract, or any marketing page.

## Steps

1. **Run the positioning sweep.** This is the gate, and it must run first:

   ```bash
   node scripts/positioning-sweep.mjs
   ```

   It exits non-zero on any live hit. It tests against the *rule* (never place an
   outlet or article on a spectrum, never score or rate one, never imply
   fact-checking, never advertise a route or feature that does not exist), not
   against a list of phrases. Do not replace it with a grep for specific wording:
   a sweep that tests for the phrases already removed will always pass. That is
   exactly how a full Left-leaning / Center / Right-leaning spectrum survived on
   `/methodology` while an earlier four-phrase grep reported clean.

   Anything under `KNOWN, DEFERRED` is a recorded exception with a reason and a
   matching entry in CLAUDE.md Known Issues. Read those every run. Do not add to
   that list to make the sweep pass.

2. **Check the analyzer's output contract against the copy.** Read the response
   schema in `src/lib/analysis.js` and confirm `/methodology`, `/faq`, and
   `/tools` describe the fields it actually returns. `bias_level` is an internal
   enum and must never appear in user-facing copy (`src/lib/biasLevel.js`).

3. **Check gating.** Grep for `useProAccess` and any related flags. For each
   feature they touch, note whether it is enforced, or effectively free
   (hardcoded false, unused, no gate). Compare against what the copy claims.

4. **Check routes named in copy still resolve.** Retired marketing paths
   (`/pricing`, `/compare`, `/extension`, `/support`, `/for-comms`) redirect.
   Any copy pointing a reader at one of them is a broken promise, including in
   `/terms` and `/privacy`.

5. **Check the legal pages against reality.** `/terms` and `/privacy` describe
   what is sold and what is processed. A claim there is a factual statement, not
   marketing. If there is no paid tier, neither page may describe one.

6. I'll also give you the current CWS listing text below (paste it in manually
   before running, since that lives outside this repo) — check it against the
   same findings.

CWS listing text:
$ARGUMENTS

## Scoping rule

**A sweep scoped to one file must be reported as scoped to one file.** Say what
was scanned in the same sentence as the result. "Clean" without a scope is not a
result. A previous sweep of `src/lib/content.js` alone was reported in a way that
read as site-wide, and the site was not swept for months afterward.

## Output

For each mismatch: where it is, what it claims, what the code actually does,
suggested copy fix. Flag-only, don't edit copy or code. If no mismatches: say so
plainly, and name what you scanned.

Also flag if the pages disagree with *each other*, independent of code state.

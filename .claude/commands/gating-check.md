---
description: Check pricing/FAQ copy against actual Pro-gating state in code, right after touching pricing or gating logic
---

You're checking whether NeutralEye's pricing page and FAQ copy accurately reflect what's actually gated in code. Run this right after editing anything related to `useProAccess`, feature gating, or the pricing page.

## Steps

1. Grep the repo for `useProAccess` and any related gating flags/hooks. For each feature they touch, note whether it's currently enforced as Pro-only, or effectively free (hardcoded false, unused, no gate present).

2. Find the pricing page and FAQ copy in this repo. For each feature mentioned as "Pro" or "Coming Soon," compare against what step 1 found.

3. Flag any mismatch in either direction: something described as Pro that's actually free, or something described as free/available that's actually gated.

4. I'll also give you the current CWS listing text below (paste it in manually before running, since that lives outside this repo) — check it against the same gating findings.

CWS listing text:
$ARGUMENTS

## Output

For each mismatch: where it is, what it claims, what the code actually does, suggested copy fix. Flag-only, don't edit copy or code. If no mismatches: say so plainly.

Also flag if this same check reveals the pricing page and FAQ disagree with *each other*, independent of code state.

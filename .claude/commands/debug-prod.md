---
description: Triage a production Sentry issue against Vercel deploy history, locate the code, and propose a fix. Never auto-fixes auth, billing, or RLS.
---

You're triaging a production error on NeutralEye. Work from evidence, not from what the stack trace looks like it probably means. If the trail runs cold at any step, say so and stop rather than inventing a cause.

Sentry org is `neutraleye`, project is `neutraleye-web`. Vercel project is `neutraleye-web` (ids in `.vercel/project.json`).

Sentry issue URL (or issue id / short-id):
$ARGUMENTS

## Steps

1. **Resolve the issue.** If an issue URL or id was given above, pull it. If nothing was given, list recent unresolved issues for `neutraleye-web`, show me the top few with counts and first-seen, and ask which one before going further. Don't pick for me.

2. **Get the facts from Sentry.** Error type and message, stack trace, first seen, last seen, event count, affected users, release/commit if tagged, and whether it's still occurring. Note the runtime (browser, server route, edge) since it changes where to look.

3. **Cross-reference Vercel deploy history.** List production deployments and find which one was live when the issue was first seen. Name the suspect deploy and its commit sha. Then check whether the error actually starts at that boundary or predates it. An error that first appeared mid-deploy-window is a different story from one that started the minute a deploy went live, and the difference decides whether the deploy is the cause or a coincidence. State which one it is.

4. **Locate the code.** Map the stack trace to real files and lines in this repo. Read the code and the diff of the suspect deploy (`git log`/`git diff` against the sha from step 3). Quote the specific lines you believe are responsible.

5. **Classify blast radius before proposing anything.** Decide whether the fix would touch a guarded area (see Guardrails). This determines what you're allowed to do next, so do it explicitly and state the verdict.

6. **Propose the fix.** Explain the root cause in a sentence or two, then the change you'd make. If you cannot get to a confident root cause, say that plainly and list what you'd need (a repro, more events, a log query) instead of shipping a guess.

7. **Apply, only if allowed.** For non-guarded code, apply the fix once I confirm, then run `npm run verify` and report the real result. For guarded code, stop at the proposal. Never deploy, never push, never commit unless I ask.

## Guardrails

**Never apply a fix on your own to auth, billing, or RLS.** Investigate them fully, read anything you need, and write up exactly what you'd change, but leave the edit to me. These are the paths that count:

- **Auth** — `src/app/api/extension-auth/`, `src/app/api/extension-refresh/`, `src/app/auth/`, `src/app/login/`, `src/app/reset-password/`, and in `src/lib/supabase/`: `AuthProvider.js`, `authErrors.js`, `client.js`, `server.js`
- **Billing / gating** — `src/lib/supabase/useProAccess.js`, `src/app/pricing/`, and anything Stripe-related once it exists
- **RLS / data access** — `supabase/migrations/`, `src/lib/supabase/analyses.js`, `src/app/api/waitlist/`, and any change to a Supabase policy or a `SECURITY DEFINER` function

Also treat as guarded, for the same reason: `src/lib/dailyLimit.js` and `src/lib/ratelimit.js`. They're the spend caps in front of OpenAI, so a wrong "fix" there costs real money.

If a fix spans guarded and non-guarded code, the whole fix is guarded. Don't split it up and apply the safe half.

Two things that are never in scope regardless: deploying or promoting anything on Vercel, and touching secrets or environment variables. Report what needs changing and let me do it.

## Output

- **Issue** — what's failing, where, how often, since when, still firing or not
- **Deploy correlation** — the suspect deploy and commit, and whether the timing actually implicates it or just overlaps
- **Root cause** — the specific lines, quoted, and why they fail. Say "not established" if it isn't.
- **Fix** — what you'd change and why that addresses the cause rather than the symptom
- **Guarded?** — yes/no, which area, and therefore whether you're applying or stopping
- **Verification** — for applied fixes only, the actual `npm run verify` result

If the issue turns out to be noise (a bot, a stale cached bundle, an already-fixed error still showing old events), say so and recommend resolving or ignoring it in Sentry rather than manufacturing a code change.

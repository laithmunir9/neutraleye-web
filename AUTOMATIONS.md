# NeutralEye Automations Index

Quick reference for everything currently set up. Update this file whenever something new is added or changed.

| Name | Lives in | Trigger | What it does |
|---|---|---|---|
| Verify loop (web) | `neutraleye-web/CLAUDE.md`, runs via `npm run verify` | Manual, before commits/deploys | typecheck → lint → test → build |
| Verify loop (extension) | `neutraleye-extension/CLAUDE.md` | Manual, before commits/deploys | Lint/test + manifest/asset sanity check |
| Supabase keepalive | `neutraleye-web/src/app/api/keepalive/route.ts` | Automatic, daily 06:00 UTC via Vercel Cron (`vercel.json`) | Keeps the free-tier Supabase project from auto-pausing after 7 days of inactivity. The only scheduled job for this project |
| Positioning sweep | `neutraleye-web/scripts/positioning-sweep.mjs` | Manual, `node scripts/positioning-sweep.mjs` after copy changes | Framing-only rule across `src/app`, `src/components` and the extension's files. Exits non-zero on a live hit |
| debug-prod | `neutraleye-web/.claude/commands/debug-prod.md` | Manual, `/debug-prod [sentry-issue-url]`; with no URL it lists unresolved issues and asks which one | Pulls a Sentry issue, cross-references Vercel deploy history to find the deploy that introduced it, locates the code, proposes a root-cause fix. Applies only after confirmation, and never to guarded areas: auth, billing/gating, RLS, plus the OpenAI spend caps (`dailyLimit.js`, `ratelimit.js`). Runs `npm run verify` after applying. Never deploys, commits, or touches secrets. |
| gating-check | `neutraleye-web/.claude/commands/gating-check.md` | Manual, `/gating-check [cws-listing-text]` | **Stale:** compares `useProAccess` gating against the pricing page and FAQ, both removed on 3 October 2026, and nothing imports `useProAccess` now. Only the CWS-listing half still has something to check. Rewrite or delete it before relying on it. |

## Notes

- **There are no scheduled routines.** As of 3 October 2026 the founder has deleted every Cowork routine (the weekly ops-check and Gmail digest on 2 October, the monthly positioning check on 3 October). The only scheduled jobs anywhere are Supabase keepalives: this project's Vercel Cron above, and one for a separate project outside this repo. Nothing watches Sentry, the Supabase advisors, the production endpoints or the store listing automatically; checking them is manual.
- All Claude Code commands are flag-only or fix-with-guardrails by default. None of them should expand scope (new hooks, new commands, new files) without explicit confirmation first.
- debug-prod guards more than the auth/billing/RLS trio its name suggests: `dailyLimit.js` and `ratelimit.js` are in the same no-auto-fix bucket because they cap OpenAI spend, so a wrong fix there costs money rather than just breaking a page.
- If something in this table stops matching reality, fix the table, not just your memory of it.

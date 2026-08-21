# NeutralEye Automations Index

Quick reference for everything currently set up. Update this file whenever something new is added or changed.

| Name | Lives in | Trigger | What it does |
|---|---|---|---|
| Verify loop (web) | `neutraleye-web/CLAUDE.md`, runs via `npm run verify` | Manual, before commits/deploys | typecheck → lint → test → build |
| Verify loop (extension) | `neutraleye-extension/CLAUDE.md` | Manual, before commits/deploys | Lint/test + manifest/asset sanity check |
| Weekly ops-check | Cowork scheduled routine | Automatic, Mondays 06:00 UTC | Supabase advisor diff, Sentry new-error-signature detection, 8 production endpoint checks, waitlist-growth anomaly detection |
| Positioning consistency check | Cowork scheduled routine (`neutraleye-positioning-check`) | Automatic, 1st of month 9:00 AM, or manual "Run now" | Framing-not-bias language and em-dash check across CWS listing, pricing page, FAQ. Flag-only. |
| debug-prod | `neutraleye-web/.claude/commands/debug-prod.md` | Manual, `/debug-prod [sentry-issue-url]`; with no URL it lists unresolved issues and asks which one | Pulls a Sentry issue, cross-references Vercel deploy history to find the deploy that introduced it, locates the code, proposes a root-cause fix. Applies only after confirmation, and never to guarded areas: auth, billing/gating, RLS, plus the OpenAI spend caps (`dailyLimit.js`, `ratelimit.js`). Runs `npm run verify` after applying. Never deploys, commits, or touches secrets. |
| gating-check | `neutraleye-web/.claude/commands/gating-check.md` | Manual, `/gating-check [cws-listing-text]`, run right after touching pricing/gating code | Compares actual `useProAccess` gating state in code against pricing page, FAQ, and CWS listing copy. Flag-only. |

## Notes

- Positioning-consistency-check (Cowork) and gating-check (Claude Code) split what was originally one idea: Cowork handles the external-copy-only half (no code access needed), gating-check handles the code-vs-copy half (needs repo access, which Claude Code already has). Don't merge them back together or give Cowork a GitHub connector, that overlap was intentionally avoided.
- All Claude Code commands are flag-only or fix-with-guardrails by default. None of them should expand scope (new hooks, new commands, new files) without explicit confirmation first.
- debug-prod guards more than the auth/billing/RLS trio its name suggests: `dailyLimit.js` and `ratelimit.js` are in the same no-auto-fix bucket because they cap OpenAI spend, so a wrong fix there costs money rather than just breaking a page.
- If something in this table stops matching reality, fix the table, not just your memory of it.

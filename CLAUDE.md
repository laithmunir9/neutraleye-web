# CLAUDE.md — NeutralEye Web

This file is the source of truth for Claude Code when working on the NeutralEye web project.
Read this before touching any code.

---

## Project Overview

NeutralEye is a consumer framing-analysis tool. The homepage is the product: a two-mode toggle, **Read** and **Write**, over one input slot. Read is the live analyzer: one box takes a link or the article text (a single web address is fetched, anything else is read as text) and returns the framing analysis with marked passages. Write is the writing companion, not built yet; its tab shows a short description and an early-access email capture.

The site is the homepage plus legal pages and auth. There are no marketing or informational pages; every retired path permanently redirects to `/` (`RETIRED_PATHS` in `next.config.mjs`).

There is no separate backend server. All backend logic lives as Next.js API Routes inside this repo, deployed on Vercel.

**Companion repo:** `neutraleye-extension` — Chrome extension frontend that calls this repo's API routes.

**Production domain:** `tryneutraleye.com` — purchased and connected to Vercel.

---

## Infrastructure

| Service        | Location                          | Notes                                                        |
|----------------|-----------------------------------|--------------------------------------------------------------|
| Frontend       | `neutraleye-web` → Vercel         | Next.js 16, React 19. Vercel team `laithmunir9s-projects`    |
| API Routes     | `src/app/api/` → Vercel           | All backend logic lives here, no separate server             |
| Database       | Supabase                          | Auth + analyses + daily_usage tables, RLS active             |
| Rate limiting  | Upstash Redis                     | Sliding window via `@upstash/ratelimit`; falls back to in-memory locally |
| Email (send)   | Resend                            | Supabase Auth email via custom SMTP only — the support form is retired |
| Email (receive)| Cloudflare Email Routing          | `contact@tryneutraleye.com` forwards to the founder's Gmail  |
| Payments       | Stripe                            | Not yet set up                                               |
| DNS / registrar| Cloudflare                        | Registrar and DNS for `tryneutraleye.com`; site is proxied (orange cloud) in front of Vercel |
| Monitoring     | Sentry                            | Org `laith-munir`, project `neutraleye-web` (moved 2026-10-01) |
| Analytics      | Vercel Web Analytics              | `<Analytics />` in layout.js — enable in Vercel dashboard → project → Analytics |

### Account ownership (migrated 2026-10-01/02)

Every service now sits under the founder's `laithmunir9` identity: GitHub (`laithmunir9/neutraleye-web`), Vercel, Sentry, Supabase (org "laithmunir9's Org", project `hkxtymihsyegrmqnvdvn`), Resend, Upstash, OpenAI, Cloudflare, Chrome Web Store, Google Search Console. The old `biaschecker.app@gmail.com` identity, the old `biascheckerapp-svg` GitHub account, and the old Vercel/Sentry accounts are retired — never point anything at them. The weekly ops-check and Gmail-digest routines that referenced them were deleted on 2026-10-02.

**Canonical host is the apex `tryneutraleye.com`.** `next.config.mjs` redirects `www` → apex. In Vercel, the apex domain must stay connected to Production with **no** redirect. On 2026-10-02 the domain was re-added with Vercel's default (apex → www), which combined with the code's www → apex redirect produced a redirect loop and took the site down. If you touch domain settings in Vercel, keep the apex un-redirected.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** JavaScript (`.js`) for pages/API routes; TypeScript (`.tsx`) for shadcn/ui components
- **Styling:** Tailwind CSS v4, CSS Modules (`.module.css`) per component
- **Fonts:** Geist Sans + Geist Mono via `geist` package, applied in `layout.js`
- **UI Components:** shadcn/ui (`src/components/ui/`) + Radix UI primitives
- **Animation:** Framer Motion
- **Theme:** `next-themes` via `ThemeProvider`
- **AI:** OpenAI SDK (`openai`) — `gpt-4o` for analysis, `gpt-4o-mini` for article detection
- **Scraping:** `cheerio` for URL article extraction
- **Database:** `@supabase/ssr` + `@supabase/supabase-js`
- **Rate limiting:** `@upstash/ratelimit` + `@upstash/redis` — persistent sliding window, falls back to in-memory when env vars absent
- **Error monitoring:** `@sentry/nextjs` — logs enabled, traces sampled at 10%, `sendDefaultPii: false` (no user IPs), session replay disabled (privacy)
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint (Next.js config)

---

## Project Structure

```
src/
  app/
    page.js                 # Homepage = the product. Server component: reads ?mode, ?id and ?auth/?notice; renders SiteShell (with the Newsprint backdrop) + Workbench
    login/page.js           # Redirect only: sign-in is an overlay. Maps ?mode/?reset/?error to /?auth=...&notice=... (email links, old bookmarks)
    signup/page.js          # Redirects to /?auth=signup
    reset-password/page.js  # Password reset; Supabase recovery redirect lands here
    auth/callback/route.js  # Supabase code exchange; ?next defaults to /; failure opens the overlay with notice=auth_failed
    privacy/, terms/        # Legal pages (legal.module.css)
    extension-privacy/      # Extension privacy policy. The Chrome Web Store listing links here; keep it
    not-found.js            # 404, links home
    sitemap.js              # Only /, /privacy, /terms, /extension-privacy
    opengraph-image.js      # Social preview
    layout.js               # Root layout: Source Serif 4, ThemeProvider, AuthProvider, Analytics
    globals.css             # Tokens (--fc-*, --control-radius) and base styles

    api/                    # Unchanged by the restructure; the extension calls /api/extension and its auth routes
      analyze/route.js      # Web framing analysis (text; URL still supported by the API)
      extension/route.js    # Extension analysis
      extension-auth/route.js, extension-refresh/route.js
      usage/route.js        # Daily usage check
      waitlist/route.js     # Early-access signups; used by Write mode with source "write"
      support/route.js      # UNUSED: nothing calls it since the support page was removed. Kept, flagged
      keepalive/route.ts    # Vercel cron, keeps Supabase awake

  components/
    SiteShell/              # The whole chrome: wordmark, Sign in (opens AuthDialog) or avatar (one-item Sign out menu), Privacy and Terms.
                            # `backdrop` renders behind it; `initialAuth` opens the overlay on arrival; `hideAccount` for /reset-password
    AuthDialog/             # Sign in / create account / forgot password as a native <dialog> overlay on the current page. X top left,
                            # backdrop click and Escape close it. No separate page. Its CSS module also styles /reset-password's form
    Newsprint/              # Homepage backdrop: faint drifting columns of invented, neutral local-news copy (copy.js) in the side
                            # margins, where loaded phrases get the annotation mark drawn on and off. Desktop only; phones get the paper tone
                            # Each margin shows only whole columns (CSS grid auto-fill; extras wrap off-screen), never a half-faded one
    Workbench/
      Workbench.js          # The Read/Write tablist and the slot. All modes stay mounted (inactive ones hidden),
                            # so pasted text survives a switch. Switching rewrites ?mode with history.replaceState, no request
      modes.js              # Mode registry. When the writing companion ships, replacing WaitlistMode on the "write"
                            # entry is the whole change
      ReadMode.js           # The analyzer: link-or-text input (detectUrl), validation, loading stages, errors, saved-result loading (?id=)
      ReadResult.js         # Result rendering: finding, summary, signals, marked passages, disclosures
      WaitlistMode.js       # Write placeholder: "It will not write for you." + email capture -> /api/waitlist
    QuoteEvidence/          # A marked passage: signal label, the annotation mark, the note under it. `sweep` draws the mark in once
    Annotation/             # Canonical definition of the mark (cited by docs/visual-language.md). Not imported by any page now
    ui/                     # shadcn/ui (theme-provider in use; avatar.tsx and button.tsx were already unused)

  lib/                      # api.js, analysis.js (prompts), biasLevel.js, storage.js, ratelimit.js, dailyLimit.js, supabase/
```

---

## API Routes

### `POST /api/analyze` — Web bias analysis
- Accepts `text` or `url` (URL mode requires `x-client: web` header)
- Rate limit: 5 req/min per IP (env-configurable via `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX`) — backed by Upstash Redis (`ne:web` key prefix)
- Daily cap (`DAILY_ANALYSIS_LIMIT`, default 10, shared logic in `src/lib/dailyLimit.js`): signed-in users (cookie session) checked against `daily_usage` and incremented server-side after success; anonymous users capped per IP via Upstash rolling 24h window (`ne:day` prefix). Exceeding returns 429 with code `DAILY_LIMIT_REACHED`.
- Returns structured JSON: `{ directionLabel, score, confidence, drivers, summary, examples, sources, recommendations, result, json, extractedText }`
- In-memory cache keyed by text hash or URL
- Kill switch: `NEUTRALEYE_KILL_SWITCH=true` → 503
- Source domain exclusion: when a URL is submitted, the source domain is injected into the prompt so the AI never suggests the same outlet as the article being analyzed

### `POST /api/extension` — Extension bias analysis
- Accepts `text` (plain), `url`, `headline` from extension popup
- `headline` is prepended to the analyzed text via `composeAnalysisText()` (`src/lib/analysis.js`) — the extension's `content.js` extracts `<p>` only, so the headline never appears in `text`, whereas the web's `extractArticleTextFromUrl` pulls `h1,h2,h3,p,li` and already opens with the `<h1>`. Without this the extension analyzed articles blind to their headline. Applied only when the client sent `text` directly; the URL branch already has the `<h1>` and would otherwise double it.
- Rate limit: 5 req/min per IP (env-configurable via `EXT_RATE_LIMIT_WINDOW_MS` / `EXT_RATE_LIMIT_MAX`) — backed by Upstash Redis (`ne:ext` key prefix), applies to ALL requests including authenticated
- Daily cap (`DAILY_ANALYSIS_LIMIT`, default 10): authenticated users via `daily_usage` table; anonymous users per IP via Upstash rolling 24h window. Enforced server-side before any OpenAI call. Returned as HTTP 200 with a friendly `result` message (+ `code: "DAILY_LIMIT_REACHED"`, `limited: true`) so the currently shipped popup renders it correctly.
- Auth: `Authorization: Bearer <token>` — resolves user, passes token through to Supabase client so RLS works
- Returns `{ result: "<markdown>", saved: boolean, tokenExpired: boolean }` — `tokenExpired: true` signals the extension to clear its stored token and force re-login
- Authenticated requests always bypass the in-memory cache so the Supabase save always runs
- Saves to `analyses` with `request_meta: { source: "extension", biasLevel, contentType }` and `direction_label` built as `"${TitleCase(bias_level)} framing ${direction}"` (see Measurement fields below)
- CORS: accepts any `chrome-extension://` origin — the extension ID differs between unpacked and published builds; rate limiting already guards the endpoint
- Source domain exclusion: same as `/api/analyze` — url is passed through to exclude the source outlet from suggestions

### `POST /api/extension-auth` — Extension login
- Accepts `{ email, password }` → Supabase `signInWithPassword()`
- Returns `{ accessToken, refreshToken, email, expiresAt }`
- Sign up is website-only; this endpoint is login only

### `POST /api/extension-refresh` — Extension token refresh
- Accepts `{ refreshToken }` → Supabase `auth.refreshSession()`
- Returns `{ accessToken, refreshToken, email, expiresAt }` or 401 if the refresh token is invalid/expired
- Called silently by the extension when the access token is within 5 minutes of expiry (`expiresAt` is a Unix timestamp in seconds)

### `GET /api/usage` — Check daily usage (authenticated)
- Returns `{ count, remaining, limited }` computed against `DAILY_ANALYSIS_LIMIT`
### `POST /api/usage` — Increment daily usage (authenticated)
- Legacy: the web frontend no longer calls this — `/api/analyze` increments server-side and `useAnalysisLimit.increment()` just refetches GET

### `POST /api/support` — Contact form (retired, dead code)
- `/support` permanently redirects to `/faq` and nothing in the app calls this route anymore.
- `RESEND_API_KEY` is deliberately **not** set in Vercel, so the route returns 503 `Support email is temporarily unavailable.` Do not treat that as an outage, and do not add the key back to "fix" it.
- If the contact form is ever revived: accepts `{ name, email, subject, message }`, sends via Resend to `contact@tryneutraleye.com` with sender as `replyTo`, validates length limits (name: 100, message: 5000).

---

## No-Bias Result Consistency

When the model returns `bias_level === "none"`, every surface must show `NO_BIAS_LABEL` ("No significant framing detected") and replace the confidence score with "N/A".

**Never decide this by matching display copy.** `src/lib/biasLevel.js` is the single source of truth: `isNoBiasRecord()` keys off the `bias_level` enum stored in `request_meta`, and consults a label only for pre-rename rows that have no enum. All display strings live in that module too, so a copy change can never break the check.

- **Extension API** (`buildDirectionLabel`): returns `NO_BIAS_LABEL` — not `"unknown"`
- **Homepage Read result** (`ReadResult.js`): confidence section shows `"N/A"` with a no-bias-specific message instead of the score/bar

---

## Supabase

**Project:** `hkxtymihsyegrmqnvdvn.supabase.co` (matches `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`).

**Tables:**
- `analyses` — user analysis history (`id`, `user_id`, `created_at`, `input_type`, `url`, `title`, `direction`, `direction_label`, `confidence`, `score`, `summary`, `drivers`, `examples`, `sources`, `recommendations`, `request_meta`)
  - `request_meta` is a JSON column. Both routes tag saves: extension sets `{ source: "extension" }`, website sets `{ source: "website" }`. (The history page that displayed these was removed on 3 October 2026; the tag still records where a row came from.)
  - **Measurement fields — `biasLevel` and `contentType`.** Every save also records the model's raw `bias_level` and `content_type` enums, via `analysisMetaFields()` in `src/lib/analysisMeta.js`. Both paths use that one helper so the key names stay identical and a single query covers both: the extension route spreads it into `request_meta` server-side; the web path carries it through `normalizeResponse` in `src/lib/api.js` (the web save is client-side, and `analysisToRow` has no column for either field, so `request_meta` is the only way they persist).
    - **Deliberately not normalized.** `contentTypeFromAiJson` (`analysis.js`) and `normalizeContentType` (`api.js`) both coerce anything unrecognized to `"news"` — correct for display, fatal here, since a missing value would become indistinguishable from the model actually saying "news". Absent logs as `null`. `analysisMeta.test.js` pins this; do not "simplify" it by reusing those normalizers.
    - Rows saved before 2026-08-25 have neither key and come back `null`. Exclude them (`where request_meta->>'biasLevel' is not null`) rather than letting them read as a category.
    - **Prompt wording changed 3 October 2026** (reader-facing vocabulary only; no analysis rule, threshold or schema key changed). The output instructions now speak in framing terms, which could still nudge `bias_level` rates, so compare rows before and after that date separately rather than pooling them.
    - Live since 2026-08-25, verified end-to-end on both paths. Purpose: establish whether the high `bias_level: "none"` rate is real, and which of the prompt's five one-directional suppression rules causes it, **before** any prompt rule is changed. For `none` rows, `content_type` plus the already-persisted `confidence` narrows it: `opinion`/`analysis` → content-type relaxation; `news` + confidence < 0.4 → weak-or-ambiguous clause; `news` + confidence >= 0.4 → minimum-impact threshold, by elimination. Quote exclusion stays invisible — it shrinks the evidence pool silently and surfaces as one of the others.
  - `examples` stores `[{ quote, label, explanation, highlights }]` for website saves; `[{ quote, why }]` for extension saves.
- `daily_usage` — daily request count (`user_id`, `usage_date`, `count`)
- `waitlist` — email waitlist (`id`, `email` unique, `created_at`, `source`). No `user_id`, signups are anonymous. `source` says which list: `pro` for every row from the retired Pro form on `/pricing`, `write` for Write-mode early access on the homepage (`WaitlistMode.js` → `POST /api/waitlist` → `join_waitlist(p_email, p_source)`). The route allowlists sources. Email stays unique, so an address already on the Pro list keeps `pro`. Migration: `supabase/migrations/20261003000000_waitlist_source.sql`, applied to production 3 October 2026 and verified as `anon` inside a rolled-back transaction. The table held 0 rows at the time, so the `pro` backfill touched nothing.

**Auth:** Email + password only. Sign up on website only; extension supports sign in only.

**Password reset:** Uses Supabase `resetPasswordForEmail` with `redirectTo: /auth/callback?next=/reset-password`. The existing `/auth/callback` route handles the code exchange; `/reset-password` calls `updateUser({ password })`.

**Auth email:** Supabase Auth already sends through **custom SMTP wired to Resend**. Verified 2026-08-20 from the Resend sent log, not inferred from docs. Sender is `"NeutralEye" <contact@tryneutraleye.com>`; domain `tryneutraleye.com` is verified in `us-east-1` with **sending enabled and receiving disabled** in Resend. Replies to `contact@` do arrive: since 2026-10-02 Cloudflare Email Routing forwards `contact@tryneutraleye.com` to the founder's Gmail (Google Workspace was cancelled the same day). Only `contact@` has a rule; the catch-all is disabled, so mail to any other address on the domain is not delivered. Branded HTML for Confirm signup and Reset password lives in `supabase/email-templates/`. **Both are applied and live in production, verified 2026-08-21** by fetching the actual sent HTML from the Resend log for a real signup and a real reset and diffing it against these files. Those files remain the source of truth, but they are applied by hand in the dashboard (Auth → Email Templates); no migration or MCP tool can push them, so any edit to these files must be re-pasted there or production keeps sending the old version. Only those two flows are in use: magic link, change email, and invite are not.

**Email OTP expiry is 3600 seconds (1 hour)**, confirmed from the dashboard 2026-08-20. It covers both the signup confirmation link and the password recovery link, and both templates state the hour explicitly.

**Two different email limits, do not conflate them:**
- **Per address, 60 seconds** (`smtp_max_frequency`). Retrying signup inside that window returns 429 `over_email_send_rate_limit` carrying "For security purposes, you can only request this after 56 seconds." This is the limit `SIGNUP_RESEND_WAIT_MESSAGE` is worded for, which is why it says "about a minute".
- **Per project, 30 emails per hour** (dashboard: Auth → Rate Limits). A ceiling across all addresses, independent of the 60s per-address interval.

Neither is an SMTP-provider limit, so switching email provider moves neither one. An earlier assumption that leaving Supabase's built-in sender would relax these was wrong on both counts.

**RLS:** Enabled on all three tables. `analyses`/`daily_usage` policies: users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`) — migration SQL at `supabase/migrations/20260601000000_rls_policies.sql`. `waitlist` has **no** anon INSERT policy at all — inserts go only through `public.join_waitlist(p_email text, p_source text default null)`, a `SECURITY DEFINER` function (validates email format, `ON CONFLICT DO NOTHING` for dedup) called via `supabase.rpc("join_waitlist", ...)` from `/api/waitlist/route.js`. This gives that one public, unauthenticated write path a privileged route without needing a service-role key — migration SQL at `supabase/migrations/20260727000000_waitlist_rls_tighten.sql`. (Fixed 2026-07-27: the previous `waitlist` INSERT policy was `WITH CHECK (true)`, letting any unauthenticated caller insert arbitrary rows directly — the weekly ops-check flagged it three times before this was closed.)
  - **Expected advisories, not regressions:** `get_advisors` (security) now shows `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` for `join_waitlist`. That's inherent to this pattern — a `SECURITY DEFINER` function callable by `anon`/`authenticated` is exactly the intended design for a public signup RPC without a service-role key — and does not need fixing. Don't let these two read as new problems the next time advisors are run. `rls_policy_always_true` on `waitlist` was the actual bug; if that specific one ever reappears, that's the one to investigate.

**Client keys:** Publishable key only — no service role key. RLS must be correctly configured in Supabase dashboard. `join_waitlist` (see above) is how `waitlist` gets a privileged write path without introducing one.

**Important:** The extension API route passes the Bearer token as a global `Authorization` header when creating the Supabase client, so `auth.uid()` resolves correctly for RLS. Do not call `makeSupabase()` without the token for authenticated writes.

---

## Pro Plan Gating

Pro features are gated via `useProAccess` (`src/lib/supabase/useProAccess.js`). Currently `isPro` is hardcoded to `false` — no one has Pro access until Stripe is wired up.

**Currently gated features:** none. `/compare` and `/pricing` are retired and redirect to `/`, so nothing imports `useProAccess` today. It is kept as the hook to wire when Stripe lands.

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

OPENAI_WEBSITE_API_KEY=      # Used by /api/analyze (falls back to OPENAI_API_KEY)
OPENAI_EXTENSION_API_KEY=    # Used by /api/extension (falls back to OPENAI_API_KEY)
OPENAI_API_KEY=              # Fallback for both routes

AI_ANALYSIS_ENABLED=true
NEUTRALEYE_KILL_SWITCH=false

# Daily analysis cap — per signed-in user (daily_usage) and per anonymous IP (Upstash)
DAILY_ANALYSIS_LIMIT=10

# Web analyze rate limit
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5

# Extension rate limit (falls back to web vars if not set)
EXT_RATE_LIMIT_WINDOW_MS=60000
EXT_RATE_LIMIT_MAX=5

# Upstash Redis — rate limiting (omit in local dev to fall back to in-memory)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend — only used by the retired /api/support route. Intentionally unset in Vercel.
RESEND_API_KEY=

# Sentry — error monitoring (set by Sentry wizard, also add to Vercel)
SENTRY_AUTH_TOKEN=
```

**Note:** Vercel env vars marked Sensitive cannot be pulled via `vercel env pull`. Add `OPENAI_WEBSITE_API_KEY` and `OPENAI_EXTENSION_API_KEY` to `.env.local` manually by creating new keys in the OpenAI dashboard, then updating both `.env.local` and Vercel.

---

## Dev Commands

```bash
npm run dev         # Start dev server (localhost:3000)
npm run build       # Production build
npm run start       # Start production server
npm run lint        # ESLint
npm run test        # Jest tests
npm run typecheck   # tsc --noEmit (checks .ts/.tsx only — see Verify Loop)
npm run verify      # typecheck && lint && test && build, fail-fast in that order
```

`npm run build` works fine locally (~1 min) — an earlier note here claiming it failed due to missing `@next/swc` bindings was stale.

---

## Verify Loop

There is no CI (no GitHub Actions) — `npm run verify` is the whole safety net, and Vercel's deploy build is the only other implicit check.

**After making any code change, run `npm run verify` and fix whatever it flags before reporting the change as done.** Only surface the work once verify passes, or if stuck and a decision from the user is needed. This is a solo pre-revenue project — the goal is a fast, honest signal, not enterprise-grade CI.

`npm run verify` runs, in order (fastest first, build last since it's the slowest at ~1 min): `typecheck && lint && test && build`.

- **Typecheck** only covers `.ts`/`.tsx` files (tsconfig `include`) — the API routes and most components are `.js` and aren't type-checked. This is a known gap, not a bug.
- **Lint baseline — 1 rule relaxed, everything else at its default (verify fails on any lint error):**
  - `react/no-unescaped-entities`: **off**. Cosmetic noise only — 37 hits, all apostrophes/quotes in JSX marketing copy, not real bugs.
  - `react-hooks/set-state-in-effect` was briefly downgraded to `warn` for 4 occurrences, then fixed and restored to its default `error` on 2026-07-12 — see the "Adjusting state without an effect" patterns below if this comes up again.
- **Tests** cover the highest-risk logic: the analysis pipeline's prompt contract (`promptContract.test.js`), AI-JSON → response-shape normalization (`normalizeAiResult.test.js`), and human-readable result building (`analysis.test.js`) — see Testing below.

---

## Confirm a Check Can Fail Before Trusting It

**A check that cannot return a fail is worse than no check, because it produces
false confidence.** Before reporting any verification as passed, establish that
it was capable of failing. This is a standing rule, not advice.

Three times this has produced a green result that meant nothing:

- A grep for four marketing taglines reported the site clean while `/methodology`
  carried a full political spectrum. The pattern could not match the violation.
- A `getBoundingClientRect()` overflow check reported zero offenders on a page
  with photographic evidence of glyph collision. Boxes stayed inside the
  viewport while the text spilled; only `scrollWidth > clientWidth` sees it.
- Four widths of overflow checks came back clean against a stale build. `npm run
  start` had failed with `EADDRINUSE` and an orphaned `next-server` was still
  serving the pre-change code.

How to satisfy the rule:

- **Sweeps and pattern checks:** run the pattern against a known violation and
  confirm it fires, before trusting a clean result. `scripts/positioning-sweep.mjs`
  does this to itself: every category carries a fixture it must catch and must
  not flag known-good copy, and the script exits 2 rather than reporting clean if
  a pattern has been edited into uselessness.
- **Rendered and browser checks:** confirm the server is serving the current
  build before measuring. Assert on something the change actually altered. Byte-
  identical numbers across an edit are the tell, not a reassurance.
- **Tests:** a new test should be seen failing against the unfixed code at least
  once.

**Layout height projections have been optimistic three times in a row, in the
same direction.** A pipeline section projected at 254 words to about 40 landed at
241. An FAQ conversion projected to land "about the height of the collapsed page"
came in 682px taller. A marginalia pass projected to cut the empty column
substantially moved it 78% to 68%. The misses share a cause: estimating the
content and forgetting the container, section padding, heading blocks, and the
ragged bottoms that `break-inside: avoid` produces. Treat any layout projection
as an estimate until it is measured on the built page, say so when giving one,
and report the measured number even when it contradicts what was promised.

---

## Positioning Sweep

`node scripts/positioning-sweep.mjs` checks public copy against the positioning
rule: framing analysis only, never place an outlet or article on a spectrum,
never score or rate one, never imply fact-checking, never advertise a route or
feature that does not exist. It exits non-zero on a live hit.

**No named lobbying or advocacy organisations in demo material.** Demo stories
have to be politically neutral so a prospect reacts to the tool rather than the
topic. Named outlets and named candidates are the subject of a coverage report
and stay; a named advocacy organisation is not the subject and reads as a side
being taken. `/reports` described one framing as "a defeat for AIPAC" until
6 September 2026. The sweep's `NAMED ADVOCACY GROUP` category catches this.

**Nothing runs this sweep on a schedule.** The monthly Cowork routine
(`neutraleye-positioning-check`) that used to check external copy was deleted
on 3 October 2026, along with every other routine; it does not exist, so do not
go looking for it. Run the sweep by hand after copy changes. It reads the
extension's `manifest.json` description, but the Chrome Web Store listing's long
description lives only in the store dashboard and nothing checks it.

**It is written against the rule, not a phrase list, and it must stay that way.**
The sweep it replaced tested for four marketing taglines
(`bias comparison|side-by-side bias|bias detection|detects bias`). That pattern
could not have matched a `Left-leaning` label, and did not: `/methodology`
documented a full political spectrum with a 0.00-1.00 score, and 2 of 5 FAQ
sections were built on it, while the sweep reported clean. A sweep that tests
for the phrases you already deleted will always pass.

**Report a sweep's scope in the same sentence as its result.** A sweep scoped to
one file must be reported as scoped to one file. An earlier run over
`src/lib/content.js` alone printed a clean result that read as site-wide, and
nothing rechecked the rest of the site afterward. "Clean" with no stated scope
is not a result.

Source comments are stripped before matching, so a comment may name what it is
refusing to do. Entries under `KNOWN, DEFERRED` print every run and do not fail
the gate; each one needs a reason in the script and a matching line in Known
Issues below. Do not add to that list to make the sweep pass.

---

## Code Style & Conventions

- **JS vs TS:** App pages, API routes, and components use `.js`. shadcn/ui components use `.tsx`. Follow the pattern of the file you're editing.
- **CSS:** CSS Modules (`.module.css`) for all non-ui components. Tailwind utility classes for `src/components/ui/` components.
- **Component structure:** Each component lives in its own folder: `ComponentName/ComponentName.js` + `ComponentName.module.css`
- **Imports:** Use `@/` alias for `src/` imports
- **Logging:** Always use `logEvent(level, event, meta)` in API routes — never raw `console.log`
- **No secrets in code:** All keys and URLs via environment variables only
- **Admin tooling never goes on a public marketing path.** It lives behind auth on its own
  route. In particular `/for-comms` is a retired public marketing URL that now permanently
  redirects to `/`, and it was linked in cold outreach, so external parties still hold that
  address. Do not reuse it for admin, internal, or authenticated tooling. The same applies
  to the other retired marketing paths that redirect: `/pricing`, `/compare`, `/extension`,
  `/support`.
- **Reader-facing wording never says "bias".** Since 3 October 2026 the analysis prompt has a READER-FACING WORDING section, and the `summary`, `explanation` and `recommendations` schema lines each restate it; `direction` asks for `"non-directional"` (it was `"non-directional framing bias"`; `isNonDirectional()` in `biasLevel.js` accepts both, because stored rows and cached results carry the old value). Prompt rules alone were not enough: in a sample of 3 the model still wrote "without evident framing or bias" twice until the field-level wording went in. So `generateBiasAnalysis` also runs `scrubReaderFields()` on its output, rewriting leftover terms into framing language in the reader-facing fields only (never `biased_phrases` quotes, never the JSON keys), and logs `analysis.reader_wording.rewritten` with counts whenever it fires. If that event shows up often, fix the prompt rather than growing the rewrite table. The same pass removes an unfilled `"toward <entity>"` / `"against <entity>"` direction (`stripDirectionPlaceholder`, counted as `placeholder` in that log), since it would otherwise become the headline on the site and in the extension; the prompt also tells the model to name the real entity or use `"non-directional"`. The JSON keys (`bias_level`, `biased_phrases`) are internal and stay.
- **Prompt changes:** The article-detection and bias-analysis prompts live in ONE place: `src/lib/analysis.js`. Both `/api/analyze` and `/api/extension` import from it (along with URL extraction, OpenAI calls, and `buildHumanResult`). Never re-add prompt text to a route file. Shared logging/Sentry helpers live in `src/lib/apiLog.js`.
- **`driverLabelFromReason`** in `analyze/route.js`: maps "language" → "Loaded wording", "framing" → "Framing", "source" → "Source imbalance", "attribution" → "Attribution gaps". Any other value (e.g. AI returns "LOADED PHRASING") is title-cased and passed through rather than collapsed to a generic fallback.
- **`storage.js` `saveAnalysis`**: always tags website Supabase saves with `requestMeta.source = "website"` before persisting. The extension API tags its own saves with `source: "extension"` server-side.
- **Avoiding `react-hooks/set-state-in-effect`:** don't call `setState` directly, synchronously, in an effect's top-level body — this rule is at `error`. Three patterns used in this codebase, pick based on the case:
  - **Syncing from a browser API (localStorage, media queries, etc.):** use `useSyncExternalStore` instead of `useState` + effect (see `saveHistory` in `history/page.js` for the SSR-safe pattern: real getSnapshot, a fixed `getServerSnapshot`, and a subscribe function that no-ops when `window` is undefined).
  - **Resetting/adjusting state when a dependency changes (e.g. close a menu on route change):** compare against a previous value tracked via `useState`, and call `setState` conditionally directly in the render body (not inside `useEffect`) (the old `SiteHeader.js` used this for `prevPathname`; it was deleted on 3 October 2026). This is React's own recommended pattern (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes) and isn't flagged since it's not inside an effect.
  - **Data fetching / async work that legitimately belongs in an effect:** split "resolve the value" (a plain async function with no `setState` calls in its own body) from "commit the value" (`.then((next) => setState(...))`). The linter only flags a *direct* top-level `setState` call inside the effect's own body — a callback passed to `.then()`/`.catch()` is a separate closure and isn't scanned. See `resolveLimit` in `useAnalysisLimit.js`.

---

## Design System

- **Aesthetic:** Cool, editorial, evidence-first — deep teal accent (`#0E5A5E`), near-white surfaces (`#F4F5F5`), ink (`#0D0F10`). The warm-brown palette it replaced is gone; do not reintroduce `#8b6741` or `#f8f4ee`.
- **Primary colour:** `--fc-accent: #0E5A5E` (hover `--fc-accent-dark: #0B484B`). Ink is `--fc-heading: #0D0F10` (hover `--fc-ink-hover: #2C3235`).
- **Upgrade to Pro button:** Dark near-black (`rgba(22,20,18,0.88)`) — flips to white when header scrolls over a dark section (`data-header-theme='dark'`). Not brand brown.
- **Components:** shadcn/ui + Radix UI primitives (`src/components/ui/`)
- **Animations:** Framer Motion
- **Fonts:** Source Serif 4 throughout — headings, body, and small tracked labels are one family. Geist Mono for code/data only.
- **Theming:** Dark/light mode via `next-themes` + `ThemeProvider`
- **Uppercase tracked labels — permitted in one place only.** They are allowed as
  *structural* labels inside evidence and data layouts, where they name a part of a table,
  chart, or annotation: a matrix column head, a chart's axis or series name, the signal
  label on an interlinear note, the source line above a quoted article. They are **not**
  permitted as decorative eyebrows above section headings, which is what they were removed
  from across the site. If you cannot tell which category a label falls into, it is
  decorative and it goes.
- **Button colour carries meaning — ink vs accent.** Colour encodes what *kind*
  of action a button is, not how important it looks.
  - **Ink** (`--fc-heading`, solid or underline) = a free action the reader takes
    themselves: open the analyzer, add the extension, paste a link, see the free tools.
  - **Accent** (`--fc-accent`, solid or underline) = a paid conversation: book a demo,
    request a report, see a finished report.
  - **One hue per CTA block.** A block takes the colour of its *primary* action, and a
    pair never splits across two hues. A black primary next to a teal secondary reads as
    decoration rather than meaning.
  - Classes: `.btn` / `.btnRule` / `.btnQuiet` are accent; `.btnInk` / `.btnInkRule` /
    `.btnInkQuiet` are ink. Defined in `page.module.css` (homepage scale) and
    `marketing.module.css` (interior scale).
- **Control radius token is `--control-radius`, never `--radius-*`.** Tailwind v4 reserves
  the `--radius-*` namespace for its `rounded-*` utilities and **tree-shakes any variable
  in it that no utility references**, so a `--radius-foo` token is silently stripped from
  the built CSS while its `var()` usages ship, making `border-radius` invalid and
  rendering 0px. This already affects `--radius-sm` / `--radius-md` declared in
  `globals.css`: the browser gets Tailwind's defaults, not the declared values.
- **Consistency:** Visual style must match the NeutralEye browser extension
- **Homepage layout:** one centred column, `max-width: 42rem`, on the cool paper tone (`--fc-surface`), with the input as the one raised white sheet. The display line is Source Serif 4 at 600, up to 3.75rem. Chrome is `SiteShell` only: no nav links, no dropdowns beyond the one-item account menu, a footer of Privacy and Terms. Controls are ink; the accent appears only in annotation marks (on a result, and in the Newsprint backdrop, where the marks are the point). Motion: the backdrop's drift and marks, the mark sweep on a result, the tab rule sliding between modes. All of it stops under prefers-reduced-motion.
- **iPhone rules.** `viewport-fit=cover` is set in `layout.js`, so pinned and edge elements must pad with `env(safe-area-inset-*)` (the shell, the column and the mobile action bar already do). Every text input stays at 16px or larger, or iOS Safari zooms the page on focus. Inputs reset `-webkit-appearance`. Checked 3 October 2026 in Playwright WebKit on iPhone SE, 13, 15 Pro Max and 13 landscape: no sideways scroll, inputs at 16px or more, 44px tap targets, the action bar pinned while long text is open, the sign-in overlay fitting the screen with its X top left.
- **Sign-in is never a page.** It is the AuthDialog overlay over whatever page the reader is on. Anything that used to link to /login should open the overlay instead.

When building new UI, prefer extending existing components in `src/components/ui/` before creating new ones.

- **CSS hover dropdowns:** Bridge the gap between trigger and panel with `padding-top` on the dropdown div — never use `top: calc(100% + gap)`. A gap breaks `:hover` continuity.
- **Hover dropdown stuck open after click:** clicking a hover-dropdown trigger `<button>` keeps it open via `:focus-within` until the element loses focus. Add `onClick={(e) => e.currentTarget.blur()}` to the trigger to close it on click while preserving keyboard accessibility.
- **Touch-safe hover dropdowns:** Gate `onPointerEnter`/`onPointerLeave` handlers behind `e.pointerType === "mouse"` so Radix's built-in tap behavior works on touch devices. For toggle-to-close, use a `justClosed` ref to suppress Radix's immediate re-open after `onOpenChange`. Scope `:hover` styles behind `@media (hover: hover)` to prevent sticky highlights on mobile.

---

## Known Issues

- **Zoom / responsive scaling** — The canvas-frame guide lines (92rem, ≥1024px) are now implemented. General zoom/viewport edge cases may still exist — do not introduce layout patterns that rely on fixed pixel widths without testing at multiple zoom levels.
- **OG image** — `src/app/opengraph-image.js` generates a 1200×630 social preview using `next/og`. Custom font loading on Vercel's edge runtime is unreliable (empty responses, timeouts). The current version uses the default Satori font. `PlayfairDisplay-Regular.woff2` is in `public/` if someone retries custom fonts in the future.
- **`--radius-sm` / `--radius-md` are fine. This entry used to say they were broken.**
  Corrected 10 September 2026 after measuring instead of trusting it. The browser
  receives the declared values: `--radius-md` resolves to `.5rem` and `--radius-sm`
  to `.375rem`, checked against `getComputedStyle` on a running build.

  The original bug was real but narrower than this entry claimed. Tailwind v4
  tree-shakes unreferenced variables declared **inside an `@theme` block**, which is
  where `--radius-control` lived; it was stripped and every button fell back to 0px.
  The name is what gets remembered, but moving it out of `@theme` is what fixed it.
  `--radius-lg/md/sm` sit in the plain `:root` block, which Tailwind never touches.

  This mattered: acting on the entry as written meant renaming roughly 28 usages
  across 12 files to fix nothing. `--radius-xl` was deleted, it had no usages.
- **The extension's store listing name is the one surviving use of the old category
  vocabulary.** `manifest.json` is named "NeutralEye - Bias Checker", kept deliberately
  for Chrome Web Store search discoverability, and `src/lib/biasLevel.js` names it as
  the single exception to the framing-only rule. It sits in the positioning sweep's
  `KNOWN, DEFERRED` list so it stays visible on every run rather than being silently
  allowed. Note the cost: "checker" describes a one-shot utility, which is the mental
  model the reading companion's retention problem is fighting. Revisit the name and the
  discoverability trade together, not separately.
- **The Design System section above is still partly stale.** Deferred, not fixed. Three
  lines (aesthetic, primary colour, fonts) were corrected when the CTA colour rule was
  added; the rest still references deleted components (`MediaBarrier`, the `/extension`
  page), Framer Motion, `next-themes`, and a `max-width: 92rem` section rule that the
  rebuilt pages do not follow. Treat entries below the CTA rule as unverified until
  someone re-reads them against the code.
---

## Product Direction and Priority

**Recorded 3 October 2026, superseding the 5 September entry.** The site is fully
B2C. The B2B coverage report is no longer pitched anywhere on the site: no demo
booking, no service pitch, no references to communications or investor relations
teams. The `neutraleye-mvp` pipeline still exists locally; it simply has no public
surface.

The homepage is one product with two modes:

1. **Read** (default, live): the framing analyzer, text input only.
2. **Write** (not built): the writing companion. Its tab describes what it will
   do, leading with the fact that it will not draft for you, and collects
   early-access emails through `/api/waitlist` with `source: "write"`. No launch
   date anywhere. When it is built it takes the same slot (see `modes.js`).

**A "Research" feature is planned behind login and deliberately absent.** No
placeholder, link or route exists for it. Its input, flow and output have not
been defined; do not guess at them.

Context still worth knowing from the earlier market research: the writing-tool
market is saturated, and "the tool refuses to draft for you" is the category's
standard pattern rather than a differentiator. The version where the
framing-analysis work transfers is narrow (research and writing for political
journalism) and is blocked on curriculum.

## Roadmap

- **Stripe** — Pro tier payments; `useProAccess.js` is ready to wire up (paused — not yet started)
- **Transactional email** — Done. Auth email sends from `contact@tryneutraleye.com` through Resend SMTP, and the branded signup-confirm and password-reset templates are pasted into the dashboard and confirmed live (2026-08-21). Nothing outstanding; re-paste only if `supabase/email-templates/` changes.
- **Supabase Pro + Google OAuth restore** — Google "Continue with Google" was temporarily removed (2026-07-02) because the OAuth consent screen showed `*.supabase.co` instead of `tryneutraleye.com`, which looks unprofessional. To restore: (1) upgrade Supabase to Pro, (2) set custom auth domain `auth.tryneutraleye.com` in Supabase dashboard → update DNS CNAME in Cloudflare, (3) update Google Cloud Console redirect URI, (4) re-add `GoogleIcon` + Google button to `sign-in.tsx` `SignUpPage`, (5) re-add `handleGoogleAuth` + `onGoogleSignIn` prop in `login/page.js`, (6) restore `lh3.googleusercontent.com` to CSP `img-src` and `next.config.mjs` `remotePatterns`, (7) add an `isGoogleUser` avatar branch to `SiteShell.js` (it lived in the deleted `SiteHeader.js`).

## Infrastructure Status

| Item | Status |
|------|--------|
| Domain (`tryneutraleye.com`) | ✅ Live, connected to Vercel |
| Supabase Auth redirect URLs | ✅ Updated to `tryneutraleye.com` |
| `contact@tryneutraleye.com` inbox | ✅ Cloudflare Email Routing → founder's Gmail (Google Workspace cancelled 2026-10-02) |
| Cloudflare | ✅ Done |
| Sentry | ✅ Done — org `laith-munir` |
| OG / metadata URLs | ✅ Updated to `tryneutraleye.com` |
| Sitemap | ✅ Updated to `tryneutraleye.com` |
| Resend (Auth SMTP) | ✅ Live |
| Branded auth email templates | ✅ Applied and verified live (2026-08-21) |
| Supabase Pro + custom auth domain | ⏸ Pending |
| Stripe | ⏸ Paused |

---

## Testing

```
src/lib/__tests__/normalizeResponse.test.js
src/lib/__tests__/resolveApiBase.test.js
src/lib/__tests__/score.test.js
src/lib/__tests__/getClientIp.test.js
src/lib/__tests__/dailyLimit.test.js
src/lib/__tests__/ratelimit.test.js
src/lib/__tests__/ssrf.test.js
src/lib/__tests__/analysis.test.js        # buildHumanResult, contentTypeFromAiJson
src/lib/__tests__/promptContract.test.js  # pins load-bearing rules in the bias-analysis prompt (quote exclusion, content-type classification, minimum-impact threshold, JSON schema, response_format, source-domain exclusion)
src/lib/__tests__/normalizeAiResult.test.js  # AI JSON -> response shape, no-bias case, malformed JSON fallback, driverLabelFromReason, scoreFromBiasLevel
src/lib/__tests__/modelPins.test.js        # pins the OpenAI model IDs to the bare gpt-4o / gpt-4o-mini aliases — fails on a dated snapshot (gpt-4o-2024-05-13), a "-latest" rolling alias, or a "-preview" model
src/components/Workbench/__tests__/Workbench.test.js  # Read mode results and errors, the mode toggle, Write early-access signup
```

`analysis.test.js`, `promptContract.test.js`, `normalizeAiResult.test.js`, and `modelPins.test.js` run under `@jest-environment node` (not the default jsdom) — `analysis.js` imports `cheerio`, which only ships browser/ESM exports that jsdom's export-condition resolution can't `require()`.

Run with `npm run test`, or `npm run verify` for the full typecheck + lint + test + build pass.

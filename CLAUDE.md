# CLAUDE.md — NeutralEye Web

This file is the source of truth for Claude Code when working on the NeutralEye web project.
Read this before touching any code.

---

## Project Overview

NeutralEye is an AI-powered media bias checker. Users paste article text or submit a URL and receive a structured bias analysis: direction, confidence score, bias drivers, example quotes, and source recommendations.

There is no separate backend server. All backend logic lives as Next.js API Routes inside this repo, deployed on Vercel.

**Companion repo:** `neutraleye-extension` — Chrome extension frontend that calls this repo's API routes.

**Production domain:** `tryneutraleye.com` — purchased and connected to Vercel.

---

## Infrastructure

| Service        | Location                          | Notes                                                        |
|----------------|-----------------------------------|--------------------------------------------------------------|
| Frontend       | `neutraleye-web` → Vercel         | Next.js 16, React 19                                         |
| API Routes     | `src/app/api/` → Vercel           | All backend logic lives here, no separate server             |
| Database       | Supabase                          | Auth + analyses + daily_usage tables, RLS active             |
| Rate limiting  | Upstash Redis                     | Sliding window via `@upstash/ratelimit`; falls back to in-memory locally |
| Email          | Resend                            | Support form + Supabase Auth email via custom SMTP           |
| Payments       | Stripe                            | Not yet set up                                               |
| Security       | Cloudflare                        | Planned                                                      |
| Monitoring     | Sentry                            | Set up — frontend + backend verified                         |
| Analytics      | Vercel Web Analytics              | `<Analytics />` in layout.js — enable in Vercel dashboard → project → Analytics |

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
    page.js                 # Home / landing page
    analyze/page.js         # Core bias checker tool
    pricing/page.js         # Pricing / upgrade to Pro
    history/page.js         # User analysis history (Supabase-backed) — shows a locked gate when saveHistory setting is disabled in localStorage
    how-it-works/page.js    # How NeutralEye works — canonical page, dark hero + SVG pipeline diagram + 3 feature rows
    overview/page.js        # Redirects to /how-it-works
    system/page.js          # Redirects to /how-it-works
    methodology/page.js     # Post-result reading guide — NOT a signal explainer (that belongs in Overview)
    extension/page.js       # Chrome extension marketing page — hero uses inline ExtensionMockup JSX (fictional article + NeutralEye popup overlay), no screenshot file
    faq/page.js             # Two-column FAQ with <details>/<summary> accordions and sticky nav
    about/page.js           # Founder story / mission — essay format with drop cap, no cards
    changelog/page.js       # Vertical timeline of releases with New/Improved/Fixed type tags
    support/page.js         # Contact form — POSTs to /api/support via Resend, requires "use client"
    login/page.js           # Auth page — all four auth states use sign-in.tsx split layout: SignInPage (sign-in), SignUpPage (sign-up), ForgotPasswordPage (forgot-password email form), PasswordResetSentPage (link-sent confirmation); CheckEmailPage used after sign-up
    reset-password/page.js  # Password reset — uses SetNewPasswordPage from sign-in.tsx; handles Supabase recovery redirect
    blog/                   # Blog with dynamic [slug] routing — 3-col dark-thumbnail grid, chronological sort; post page reading layout (sidebar nav + content + footer) lives in [slug]/ReadingLayout.js
    compare/page.js         # Compare Analyses — Pro-gated with blur overlay
    settings/page.js        # User settings — Display (reduce motion) + Privacy (save analysis history toggle, stored in localStorage key `neutraleye.settings.v1`)
    extension-privacy/      # Extension privacy policy
    privacy/                # Website privacy policy
    terms/                  # Terms of service
    layout.js               # Root layout — fonts, ThemeProvider, metadata
    globals.css             # Global styles

    api/
      analyze/route.js      # Web bias analysis — text + URL modes
      extension/route.js    # Extension bias analysis — text only
      extension-auth/route.js # Extension login (email/password → Supabase)
      extension-refresh/route.js # Extension token refresh — exchanges refresh token for new access token
      usage/route.js        # Daily usage check + increment

  components/
    AppShell/               # App-mode layout wrapper
    MarketingShell/         # Marketing/landing layout wrapper — includes `.canvasFrame` (position:fixed, 92rem max-width, z-index:200, visible at ≥1024px) with ::before/::after 1px vertical guide lines at rgba(128,128,128,0.12); `.shell` warm gradient background; `.ambientTop` top-edge fade overlay
    MediaBarrier/           # "Reads content from" publication ticker — 3-row marquee duplicate for seamless loop (-33.3333% keyframe); background rgba(139,103,65,0.03) matching About pull-quote; edge fades via ::before/::after gradients clipped at canvas-frame lines via overflow:hidden on .track
    HeaderBar/              # App header
    SiteHeader/             # Grouped dropdown nav: Analyze (styled as accent CTA pill with eye-blink hover) + Product/Learn/Company hover dropdowns; scroll-aware dark/light theme; Radix account dropdown is also dark-mode aware; full-width `.header` wrapper (flex, border-bottom: 1px solid rgba(93,75,53,0.14)) contains `.headerInner` (max-width:92rem; margin:0 auto) for canvas-frame alignment. Avatar: shows the user's first initial (from full_name or email) in a styled circle.
    SiteFooter/             # 4 columns: Product / Learn / Company / Legal; `.footer` is full-bleed (border-top, panel-strong bg); `.footerInner` (max-width:92rem; margin:0 auto; padding:2.15rem 2.25rem) aligns content to canvas-frame lines
    Sidebar/                # App sidebar
    InputPanel/             # Article URL / text input
    ResultCard/             # Bias result display card
    ConfidenceRing/         # Animated confidence score ring
    DriverChips/            # Bias driver pill tags
    QuoteEvidence/          # Evidence quote display — used on analyze page for each biased_phrase: chip label (signal type) + blockquote with opening " mark + explanation row
    HistoryTable/           # Analysis history list — shows "Extension" / "Website" source badge per row; hides Inspect button for extension rows (layout mismatch); `isNoBiasRecord()` unifies no-bias detection; Direction shows `NO_BIAS_LABEL`; Confidence shows "N/A" when no bias
    AnalyzerCta/            # CTA heading + button — no card/box background
    HeroSystemVisualization/ # Animated graph on home hero
    ui/                     # shadcn/ui + custom animated components
      sign-in.tsx           # Exports SignInPage, SignUpPage, CheckEmailPage, ForgotPasswordPage, PasswordResetSentPage, SetNewPasswordPage — all use the same split layout (warm beige LeftPanel / dark AnalysisPanel). LeftPanel renders a Back button only when showBack prop is passed (SignInPage + SignUpPage only); goBackToSite() skips auth paths and falls back to /. AnalysisPanel: heading/sub + ResultFeed (7 rows, opacity/translateY reveal, filling→complete→resetting loop) + SignalBars (bar chart fades in via globals.css barGrow keyframe). Google OAuth button is temporarily absent (removed 2026-07-02) — see Roadmap for restore steps. LegalSub in SiteHeader is a controlled DropdownMenu.Sub that opens on hover (mouse) or tap (touch) and closes 150ms after pointer leaves either element (mouse) or on second tap (touch).

  lib/
    api.js                  # Frontend → API route calls
    score.js                # Score/confidence normalization
    storage.js              # Local storage helpers
    content.js              # BLOG_POSTS array + EXTENSION_URL. Add showBrandTitle: true to a post for logo overlay on blog card. Blog list sorts at render time — do not rely on array order.
    ratelimit.js            # Upstash Redis rate limiter — getRatelimiter() + checkRedisRateLimit(). Falls back to in-memory store when UPSTASH_REDIS_REST_URL/TOKEN are absent (local dev).
    types.js                # Shared type definitions
    utils.ts                # shadcn cn() utility
    supabase/
      client.js             # Browser Supabase client
      server.js             # Server Supabase client (cookie-based)
      analyses.js           # analyses table read/write
      AuthProvider.js       # Auth context provider
      useAnalysisLimit.js   # Daily usage limit hook
      useProAccess.js       # Pro plan gate — always false until Stripe is wired up
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

### `POST /api/support` — Contact form
- Accepts `{ name, email, subject, message }` from the support page
- Sends email via Resend to `contact@tryneutraleye.com` with sender as `replyTo`
- Validates all fields, email format, and length limits (name: 100, message: 5000)

---

## No-Bias Result Consistency

When the model returns `bias_level === "none"`, every surface must show `NO_BIAS_LABEL` ("No significant framing detected") and replace the confidence score with "N/A".

**Never decide this by matching display copy.** `src/lib/biasLevel.js` is the single source of truth: `isNoBiasRecord()` keys off the `bias_level` enum stored in `request_meta`, and consults a label only for pre-rename rows that have no enum. All display strings live in that module too, so a copy change can never break the check.

- **Extension API** (`buildDirectionLabel`): returns `NO_BIAS_LABEL` — not `"unknown"`
- **HistoryTable**: uses the shared `isNoBiasRecord()`; confidence shows "N/A"
- **Analyze page**: confidence section shows `"N/A"` with a no-bias-specific message instead of the score/bar
- **Compare page**: uses the shared `isNoBiasRecord()`; confidence shows "N/A" for no-bias items

---

## Supabase

**Project:** `hkxtymihsyegrmqnvdvn.supabase.co` (matches `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`).

**Tables:**
- `analyses` — user analysis history (`id`, `user_id`, `created_at`, `input_type`, `url`, `title`, `direction`, `direction_label`, `confidence`, `score`, `summary`, `drivers`, `examples`, `sources`, `recommendations`, `request_meta`)
  - `request_meta` is a JSON column. Both routes tag saves: extension sets `{ source: "extension" }`, website sets `{ source: "website" }`. HistoryTable reads this to show source badges and hide the Inspect button for extension rows.
  - **Measurement fields — `biasLevel` and `contentType`.** Every save also records the model's raw `bias_level` and `content_type` enums, via `analysisMetaFields()` in `src/lib/analysisMeta.js`. Both paths use that one helper so the key names stay identical and a single query covers both: the extension route spreads it into `request_meta` server-side; the web path carries it through `normalizeResponse` in `src/lib/api.js` (the web save is client-side, and `analysisToRow` has no column for either field, so `request_meta` is the only way they persist).
    - **Deliberately not normalized.** `contentTypeFromAiJson` (`analysis.js`) and `normalizeContentType` (`api.js`) both coerce anything unrecognized to `"news"` — correct for display, fatal here, since a missing value would become indistinguishable from the model actually saying "news". Absent logs as `null`. `analysisMeta.test.js` pins this; do not "simplify" it by reusing those normalizers.
    - Rows saved before 2026-08-25 have neither key and come back `null`. Exclude them (`where request_meta->>'biasLevel' is not null`) rather than letting them read as a category.
    - Live since 2026-08-25, verified end-to-end on both paths. Purpose: establish whether the high `bias_level: "none"` rate is real, and which of the prompt's five one-directional suppression rules causes it, **before** any prompt rule is changed. For `none` rows, `content_type` plus the already-persisted `confidence` narrows it: `opinion`/`analysis` → content-type relaxation; `news` + confidence < 0.4 → weak-or-ambiguous clause; `news` + confidence >= 0.4 → minimum-impact threshold, by elimination. Quote exclusion stays invisible — it shrinks the evidence pool silently and surfaces as one of the others.
  - `examples` stores `[{ quote, label, explanation, highlights }]` for website saves; `[{ quote, why }]` for extension saves.
- `daily_usage` — daily request count (`user_id`, `usage_date`, `count`)
- `waitlist` — Pro-launch email waitlist (`id`, `email` unique, `created_at`). No `user_id` — signups are anonymous, from the Pro waitlist form on `/pricing` (`WaitlistForm.js` → `POST /api/waitlist`).

**Auth:** Email + password only. Sign up on website only; extension supports sign in only.

**Password reset:** Uses Supabase `resetPasswordForEmail` with `redirectTo: /auth/callback?next=/reset-password`. The existing `/auth/callback` route handles the code exchange; `/reset-password` calls `updateUser({ password })`.

**Auth email:** Supabase Auth already sends through **custom SMTP wired to Resend**. Verified 2026-08-20 from the Resend sent log, not inferred from docs. Sender is `"NeutralEye" <contact@tryneutraleye.com>`; domain `tryneutraleye.com` is verified in `us-east-1` with **sending enabled and receiving disabled**, so never invite a reply in email copy because it lands nowhere anyone reads. Branded HTML for Confirm signup and Reset password lives in `supabase/email-templates/`. **Both are applied and live in production, verified 2026-08-21** by fetching the actual sent HTML from the Resend log for a real signup and a real reset and diffing it against these files. Those files remain the source of truth, but they are applied by hand in the dashboard (Auth → Email Templates); no migration or MCP tool can push them, so any edit to these files must be re-pasted there or production keeps sending the old version. Only those two flows are in use: magic link, change email, and invite are not.

**Email OTP expiry is 3600 seconds (1 hour)**, confirmed from the dashboard 2026-08-20. It covers both the signup confirmation link and the password recovery link, and both templates state the hour explicitly.

**Two different email limits, do not conflate them:**
- **Per address, 60 seconds** (`smtp_max_frequency`). Retrying signup inside that window returns 429 `over_email_send_rate_limit` carrying "For security purposes, you can only request this after 56 seconds." This is the limit `SIGNUP_RESEND_WAIT_MESSAGE` is worded for, which is why it says "about a minute".
- **Per project, 30 emails per hour** (dashboard: Auth → Rate Limits). A ceiling across all addresses, independent of the 60s per-address interval.

Neither is an SMTP-provider limit, so switching email provider moves neither one. An earlier assumption that leaving Supabase's built-in sender would relax these was wrong on both counts.

**RLS:** Enabled on all three tables. `analyses`/`daily_usage` policies: users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`) — migration SQL at `supabase/migrations/20260601000000_rls_policies.sql`. `waitlist` has **no** anon INSERT policy at all — inserts go only through `public.join_waitlist(p_email text)`, a `SECURITY DEFINER` function (validates email format, `ON CONFLICT DO NOTHING` for dedup) called via `supabase.rpc("join_waitlist", ...)` from `/api/waitlist/route.js`. This gives that one public, unauthenticated write path a privileged route without needing a service-role key — migration SQL at `supabase/migrations/20260727000000_waitlist_rls_tighten.sql`. (Fixed 2026-07-27: the previous `waitlist` INSERT policy was `WITH CHECK (true)`, letting any unauthenticated caller insert arbitrary rows directly — the weekly ops-check flagged it three times before this was closed.)
  - **Expected advisories, not regressions:** `get_advisors` (security) now shows `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` for `join_waitlist`. That's inherent to this pattern — a `SECURITY DEFINER` function callable by `anon`/`authenticated` is exactly the intended design for a public signup RPC without a service-role key — and does not need fixing. Don't let these two read as new problems in a weekly ops-check report. `rls_policy_always_true` on `waitlist` was the actual bug; if that specific one ever reappears, that's the one to investigate.

**Client keys:** Publishable key only — no service role key. RLS must be correctly configured in Supabase dashboard. `join_waitlist` (see above) is how `waitlist` gets a privileged write path without introducing one.

**Important:** The extension API route passes the Bearer token as a global `Authorization` header when creating the Supabase client, so `auth.uid()` resolves correctly for RLS. Do not call `makeSupabase()` without the token for authenticated writes.

---

## Pro Plan Gating

Pro features are gated via `useProAccess` (`src/lib/supabase/useProAccess.js`). Currently `isPro` is hardcoded to `false` — no one has Pro access until Stripe is wired up.

**Currently gated features:**
- **Compare Analyses** (`/compare`) — shows a blur overlay with a Pro gate card and link to `/pricing`

**When Stripe is ready:** Update `useProAccess.js` to check `user.app_metadata.plan === 'pro'`. No other files need changing.

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

# Resend — transactional email (support form)
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

## Code Style & Conventions

- **JS vs TS:** App pages, API routes, and components use `.js`. shadcn/ui components use `.tsx`. Follow the pattern of the file you're editing.
- **CSS:** CSS Modules (`.module.css`) for all non-ui components. Tailwind utility classes for `src/components/ui/` components.
- **Component structure:** Each component lives in its own folder: `ComponentName/ComponentName.js` + `ComponentName.module.css`
- **Imports:** Use `@/` alias for `src/` imports
- **Logging:** Always use `logEvent(level, event, meta)` in API routes — never raw `console.log`
- **No secrets in code:** All keys and URLs via environment variables only
- **Prompt changes:** The article-detection and bias-analysis prompts live in ONE place: `src/lib/analysis.js`. Both `/api/analyze` and `/api/extension` import from it (along with URL extraction, OpenAI calls, and `buildHumanResult`). Never re-add prompt text to a route file. Shared logging/Sentry helpers live in `src/lib/apiLog.js`.
- **`driverLabelFromReason`** in `analyze/route.js`: maps "language" → "Loaded wording", "framing" → "Framing", "source" → "Source imbalance", "attribution" → "Attribution gaps". Any other value (e.g. AI returns "LOADED PHRASING") is title-cased and passed through rather than collapsed to a generic fallback.
- **`storage.js` `saveAnalysis`**: always tags website Supabase saves with `requestMeta.source = "website"` before persisting. The extension API tags its own saves with `source: "extension"` server-side.
- **Avoiding `react-hooks/set-state-in-effect`:** don't call `setState` directly, synchronously, in an effect's top-level body — this rule is at `error`. Three patterns used in this codebase, pick based on the case:
  - **Syncing from a browser API (localStorage, media queries, etc.):** use `useSyncExternalStore` instead of `useState` + effect (see `saveHistory` in `history/page.js` for the SSR-safe pattern: real getSnapshot, a fixed `getServerSnapshot`, and a subscribe function that no-ops when `window` is undefined).
  - **Resetting/adjusting state when a dependency changes (e.g. close a menu on route change):** compare against a previous value tracked via `useState`, and call `setState` conditionally directly in the render body (not inside `useEffect`) — see `prevPathname` in `SiteHeader.js`. This is React's own recommended pattern (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes) and isn't flagged since it's not inside an effect.
  - **Data fetching / async work that legitimately belongs in an effect:** split "resolve the value" (a plain async function with no `setState` calls in its own body) from "commit the value" (`.then((next) => setState(...))`). The linter only flags a *direct* top-level `setState` call inside the effect's own body — a callback passed to `.then()`/`.catch()` is a separate closure and isn't scanned. See `resolveLimit` in `useAnalysisLimit.js`.

---

## Design System

- **Aesthetic:** Warm, editorial, not sterile — warm browns (`#8b6741`), off-whites (`#f8f4ee`), serif display font
- **Primary colour:** `#8b6741` (hover: `#6e4f2f`)
- **Upgrade to Pro button:** Dark near-black (`rgba(22,20,18,0.88)`) — flips to white when header scrolls over a dark section (`data-header-theme='dark'`). Not brand brown.
- **Components:** shadcn/ui + Radix UI primitives (`src/components/ui/`)
- **Animations:** Framer Motion
- **Fonts:** Geist Sans (body), Geist Mono (code/data), serif display via CSS variable
- **Theming:** Dark/light mode via `next-themes` + `ThemeProvider`
- **Uppercase tracked labels — permitted in one place only.** They are allowed as
  *structural* labels inside evidence and data layouts, where they name a part of a table,
  chart, or annotation: a matrix column head, a chart's axis or series name, the signal
  label on an interlinear note, the source line above a quoted article. They are **not**
  permitted as decorative eyebrows above section headings, which is what they were removed
  from across the site. If you cannot tell which category a label falls into, it is
  decorative and it goes.
- **Consistency:** Visual style must match the NeutralEye browser extension

When building new UI, prefer extending existing components in `src/components/ui/` before creating new ones.

- **Section width:** Hero, steps, principles, and CTA sections use `max-width: 92rem`. Feature rows (left/right split with visuals) use `max-width: 72rem` for a more compact, readable layout. Do not widen feature sections back to 92rem.
- **Page identity rule:** Home (emotional sell) → How It Works `/how-it-works` (technical pipeline) → Methodology (reading guide). These three pages must not repeat each other's content. `/overview` redirects to `/how-it-works`.
- **Dark hero pages:** Add `data-header-theme="dark"` on the hero section + pass `darkHeader` prop to `MarketingShell`. Used on Overview and Extension pages.
- **CSS hover dropdowns:** Bridge the gap between trigger and panel with `padding-top` on the dropdown div — never use `top: calc(100% + gap)`. A gap breaks `:hover` continuity.
- **Hover dropdown stuck open after click:** clicking a hover-dropdown trigger `<button>` keeps it open via `:focus-within` until the element loses focus. Add `onClick={(e) => e.currentTarget.blur()}` to the trigger to close it on click while preserving keyboard accessibility.
- **Radix DropdownMenu dark mode:** `DropdownMenu.Portal` renders into `document.body`, so SiteHeader's CSS-module-scoped `.dark` class on `<header>` does not cascade to portaled content. Pass the header's `isDark` state directly as a conditional className on `DropdownMenu.Content`/`SubContent` (see `.dropdownContentDark` in `SiteHeader.module.css`).
- **Canvas-frame guide lines:** `MarketingShell` renders a `position:fixed; inset:0; max-width:92rem; z-index:200; pointer-events:none` `.canvasFrame` div whose `::before`/`::after` pseudo-elements are 1px vertical lines in `rgba(128,128,128,0.12)`. Visible at ≥1024px viewports, they mark the 92rem content boundary at any zoom level and stay readable on both light and dark section backgrounds without blend modes.
- **Aligning content to canvas-frame lines:** Header (`.headerInner`) and footer (`.footerInner`) both use `max-width:92rem; margin:0 auto; padding:0 2.25rem` so their content edges sit 2.25rem inside the guide lines. The `.header`/`.footer` wrappers are full-bleed.
- **Section separators — no full-bleed border lines:** Avoid `border-top`/`border-bottom` on full-bleed sections that cross the canvas-frame guide lines. Use a subtle background tint instead — `rgba(139,103,65,0.03)` is the standard (used by About pull-quote and MediaBarrier). The one intentional exception is the header's `border-bottom` and footer's `border-top`, which are full-bleed by design and match each other in style (`rgba(93,75,53,0.14)`).
- **Touch-safe hover dropdowns:** Gate `onPointerEnter`/`onPointerLeave` handlers behind `e.pointerType === "mouse"` so Radix's built-in tap behavior works on touch devices. For toggle-to-close, use a `justClosed` ref to suppress Radix's immediate re-open after `onOpenChange`. Scope `:hover` styles behind `@media (hover: hover)` to prevent sticky highlights on mobile.

---

## Known Issues

- **Zoom / responsive scaling** — The canvas-frame guide lines (92rem, ≥1024px) are now implemented. General zoom/viewport edge cases may still exist — do not introduce layout patterns that rely on fixed pixel widths without testing at multiple zoom levels.
- **OG image** — `src/app/opengraph-image.js` generates a 1200×630 social preview using `next/og`. Custom font loading on Vercel's edge runtime is unreliable (empty responses, timeouts). The current version uses the default Satori font. `PlayfairDisplay-Regular.woff2` is in `public/` if someone retries custom fonts in the future.

---

## Roadmap

- **Stripe** — Pro tier payments; `useProAccess.js` is ready to wire up (paused — not yet started)
- **Transactional email** — Done. Auth email sends from `contact@tryneutraleye.com` through Resend SMTP, and the branded signup-confirm and password-reset templates are pasted into the dashboard and confirmed live (2026-08-21). Nothing outstanding; re-paste only if `supabase/email-templates/` changes.
- **Supabase Pro + Google OAuth restore** — Google "Continue with Google" was temporarily removed (2026-07-02) because the OAuth consent screen showed `*.supabase.co` instead of `tryneutraleye.com`, which looks unprofessional. To restore: (1) upgrade Supabase to Pro, (2) set custom auth domain `auth.tryneutraleye.com` in Supabase dashboard → update DNS CNAME in Cloudflare, (3) update Google Cloud Console redirect URI, (4) re-add `GoogleIcon` + Google button to `sign-in.tsx` `SignUpPage`, (5) re-add `handleGoogleAuth` + `onGoogleSignIn` prop in `login/page.js`, (6) restore `lh3.googleusercontent.com` to CSP `img-src` and `next.config.mjs` `remotePatterns`, (7) restore `isGoogleUser` avatar branch in `SiteHeader.js`.

## Infrastructure Status

| Item | Status |
|------|--------|
| Domain (`tryneutraleye.com`) | ✅ Live, connected to Vercel |
| Supabase Auth redirect URLs | ✅ Updated to `tryneutraleye.com` |
| `contact@tryneutraleye.com` inbox | ✅ Exists |
| Cloudflare | ✅ Done |
| Sentry | ✅ Done |
| OG / metadata URLs | ✅ Updated to `tryneutraleye.com` |
| Sitemap | ✅ Updated to `tryneutraleye.com` |
| Resend (support form + Auth SMTP) | ✅ Live |
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
src/app/analyze/__tests__/page.test.js
```

`analysis.test.js`, `promptContract.test.js`, `normalizeAiResult.test.js`, and `modelPins.test.js` run under `@jest-environment node` (not the default jsdom) — `analysis.js` imports `cheerio`, which only ships browser/ESM exports that jsdom's export-condition resolution can't `require()`.

Run with `npm run test`, or `npm run verify` for the full typecheck + lint + test + build pass.

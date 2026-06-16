# CLAUDE.md — NeutralEye Web

This file is the source of truth for Claude Code when working on the NeutralEye web project.
Read this before touching any code.

---

## Project Overview

NeutralEye is an AI-powered media bias checker. Users paste article text or submit a URL and receive a structured bias analysis: direction, confidence score, bias drivers, example quotes, and source recommendations.

There is no separate backend server. All backend logic lives as Next.js API Routes inside this repo, deployed on Vercel.

**Companion repo:** `neutraleye-extension` — Chrome extension frontend that calls this repo's API routes.

**Production domain:** `tryneutraleye.com` — purchased and connected to Vercel. **Still needed:** update Supabase Auth redirect URLs to `tryneutraleye.com`.

---

## Infrastructure

| Service        | Location                          | Notes                                                        |
|----------------|-----------------------------------|--------------------------------------------------------------|
| Frontend       | `neutraleye-web` → Vercel         | Next.js 16, React 19                                         |
| API Routes     | `src/app/api/` → Vercel           | All backend logic lives here, no separate server             |
| Database       | Supabase                          | Auth + analyses + daily_usage tables, RLS active             |
| Rate limiting  | Upstash Redis                     | Sliding window via `@upstash/ratelimit`; falls back to in-memory locally |
| Payments       | Stripe                            | Not yet set up                                               |
| Security       | Cloudflare                        | Planned                                                      |
| Monitoring     | Sentry                            | Set up — frontend + backend verified                         |

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
- **Error monitoring:** `@sentry/nextjs` — tracing + logs enabled, session replay disabled (privacy)
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
    support/page.js         # Contact form using mailto: construction — requires "use client"
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
      usage/route.js        # Daily usage check + increment

  components/
    AppShell/               # App-mode layout wrapper
    MarketingShell/         # Marketing/landing layout wrapper — includes `.canvasFrame` (position:fixed, 92rem max-width, z-index:200, visible at ≥1024px) with ::before/::after 1px vertical guide lines at rgba(128,128,128,0.12); `.shell` warm gradient background; `.ambientTop` top-edge fade overlay
    MediaBarrier/           # "Reads content from" publication ticker — 3-row marquee duplicate for seamless loop (-33.3333% keyframe); background rgba(139,103,65,0.03) matching About pull-quote; edge fades via ::before/::after gradients clipped at canvas-frame lines via overflow:hidden on .track
    HeaderBar/              # App header
    SiteHeader/             # Grouped dropdown nav: Analyze (styled as accent CTA pill with eye-blink hover) + Product/Learn/Company hover dropdowns; scroll-aware dark/light theme; Radix account dropdown is also dark-mode aware; full-width `.header` wrapper (flex, border-bottom: 1px solid rgba(93,75,53,0.14)) contains `.headerInner` (max-width:92rem; margin:0 auto) for canvas-frame alignment
    SiteFooter/             # 4 columns: Product / Learn / Company / Legal; `.footer` is full-bleed (border-top, panel-strong bg); `.footerInner` (max-width:92rem; margin:0 auto; padding:2.15rem 2.25rem) aligns content to canvas-frame lines
    Sidebar/                # App sidebar
    InputPanel/             # Article URL / text input
    ResultCard/             # Bias result display card
    ResultsHeader/          # Results page header
    ConfidenceRing/         # Animated confidence score ring
    DriverChips/            # Bias driver pill tags
    QuoteEvidence/          # Evidence quote display
    HistoryTable/           # Analysis history list
    AnalyzerCta/            # CTA heading + button — no card/box background (stripped this session)
    HeroSystemVisualization/ # Animated graph on home hero
    ui/                     # shadcn/ui + custom animated components
      sign-in.tsx           # Exports SignInPage, SignUpPage, CheckEmailPage, ForgotPasswordPage, PasswordResetSentPage, SetNewPasswordPage — all use the same split layout (warm beige LeftPanel / dark AnalysisPanel). LeftPanel renders a Back button only when showBack prop is passed (SignInPage + SignUpPage only); goBackToSite() skips auth paths and falls back to /. AnalysisPanel: heading/sub + ResultFeed (7 rows, opacity/translateY reveal, filling→complete→resetting loop) + SignalBars (bar chart fades in via globals.css barGrow keyframe). LegalSub in SiteHeader is a controlled DropdownMenu.Sub that opens on SubTrigger pointerEnter and closes 150ms after pointer leaves either element.

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
- Returns structured JSON: `{ directionLabel, score, confidence, drivers, summary, examples, sources, recommendations, result, json, extractedText }`
- In-memory cache keyed by text hash or URL
- Kill switch: `NEUTRALEYE_KILL_SWITCH=true` → 503
- Source domain exclusion: when a URL is submitted, the source domain is injected into the prompt so the AI never suggests the same outlet as the article being analyzed

### `POST /api/extension` — Extension bias analysis
- Accepts `text` (plain), `url`, `headline` from extension popup
- Rate limit: 5 req/min per IP (env-configurable via `EXT_RATE_LIMIT_WINDOW_MS` / `EXT_RATE_LIMIT_MAX`) — backed by Upstash Redis (`ne:ext` key prefix), applies to ALL requests including authenticated
- Additional daily limit for authenticated users: 10/day via Supabase `daily_usage` table
- Auth: `Authorization: Bearer <token>` — resolves user, passes token through to Supabase client so RLS works
- Returns `{ result: "<markdown>", saved: boolean }`
- CORS: locked to the published extension's origin, `chrome-extension://fdkachmcdaebefhpkpjapoglbiakoffe`
- Source domain exclusion: same as `/api/analyze` — url is passed through to exclude the source outlet from suggestions

### `POST /api/extension-auth` — Extension login
- Accepts `{ email, password }` → Supabase `signInWithPassword()`
- Returns `{ accessToken, refreshToken, email, expiresAt }`
- Sign up is website-only; this endpoint is login only

### `GET /api/usage` — Check daily usage (authenticated)
### `POST /api/usage` — Increment daily usage (authenticated)

---

## Supabase

**Tables:**
- `analyses` — user analysis history (`id`, `user_id`, `created_at`, `input_type`, `url`, `title`, `direction`, `direction_label`, `confidence`, `score`, `summary`, `drivers`, `examples`, `sources`, `recommendations`, `request_meta`)
- `daily_usage` — daily request count (`user_id`, `usage_date`, `count`)

**Auth:** Email + password, Google OAuth. Sign up on website only; extension supports sign in only.

**Password reset:** Uses Supabase `resetPasswordForEmail` with `redirectTo: /auth/callback?next=/reset-password`. The existing `/auth/callback` route handles the code exchange; `/reset-password` calls `updateUser({ password })`.

**RLS:** Enabled on both tables. Policies: users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`). Migration SQL is at `supabase/migrations/20260601000000_rls_policies.sql`.

**Client keys:** Publishable key only — no service role key. RLS must be correctly configured in Supabase dashboard.

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

# Web analyze rate limit
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5

# Extension rate limit (falls back to web vars if not set)
EXT_RATE_LIMIT_WINDOW_MS=60000
EXT_RATE_LIMIT_MAX=5

# Upstash Redis — rate limiting (omit in local dev to fall back to in-memory)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry — error monitoring (set by Sentry wizard, also add to Vercel)
SENTRY_AUTH_TOKEN=
```

**Note:** Vercel env vars marked Sensitive cannot be pulled via `vercel env pull`. Add `OPENAI_WEBSITE_API_KEY` and `OPENAI_EXTENSION_API_KEY` to `.env.local` manually by creating new keys in the OpenAI dashboard, then updating both `.env.local` and Vercel.

---

## Dev Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npm run test      # Jest tests
```

---

## Code Style & Conventions

- **JS vs TS:** App pages, API routes, and components use `.js`. shadcn/ui components use `.tsx`. Follow the pattern of the file you're editing.
- **CSS:** CSS Modules (`.module.css`) for all non-ui components. Tailwind utility classes for `src/components/ui/` components.
- **Component structure:** Each component lives in its own folder: `ComponentName/ComponentName.js` + `ComponentName.module.css`
- **Imports:** Use `@/` alias for `src/` imports
- **Logging:** Always use `logEvent(level, event, meta)` in API routes — never raw `console.log`
- **No secrets in code:** All keys and URLs via environment variables only
- **Prompt changes:** Both `/api/analyze` and `/api/extension` share the same prompt structure — keep them in sync when editing either. Both also share the source-domain exclusion logic.

---

## Design System

- **Aesthetic:** Warm, editorial, not sterile — warm browns (`#8b6741`), off-whites (`#f8f4ee`), serif display font
- **Primary colour:** `#8b6741` (hover: `#6e4f2f`)
- **Upgrade to Pro button:** Dark near-black (`rgba(22,20,18,0.88)`) — flips to white when header scrolls over a dark section (`data-header-theme='dark'`). Not brand brown.
- **Components:** shadcn/ui + Radix UI primitives (`src/components/ui/`)
- **Animations:** Framer Motion
- **Fonts:** Geist Sans (body), Geist Mono (code/data), serif display via CSS variable
- **Theming:** Dark/light mode via `next-themes` + `ThemeProvider`
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

---

## Known Issues

- **Zoom / responsive scaling** — The canvas-frame guide lines (92rem, ≥1024px) are now implemented. General zoom/viewport edge cases may still exist — do not introduce layout patterns that rely on fixed pixel widths without testing at multiple zoom levels.
- **Support contact email** — `/support/page.js` uses `contact@tryneutraleye.com`. The inbox doesn't exist yet — create it once the domain is live.

---

## Roadmap

- **Stripe** — Pro tier payments; `useProAccess.js` is ready to wire up
- **Cloudflare** — DDoS protection and CDN
- **Supabase Auth URLs** — update redirect URLs in Supabase dashboard to `tryneutraleye.com` (domain is live, this is not done yet)
- **Transactional email** — integrate Resend for branded auth emails (signup confirm, password reset) from `contact@tryneutraleye.com`; see TODO comment in `login/page.js`

---

## Testing

```
src/lib/__tests__/normalizeResponse.test.js
src/lib/__tests__/resolveApiBase.test.js
src/app/analyze/__tests__/page.test.js
```

Run with `npm run test`.

# CLAUDE.md — NeutralEye Web

This file is the source of truth for Claude Code when working on the NeutralEye web project.
Read this before touching any code.

---

## Project Overview

NeutralEye is an AI-powered media bias checker. Users paste article text or submit a URL and receive a structured bias analysis: direction, confidence score, bias drivers, example quotes, and source recommendations.

There is no separate backend server. All backend logic lives as Next.js API Routes inside this repo, deployed on Vercel.

**Companion repo:** `neutraleye-extension` — Chrome extension frontend that calls this repo's API routes.

**Production domain (not yet live):** `tryneutraleye.com` — update Supabase Auth URL config once connected.

---

## Infrastructure

| Service     | Location                          | Notes                                            |
|-------------|-----------------------------------|--------------------------------------------------|
| Frontend    | `neutraleye-web` → Vercel         | Next.js 16, React 19                             |
| API Routes  | `src/app/api/` → Vercel           | All backend logic lives here, no separate server |
| Database    | Supabase                          | Auth + analyses + daily_usage tables, RLS active |
| Payments    | Stripe                            | Not yet set up                                   |
| Security    | Cloudflare                        | Planned                                          |
| Monitoring  | Sentry                            | Planned                                          |

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
    history/page.js         # User analysis history (Supabase-backed)
    methodology/page.js     # How NeutralEye works
    login/page.js           # Login + signup (email + Google OAuth) + forgot password flow
    reset-password/page.js  # Password reset — handles Supabase recovery redirect
    blog/                   # Blog with dynamic [slug] routing
    system/page.js          # System/about page (has dark hero section)
    compare/page.js         # Compare Analyses — Pro-gated with blur overlay
    settings/page.js        # User settings
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
    MarketingShell/         # Marketing/landing layout wrapper
    HeaderBar/              # App header
    SiteHeader/             # Marketing site header (scroll-aware dark/light theme)
    SiteFooter/             # Marketing site footer (Explore / Plans / Legal columns)
    Sidebar/                # App sidebar
    InputPanel/             # Article URL / text input
    ResultCard/             # Bias result display card
    ResultsHeader/          # Results page header
    ConfidenceRing/         # Animated confidence score ring
    DriverChips/            # Bias driver pill tags
    QuoteEvidence/          # Evidence quote display
    HistoryTable/           # Analysis history list
    AnalyzerCta/            # CTA button used across marketing pages
    HeroSystemVisualization/ # Animated graph on home hero
    ui/                     # shadcn/ui + custom animated components

  lib/
    api.js                  # Frontend → API route calls
    score.js                # Score/confidence normalization
    storage.js              # Local storage helpers
    content.js              # Blog helpers
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
- Rate limit: 5 req/min per IP (env-configurable via `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX`)
- Returns structured JSON: `{ directionLabel, score, confidence, drivers, summary, examples, sources, recommendations, result, json, extractedText }`
- In-memory cache keyed by text hash or URL
- Kill switch: `NEUTRALEYE_KILL_SWITCH=true` → 503
- Source domain exclusion: when a URL is submitted, the source domain is injected into the prompt so the AI never suggests the same outlet as the article being analyzed

### `POST /api/extension` — Extension bias analysis
- Accepts `text` (plain), `url`, `headline` from extension popup
- Rate limit: 5 req/min per IP (env-configurable via `EXT_RATE_LIMIT_WINDOW_MS` / `EXT_RATE_LIMIT_MAX`) — applies to ALL requests including authenticated
- Additional daily limit for authenticated users: 10/day via Supabase `daily_usage` table
- Auth: `Authorization: Bearer <token>` — resolves user, passes token through to Supabase client so RLS works
- Returns `{ result: "<markdown>", saved: boolean }`
- CORS: allows any `chrome-extension://` origin (lock to specific ID once published)
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

---

## Known Issues

- **Zoom / responsive scaling bugs** — Unresolved zoom and viewport scaling issues across pages. Do not introduce layout patterns that rely on fixed pixel widths without testing at multiple zoom levels.
- **Extension CORS** — Currently allows any `chrome-extension://` origin. Lock to specific extension ID once published to the Chrome Web Store.

---

## Roadmap

- **Stripe** — Pro tier payments; `useProAccess.js` is ready to wire up
- **Cloudflare** — DDoS protection and CDN
- **Sentry** — Error monitoring and alerting
- **Persistent rate limiting** — Replace in-memory rate limit store with Redis to survive cold starts
- **Extension CORS lockdown** — Restrict to specific extension ID post-publish
- **Domain** — `tryneutraleye.com` (not yet purchased); update Supabase Auth URL config and legal contact email once live

---

## Testing

```
src/lib/__tests__/normalizeResponse.test.js
src/lib/__tests__/resolveApiBase.test.js
src/app/analyze/__tests__/page.test.js
```

Run with `npm run test`.

# CLAUDE.md — NeutralEye Web

This file is the source of truth for Claude Code when working on the NeutralEye web project.
Read this before touching any code.

---

## Project Overview

NeutralEye is an AI-powered media bias checker. Users paste article text or submit a URL and receive a structured bias analysis: direction, confidence score, bias drivers, example quotes, and source recommendations.

The project consists of two repositories:

- **neutraleye-web** — Next.js frontend, hosted on Vercel
- **neutraleye-web-backend** — Node.js/Express backend, hosted on Render

**Status:** In active development. Running on localhost only. Not yet published.

---

## Repositories & Infrastructure

| Service     | Repo / Location                        | Notes                              |
|-------------|----------------------------------------|------------------------------------|
| Frontend    | `neutraleye-web` → Vercel              | Next.js 16, React 19               |
| Backend     | `neutraleye-web-backend` → Render      | Express, ESM, single `server.js`   |
| Database    | Supabase                               | Not yet set up — fresh setup planned |
| Payments    | Stripe                                 | Not yet set up                     |
| Security    | Cloudflare                             | Planned                            |
| Monitoring  | Sentry                                 | Planned                            |
| Domain      | tryneutraleye.com (or similar `.com`)  | To be purchased when ready         |

---

## Tech Stack

### Frontend (`neutraleye-web`)
- **Framework:** Next.js 16 (App Router), React 19
- **Language:** JavaScript (`.js`) with some TypeScript (`.tsx`) for UI components
- **Styling:** Tailwind CSS v4, CSS Modules (per-component `.module.css`)
- **Fonts:** Geist Sans + Geist Mono (via `geist` package), applied in `layout.js`
- **UI Components:** shadcn/ui (`src/components/ui/`) + Radix UI primitives
- **Animation:** Framer Motion
- **Theme:** `next-themes` via `ThemeProvider`
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint (Next.js config)

### Backend (`neutraleye-web-backend`)
- **Runtime:** Node.js with ESM (`"type": "module"`)
- **Framework:** Express 4
- **AI:** OpenAI SDK v5 (`openai` package) — key stored in `OPENAI_API_KEY`
- **Scraping:** `cheerio` + `node-fetch` for URL article extraction
- **Config:** `dotenv`
- **Entry point:** `server.js` (single file — all routes, middleware, and logic)

---

## Project Structure

### Frontend

```
src/
  app/                      # Next.js App Router pages
    page.js                 # Home / landing page
    analyze/page.js         # Core bias checker tool
    compare/page.js         # Article comparison (in progress)
    history/page.js         # User analysis history (requires Supabase auth)
    settings/page.js        # User settings
    methodology/page.js     # How NeutralEye works
    blog/                   # Blog with dynamic [slug] routing
    system/page.js          # Internal system/debug page
    extension-privacy/      # Extension privacy policy
    privacy/                # Privacy policy
    terms/                  # Terms of service
    layout.js               # Root layout — fonts, ThemeProvider, metadata
    globals.css             # Global styles

  components/
    AppShell/               # App-mode layout wrapper
    MarketingShell/         # Marketing/landing layout wrapper
    HeaderBar/              # App header
    SiteHeader/             # Marketing site header
    SiteFooter/             # Marketing site footer
    Sidebar/                # App sidebar
    InputPanel/             # Article URL / text input
    ResultCard/             # Bias result display card
    ResultsHeader/          # Results page header
    ConfidenceRing/         # Animated confidence score ring
    DriverChips/            # Bias driver pill tags
    QuoteEvidence/          # Evidence quote display
    HistoryTable/           # Analysis history list
    AnalyzerCta/            # CTA component
    HeroSystemVisualization/ # Animated hero graphic
    BiasDetectionFlowGraphic/ # Flow diagram graphic
    ui/                     # shadcn/ui + custom animated components

  lib/
    api.js                  # All frontend → backend API calls
    score.js                # Score/confidence normalization utilities
    storage.js              # Local storage helpers
    content.js              # Content/blog helpers
    types.js                # Shared type definitions
    utils.ts                # shadcn cn() utility
```

### Backend

```
neutraleye-web-backend/
  server.js       # Everything: Express app, middleware, routes, AI pipeline
  .env            # Environment variables (never commit)
  package.json    # ESM, Express, OpenAI, cheerio, node-fetch
```

---

## API Routes (Backend)

All routes are `POST` unless noted.

| Route           | Purpose                                          |
|-----------------|--------------------------------------------------|
| `GET /health`   | Health check — returns status and config flags   |
| `POST /analyze-text` | Analyze pasted article text                |
| `POST /analyze-url`  | Fetch URL, extract article text, analyze    |
| `POST /check-bias`   | Unified route — routes to text or URL handler based on payload |

**Request headers:**
- `x-client: web` — required for URL mode; identifies web client vs extension
- `x-request-id` — optional UUID for request tracing

**Rate limiting:** In-memory, per IP. Default: 5 requests per 60 seconds. Configurable via env vars.

**Caching:** In-memory `Map` cache keyed by URL or first 500 chars of text. Cleared on server restart.

---

## Frontend → Backend Communication (`src/lib/api.js`)

The frontend resolves the backend base URL from `NEXT_PUBLIC_NEUTRALEYE_API_URL`.

Key exports:
- `analyzeText(text)` → `POST /analyze-text`
- `analyzeUrl(url)` → `POST /analyze-url`
- `analyzeInput({ text, url })` → `POST /check-bias` (preferred unified method)

All responses are normalized through `normalizeResponse()` which handles legacy markdown format, JSON structured responses, and missing fields gracefully.

**Error handling:** `ApiError` class carries `status`, `code`, `requestId`, `endpoint`, `details`.

---

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_NEUTRALEYE_API_URL=http://localhost:3001
```

### Backend (`.env`)
```
PORT=3001
OPENAI_API_KEY=sk-...
AI_ANALYSIS_ENABLED=true
NEUTRALEYE_KILL_SWITCH=false
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5
MIN_TEXT_LENGTH=200
MIN_EXTRACTED_TEXT_LENGTH=300
MAX_ANALYSIS_TEXT_LENGTH=100000
MAX_EXTRACTED_TEXT_LENGTH=100000
```

> **Note:** The OpenAI API key will be rotated / switched to a different provider in the future. Keep AI provider calls isolated and easy to swap.

---

## Dev Commands

### Frontend
```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npm run test      # Jest tests
```

### Backend
```bash
npm start         # node server.js (production)
node server.js    # Direct run (development)
```

Backend auto-increments port if the configured port is already in use.

---

## Git Workflow

**Always create a new branch before making significant changes.**

- Never commit directly to `main`
- Branch naming: `feature/`, `fix/`, `chore/` prefixes
- Claude Code should create a new branch at the start of any substantial task
- Keep `main` as a clean, stable baseline at all times

---

## Roadmap & Planned Features

These are not yet built. Do not implement prematurely, but do not make architectural decisions that conflict with them.

### Auth & User Data (Supabase)
- User login/signup (email + OAuth)
- Per-user analysis history stored in Supabase
- Row-Level Security (RLS) policies — all DB queries must be written with RLS in mind
- History page (`/history`) is a stub waiting for Supabase integration

### Payments (Stripe)
- Pro tier with premium features (specifics TBD)
- Stripe integration on both frontend and backend

### Infrastructure
- Cloudflare for DDoS protection and CDN
- Sentry for error monitoring and alerting

### Prompt & Extraction Quality
- Fine-tune the article extraction logic (`extractArticleTextFromUrl` in `server.js`) to strip:
  - Ads and ad containers
  - Reader comments sections
  - Pull quotes that duplicate body text
  - Navigation, footers, sidebar widgets
  - Any non-article text that pollutes analysis
- Fine-tune the OpenAI bias analysis prompt for cleaner, more consistent structured output

### Design & Tooling
- Claude's design MCP plugin for component generation
- Explore 21st.dev for additional component inspiration

---

## Design System

- **Aesthetic:** Inspired by Variance.com — lively, animated, not sterile
- **Components:** shadcn/ui + Radix UI primitives (in `src/components/ui/`)
- **Animations:** Framer Motion
- **Fonts:** Geist Sans (body), Geist Mono (code/data)
- **Theming:** Dark/light mode via `next-themes` + `ThemeProvider`
- **Consistency:** Visual style must match the NeutralEye browser extension

When building new UI, prefer extending existing components in `src/components/ui/` before creating new ones.

---

## Known Issues

- **Zoom / responsive scaling bugs** — There are unresolved zoom and viewport scaling issues across pages. Do not introduce new layout patterns that rely on fixed pixel widths without testing at multiple zoom levels.

---

## Code Style & Conventions

- **JS vs TS:** App pages and components use `.js`. shadcn/ui components use `.tsx`. Follow the pattern of the file you're editing.
- **CSS:** CSS Modules (`.module.css`) for all non-ui components. Tailwind utility classes for `src/components/ui/` components.
- **Component structure:** Each component lives in its own folder: `ComponentName/ComponentName.js` + `ComponentName.module.css`
- **Imports:** Use `@/` alias for `src/` imports (configured in `tsconfig.json`)
- **Logging (backend):** Always use `logEvent(level, event, meta)` — never raw `console.log`
- **Errors (backend):** Always use `sendError(res, status, message, code, details)` — never `res.json({ error })` directly
- **API responses:** All backend responses go through `normalizeAiResult()` and are returned as structured JSON — never raw markdown
- **No secrets in code:** All keys and URLs via environment variables only

---

## Testing

```
src/lib/__tests__/normalizeResponse.test.js
src/lib/__tests__/resolveApiBase.test.js
src/app/analyze/__tests__/page.test.js
```

Run with `npm run test`. Add tests for any new utility functions in `src/lib/`.

---

## Playwright MCP

The `.playwright-mcp/` directory contains session logs from browser automation testing.
Do not delete it. Do not commit its contents (should be in `.gitignore`).

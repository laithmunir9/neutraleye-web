# NeutralEye — Web

The NeutralEye website: users submit an article URL or pasted text and get a structured analysis of how the article frames its story (direction, confidence, evidence quotes, suggested sources).

Live at [tryneutraleye.com](https://tryneutraleye.com), deployed on Vercel.

## Architecture

There is no separate backend server. All backend logic lives as Next.js API routes in `src/app/api/`:

- `POST /api/analyze` — website analysis (text or URL mode)
- `POST /api/extension` — analysis endpoint for the Chrome extension
- `POST /api/extension-auth` / `POST /api/extension-refresh` — extension login and token refresh
- `GET|POST /api/usage` — daily usage tracking (authenticated)
- `POST /api/support` — contact form (Resend)
- `POST /api/waitlist` — Pro waitlist signups

**Companion repo:** `neutraleye-extension` — the Chrome extension frontend that calls this repo's API routes.

## Stack

- Next.js (App Router), React
- Supabase — auth, `analyses` + `daily_usage` + `waitlist` tables, RLS enabled
- OpenAI — `gpt-4o` analysis, `gpt-4o-mini` article detection
- Upstash Redis — rate limiting (in-memory fallback for local dev)
- Sentry — error monitoring
- Resend — transactional email
- Tailwind CSS v4 + CSS Modules, shadcn/ui, Framer Motion

## Setup

Copy the environment variables listed in `CLAUDE.md` into `.env.local` (Supabase URL + publishable key, OpenAI keys, Upstash, Resend, Sentry).

```bash
npm install
npm run dev    # localhost:3000
npm run lint
npm run test
```

Note: `npm run build` may fail locally due to missing `@next/swc` native bindings; Vercel builds work fine.

See `CLAUDE.md` for the full project reference (conventions, design system, API details).

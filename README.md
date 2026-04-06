## NeutralEye Web

This project is the website frontend (`neutraleye-web`) and should point to the website-only backend (`neutraleye-web-backend`), not the extension backend.

## Environment

Create `.env.local` from `.env.local.example` and set:

```bash
NEXT_PUBLIC_NEUTRALEYE_API_URL=http://localhost:3000
```

`src/lib/api.js` resolves backend URL in this order:
1. `NEXT_PUBLIC_NEUTRALEYE_API_URL` (required)

## Local Development

Run the website:

```bash
npm install
npm run dev
```

Run the website backend (from `Desktop/neutraleye-web-backend`):

```bash
npm install
npm start
```

## Safety Boundary

- `bias-checker-backend`: extension backend (do not modify for website work)
- `neutraleye-web-backend`: website backend (safe place for website-only hardening)
- `bias-checker-frontend`: extension frontend (still points to extension backend)
- `neutraleye-web`: website frontend (points to website backend via env var)

## Deploy

Set `NEXT_PUBLIC_NEUTRALEYE_API_URL` in Vercel to the deployed URL of `neutraleye-web-backend`.

# NeutralEye web app

NeutralEye helps readers examine how news articles frame a story through tone, sourcing, emphasis, and omission. Readers can submit article text or a URL, inspect quoted evidence, and compare suggested sources from other perspectives. Results distinguish news, opinion, and analysis and include a confidence score.

[Use the web app](https://tryneutraleye.com) · [Install the Chrome extension](https://chromewebstore.google.com/detail/neutraleye-bias-checker/fdkachmcdaebefhpkpjapoglbiakoffe) · [Extension source](https://github.com/laithmunir9/neutraleye-extension)

## Architecture

This Next.js App Router project contains the site and its API. Both the website and extension use the same article analysis pipeline in `src/lib/analysis.js`.

- `POST /api/analyze` accepts website text or article URLs.
- `POST /api/extension` accepts article text from the extension.
- Extension sign-in and refresh routes use Supabase Auth.
- Supabase stores signed-in analyses and usage counts with row-level security.
- Upstash Redis provides request limits; Sentry records errors.

The analysis uses OpenAI. Server-side URL fetching validates destination addresses and limits redirects and response size. Analysis results are aids to critical reading, not a statement of objective truth.

## Local development

Use Node.js and npm. Copy `.env.example` to `.env.local` and fill in the values for your own services. Keep actual credentials out of Git. The Supabase URL and publishable key are intended for the browser; OpenAI and Upstash tokens must remain server-side.

```bash
npm ci
npm run dev
```

The site is available at `http://localhost:3000`. For checks, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Database changes are in `supabase/migrations/`. Apply them to the matching Supabase project before deploying code that depends on them. See the [website privacy policy](https://tryneutraleye.com/privacy) and [extension privacy policy](https://tryneutraleye.com/extension-privacy) for data handling.

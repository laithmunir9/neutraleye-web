// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d584bb0970067e4dd39cf4d5e4e22d22@o4512179528794112.ingest.us.sentry.io/4512179551600640",

  // Sample 10% of transactions — enough to spot slow endpoints without burning quota.
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Do not attach user IP addresses / headers to events — the extension privacy
  // policy promises no data retention for anonymous users.
  sendDefaultPii: false,
});

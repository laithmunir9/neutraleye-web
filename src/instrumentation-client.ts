// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e1c8341f1e517b590fe1196cc927387d@o4511531096014848.ingest.us.sentry.io/4511531149295616",

  // Sample 10% of transactions — enough to spot slow endpoints without burning quota.
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Do not attach user IP addresses / headers to events — the extension privacy
  // policy promises no data retention for anonymous users.
  sendDefaultPii: false,
});

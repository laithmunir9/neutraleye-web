import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseWsUrl = supabaseUrl.replace(/^http/, "ws");

// Content-Security-Policy
// - 'unsafe-inline' for script/style is required by Next.js's RSC bootstrap
//   scripts and CSS-in-JS; 'unsafe-eval' is only added in dev for Turbopack HMR.
// - connect-src allows Supabase (REST + realtime websocket) and Sentry ingest.
const csp = [
  "default-src 'self'",
  // va.vercel-scripts.com serves the Web Analytics collector. Without it the
  // <Analytics /> component mounts but its script is refused, in production as
  // well as dev, and no page views are recorded at all.
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.unsplash.com",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl} ${supabaseWsUrl} https://*.ingest.us.sentry.io${isDev ? " ws://localhost:*" : ""}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
  async redirects() {
    // Collapse the www duplicate into the apex so Google indexes one canonical
    // host (fixes Search Console "Duplicate without user-selected canonical").
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tryneutraleye.com" }],
        destination: "https://tryneutraleye.com/:path*",
        permanent: true,
      },
      // Pages removed in the site design pass. They were live and indexed, so
      // they redirect to the page that now answers the same question rather
      // than dead-ending a visitor arriving from search.
      { source: "/pricing", destination: "/reports", permanent: true },
      { source: "/compare", destination: "/reports", permanent: true },
      { source: "/extension", destination: "/tools", permanent: true },
      { source: "/support", destination: "/faq", permanent: true },
      // Built when the homepage was still the old consumer site, so it had to
      // carry the whole B2B argument alone. The homepage now makes that case
      // with the same worked example in the current design system, and
      // /how-it-works carries the positioning and delivery terms, so keeping it
      // meant two pages saying one thing with one of them visually behind.
      { source: "/for-comms", destination: "/", permanent: true },
      // Unpublished: its whole argument was how to read a confidence score and
      // a direction label, neither of which the analysis produces. /methodology
      // covers how to read a result without either.
      {
        source: "/blog/what-confidence-scores-actually-measure",
        destination: "/methodology",
        permanent: true,
      },
      // Renamed so the banned phrase does not survive in the URL.
      {
        source: "/blog/how-to-detect-bias-in-news",
        destination: "/blog/how-to-read-framing-in-news",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "laith-munir",

  project: "neutraleye-web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  }
});

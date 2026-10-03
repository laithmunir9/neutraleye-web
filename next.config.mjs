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

// Retired public paths, all permanently redirected to the homepage. The first
// group was removed in the 3 October 2026 restructure; the second had already
// been retired and used to point at pages that are now gone themselves.
// /for-comms, /pricing, /compare, /extension and /support were linked in
// outreach, so never reuse them for anything else (see CLAUDE.md).
const RETIRED_PATHS = [
  "/about",
  "/methodology",
  "/how-it-works",
  "/reports",
  "/tools",
  "/faq",
  "/changelog",
  "/overview",
  "/system",
  "/history",
  "/settings",
  "/blog",
  "/blog/:slug*",
  "/pricing",
  "/compare",
  "/extension",
  "/support",
  "/for-comms",
];

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
      // Retired pages. The site is the homepage tool plus legal pages, so
      // every page that used to explain or sell it lands on the tool itself
      // rather than dead-ending a visitor arriving from search or an old link.
      // Each one points straight at "/" so no request takes two hops.
      ...RETIRED_PATHS.map((source) => ({ source, destination: "/", permanent: true })),
      // Its job moved onto the homepage. Next carries the query string across,
      // so a saved /analyze?id= link opens the same result on "/".
      { source: "/analyze", destination: "/", permanent: true },
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

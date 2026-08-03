import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Deliberately not nonce-based: nonces would force every page to dynamic
// rendering, and Next.js's own hydration/inline styles need 'unsafe-inline'
// without one anyway. This still blocks the actual threats a CSP exists for
// (arbitrary third-party script/frame injection, clickjacking) while keeping
// the app's existing rendering behavior unchanged.
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.public.blob.vercel-storage.com;
  font-src 'self';
  connect-src 'self' https://*.razorpay.com https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://*.ingest.sentry.io https://*.public.blob.vercel-storage.com;
  frame-src https://*.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${isDev ? "" : "upgrade-insecure-requests;"}
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  // Lets a phone on the same LAN load dev assets (JS/CSS chunks) when hitting
  // the dev server's network URL instead of localhost — Next.js blocks
  // cross-origin dev requests by default since 15.3 to prevent DNS rebinding.
  // Dev-only; has no effect on production builds.
  allowedDevOrigins: ["10.240.184.226"],
  // pdfkit resolves its built-in font metrics (Helvetica.afm etc.) via
  // fs.readFileSync at a path relative to its own __dirname at runtime —
  // bundling it rewrites that path and breaks the lookup. Keeping it as a
  // real node_modules require (not bundled) is the standard fix.
  serverExternalPackages: ["pdfkit"],
  experimental: {
    // Default is 1MB, too small for digital-product/resume/photo uploads.
    // Kept under Vercel's ~4.5MB serverless function request body ceiling.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

// Wraps the config to enable automatic Sentry instrumentation. Source-map
// upload (org/project/authToken) only activates if SENTRY_AUTH_TOKEN is set
// in the build environment; without it, this just skips the upload silently
// and stack traces show minified code instead of the original source.
// disableLogger/automaticVercelMonitors are deliberately omitted: both are
// webpack-only and this project builds with Turbopack, so they're no-ops
// here (and only trigger deprecation-warning noise in the dev log).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});

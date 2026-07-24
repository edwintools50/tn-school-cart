import type { NextConfig } from "next";

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
  connect-src 'self' https://*.razorpay.com;
  frame-src https://*.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
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

export default nextConfig;

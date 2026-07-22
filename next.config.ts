import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB, too small for digital-product/resume/photo uploads.
    // Kept under Vercel's ~4.5MB serverless function request body ceiling.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;

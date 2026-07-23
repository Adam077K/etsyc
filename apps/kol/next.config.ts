import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained app (concept-lock D14) — pin the root so Next never walks
  // up to an unrelated lockfile outside this app.
  turbopack: { root: __dirname },
  // Keep the dev-tools badge out of screenshot captures — QA reviews
  // dev-server screenshots and the badge reads as stray UI.
  devIndicators: false,
  images: {
    // Stock-only imagery for this pass (real footage comes later). Real makers
    // making real things — Unsplash + Pexels hosted sources.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;

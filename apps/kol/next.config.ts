import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained app (concept-lock D14) — pin the root so Next never walks
  // up to an unrelated lockfile outside the monorepo.
  turbopack: { root: __dirname },
};

export default nextConfig;

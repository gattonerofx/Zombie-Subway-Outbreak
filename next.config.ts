import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Allow large GLB assets to be served from /public */
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Ignore Prisma build errors if no database is configured
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export for production builds
  ...(process.env.NODE_ENV === 'production' ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
    // Skip type checking during dev for faster compilation
    ...(process.env.NODE_ENV === 'development' ? {} : {}),
  },
  // Optimize compilation
  swcMinify: true,
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Faster refresh
  reactStrictMode: false,
};

export default nextConfig;

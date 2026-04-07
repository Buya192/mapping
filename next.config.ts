import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Allow the unzip binary and file system access in API routes
  serverExternalPackages: ['child_process', 'fs', 'path'],
};

export default nextConfig;

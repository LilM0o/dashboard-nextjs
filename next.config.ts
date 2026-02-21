import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Force dynamic rendering for all routes
  output: 'standalone',
  
  // Enable experimental features if needed
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
};

export default nextConfig;

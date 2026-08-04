import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`, // Редиректим запросы на Django
      },
      {
        source: '/media/:path*',
        destination: `${API_URL}/media/:path*`
      }
    ];
  },
};

export default nextConfig;

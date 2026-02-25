import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.cedarcashhomebuyers.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    SALESFORCE_CLIENT_ID: process.env.SALESFORCE_CLIENT_ID,
    SALESFORCE_CLIENT_SECRET: process.env.SALESFORCE_CLIENT_SECRET,
  },
};

export default nextConfig;

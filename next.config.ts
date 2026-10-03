import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yepzdnrtsaoydmtbzsmh.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

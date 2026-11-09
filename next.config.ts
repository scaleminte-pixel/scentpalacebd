import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  devIndicators: false,
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // keep pages cached in memory for 1 hour in dev
    pagesBufferLength: 50,          // retain up to 50 pages in buffer
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

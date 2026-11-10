import fs from 'node:fs';

// Patch Node 26 Windows bug where fs.readlink on non-symlink throws EISDIR instead of EINVAL
if (process.platform === 'win32') {
  const origReadlink = fs.readlink;
  fs.readlink = function(path, options, callback) {
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'object' ? options : {};
    origReadlink.call(fs, path, opts, (err, res) => {
      if (err && err.code === 'EISDIR') {
        const e = new Error('EINVAL: invalid argument, readlink');
        e.code = 'EINVAL';
        return cb(e);
      }
      cb(err, res);
    });
  };

  const origReadlinkSync = fs.readlinkSync;
  fs.readlinkSync = function(path, options) {
    try {
      return origReadlinkSync.call(fs, path, options);
    } catch (err) {
      if (err && err.code === 'EISDIR') {
        const e = new Error('EINVAL: invalid argument, readlink');
        e.code = 'EINVAL';
        throw e;
      }
      throw err;
    }
  };

  if (fs.promises && fs.promises.readlink) {
    const origReadlinkPromise = fs.promises.readlink;
    fs.promises.readlink = async function(path, options) {
      try {
        return await origReadlinkPromise.call(fs.promises, path, options);
      } catch (err) {
        if (err && err.code === 'EISDIR') {
          const e = new Error('EINVAL: invalid argument, readlink');
          e.code = 'EINVAL';
          throw e;
        }
        throw err;
      }
    };
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  devIndicators: false,
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 50,
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;


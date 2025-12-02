/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure we can use fs in API routes/Server Components
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

module.exports = nextConfig;


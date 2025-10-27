/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  webpack: (config, { isServer }) => {
    // Handle WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle node modules that need to be transpiled
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Fix for wagmi and ethers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: process.env.GRAPHQL_ENDPOINT || 'http://localhost:4350/graphql',
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
};

// Bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
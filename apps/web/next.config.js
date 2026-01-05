/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Включаем экспериментальные функции для улучшения кэширования
  experimental: {
    // Турбо-режим для более быстрой разработки
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Оптимизация для production сборки
  productionBrowserSourceMaps: false,

  // Webpack кэширование для быстрых пересборок
  webpack: (config, { dev, isServer }) => {
    // Включаем кэширование в режиме разработки
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: '.next/cache/webpack',
      };
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'aimaqaqshamy.kz',
      },
      {
        protocol: 'https',
        hostname: '**.aimaqaqshamy.kz',
      },
      {
        protocol: 'http',
        hostname: 'aimaqaqshamy.kz',
      },
      {
        protocol: 'http',
        hostname: '**.aimaqaqshamy.kz',
      },
      {
        protocol: 'https',
        hostname: 'aimak-api.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'aimak-api-w8ps.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'aimak-api-j4rs.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    // Настройки качества изображений
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
}

module.exports = nextConfig

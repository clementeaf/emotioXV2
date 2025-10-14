const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 HABILITAR EXPORT ESTÁTICO PARA S3
  output: 'export',
  trailingSlash: true,

  // 🔧 Configurar workspace root para monorepo
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuración para imágenes y rutas
  images: {
    unoptimized: true,
  },
  // Configuración para App Router
  experimental: {
    scrollRestoration: true,
    // Permitir importaciones desde fuera del directorio
    externalDir: true
  },
  // Transpilación de paquetes externos
  transpilePackages: ['../shared'], // Habilitado para resolver imports
  webpack: (config) => {
    // Resolver correctamente los módulos compartidos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // AGREGAR ALIAS @shared
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@shared': path.resolve(__dirname, '../shared'),
    };

    return config;
  },
  // Configuración específica para AWS Amplify
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 🎯 Headers para Seeso.io
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  }

  // 🎯 REWRITES REMOVIDOS
  // Con output: 'export', Next.js no soporta rewrites/redirects/headers
  // Las llamadas API se manejan directamente desde client-config.ts
  // que apunta a https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev/
}

module.exports = nextConfig

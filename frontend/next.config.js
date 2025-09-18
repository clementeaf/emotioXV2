const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 HABILITAR EXPORT ESTÁTICO PARA S3
  output: 'export',
  trailingSlash: true,

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
  
  // 🎯 CONFIGURAR REWRITES PARA USAR AWS LAMBDA
  async rewrites() {
    // Solo aplicar rewrites en desarrollo para evitar conflictos
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev/:path*',
        },
      ];
    }
    return [];
  }
  // Las funciones headers y redirects han sido eliminadas para evitar warnings con output: 'export'.
}

module.exports = nextConfig

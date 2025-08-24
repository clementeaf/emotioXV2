const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración diferente para dev vs producción
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export', // Solo en producción para S3
    trailingSlash: true,
  }),
  
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
  }
  // Las funciones headers y redirects han sido eliminadas para evitar warnings con output: 'export'.
}

module.exports = nextConfig

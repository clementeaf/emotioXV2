/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para imágenes y rutas
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Configuración para App Router
  experimental: {
    scrollRestoration: true,
    // Permitir importaciones desde fuera del directorio
    externalDir: true
  },
  // Transpilación de paquetes externos
  // transpilePackages: ['../shared'], // Comentado temporalmente para deployment
  webpack: (config) => {
    // Resolver correctamente los módulos compartidos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
  // Configuración específica para AWS Amplify
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Configuración de headers para Amplify
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // Configuración de redirecciones para Amplify
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        permanent: false,
      },
    ];
  }
}

module.exports = nextConfig

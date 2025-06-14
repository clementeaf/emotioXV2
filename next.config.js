/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración optimizada para Amplify
  output: 'standalone', // Requerido para SSR en Amplify
  reactStrictMode: true,
  // Desactivar verificaciones durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración para imágenes y rutas
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Configuración experimental mínima
  experimental: {
    scrollRestoration: true,
    // Permitir importaciones desde fuera del directorio
    externalDir: true
  },
  // Transpilación de paquetes externos
  transpilePackages: ['../shared'],
  // Habilitar soporte para Amplify
  webpack: (config) => {
    // Resolver correctamente los módulos compartidos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
  // Configuración de rutas para Amplify
  async rewrites() {
    return [
      {
        source: '/research/:id*',
        destination: '/research/[id]'
      }
    ];
  }
}

module.exports = nextConfig

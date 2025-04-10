/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cambiar a exportación estática para Amplify
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
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
  // Configuración para App Router
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
  // Configuración de redirecciones
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  }
}

module.exports = nextConfig

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
  }
  // Nota: Los headers se han eliminado porque no son compatibles con output: 'export'
  // Las redirecciones se manejan a nivel de componente para compatibilidad con exportación estática
}

module.exports = nextConfig

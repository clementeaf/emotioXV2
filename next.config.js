/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  // Desactivar todas las características avanzadas para debugging
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Simplificar al máximo la configuración
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Deshabilitar toda experimentación
  experimental: {
    // Solo incluir configuraciones esenciales
    scrollRestoration: true,
  }
}

module.exports = nextConfig 
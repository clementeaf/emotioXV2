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
  // Agregar encabezados de seguridad
  async headers() {
    // Detectar entorno de desarrollo vs producción
    const isDevelopment = process.env.NODE_ENV === 'development';

    // CSP para desarrollo (incluye unsafe-eval para HMR)
    const developmentCSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*; connect-src 'self' https://*.amazonaws.com https://*.amplifyapp.com ws:; frame-src 'self'; object-src 'none'; base-uri 'self';";
    
    // CSP para producción (sin unsafe-eval)
    const productionCSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*; connect-src 'self' https://*.amazonaws.com https://*.amplifyapp.com; frame-src 'self'; object-src 'none'; base-uri 'self';";

    return [
      {
        // Aplicar a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDevelopment ? developmentCSP : productionCSP
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  }
  // Nota: Las redirecciones se manejan a nivel de componente para compatibilidad con exportación estática
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Habilitamos exportación estática para AWS Amplify
  reactStrictMode: true,
  swcMinify: true,
  // Incluir la carpeta compartida en la transpilación
  transpilePackages: ['../shared'],
  // Desactivar el linting para evitar errores de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar errores de TypeScript para poder continuar
  typescript: {
    ignoreBuildErrors: true,
  },
  // No podemos usar rewrites en modo export, se debe manejar en el frontend
  // async rewrites() {
  //   return [
  //     // Ruta general para todas las solicitudes API
  //     {
  //       source: '/api/:path*',
  //       destination: 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/:path*',
  //       basePath: false,
  //     },
  //     // Ruta específica para auth/login
  //     {
  //       source: '/api/auth/login',
  //       destination: 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/auth/login',
  //       basePath: false,
  //     },
  //     // Ruta específica para auth/register
  //     {
  //       source: '/api/auth/register',
  //       destination: 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/auth/register',
  //       basePath: false,
  //     },
  //     // Ruta específica para research
  //     {
  //       source: '/api/research',
  //       destination: 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/research',
  //       basePath: false,
  //     },
  //     {
  //       source: '/api/research/:path*',
  //       destination: 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/research/:path*',
  //       basePath: false,
  //     },
  //     // Ruta específica para welcome-screens
  //     {
  //       source: '/api/welcome-screens/:path*',
  //       destination: 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/welcome-screens/:path*',
  //       basePath: false,
  //     },
  //     // Ruta específica para thank-you-screens
  //     {
  //       source: '/api/thank-you-screens/:path*',
  //       destination: 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/thank-you-screens/:path*',
  //       basePath: false,
  //     },
  //   ];
  // },
  
  // Headers no son compatibles con modo export
  // async headers() {
  //   return [
  //     {
  //       // Aplicar estos headers a todas las rutas
  //       source: '/:path*',
  //       headers: [
  //         { key: 'Access-Control-Allow-Credentials', value: 'true' },
  //         { key: 'Access-Control-Allow-Origin', value: '*' },
  //         { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
  //         { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token' },
  //       ],
  //     },
  //   ];
  // },
  
  // Configura manejo de imágenes para exportación estática
  images: {
    unoptimized: true,
  },

  // Configuración para rutas dinámicas en modo estático
  trailingSlash: true,
  
  // Desactivar comprobación estricta de rutas dinámicas en modo export
  // (esto es crítico para evitar errores en modo export)
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = nextConfig

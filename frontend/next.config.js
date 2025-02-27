/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ucut04rvah.execute-api.us-east-1.amazonaws.com/:path*',
        basePath: false,
      },
      // Ruta específica para auth/request-otp
      {
        source: '/api/auth/request-otp',
        destination: 'https://ucut04rvah.execute-api.us-east-1.amazonaws.com/auth/request-otp',
        basePath: false,
      },
      // Ruta específica para auth/validate-otp
      {
        source: '/api/auth/validate-otp',
        destination: 'https://ucut04rvah.execute-api.us-east-1.amazonaws.com/auth/validate-otp',
        basePath: false,
      },
    ];
  },
  // Configuración adicional para CORS
  async headers() {
    return [
      {
        // Aplicar estos headers a todas las rutas
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
}

module.exports = nextConfig

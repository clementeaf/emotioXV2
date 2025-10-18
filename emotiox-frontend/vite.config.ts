import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 11500,
    host: true
  },
  define: {
    // Make environment variables available to the client
    'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(process.env.VITE_API_ENDPOINT || 'http://localhost:3000'),
    'import.meta.env.VITE_WEBSOCKET_ENDPOINT': JSON.stringify(process.env.VITE_WEBSOCKET_ENDPOINT || 'ws://localhost:3001'),
    'import.meta.env.VITE_PUBLIC_TESTS_URL': JSON.stringify(process.env.VITE_PUBLIC_TESTS_URL || 'http://localhost:4700'),
    // Add more environment variables that the app needs
    'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.STAGE': JSON.stringify(process.env.STAGE || 'dev'),
    'import.meta.env.SERVICE_NAME': JSON.stringify(process.env.SERVICE_NAME || 'emotioxv2'),
    'import.meta.env.APP_REGION': JSON.stringify(process.env.APP_REGION || 'us-east-1'),
    'import.meta.env.API_ENDPOINT': JSON.stringify(process.env.API_ENDPOINT || 'http://localhost:3000'),
  },
  envPrefix: 'VITE_',
})

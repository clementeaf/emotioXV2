import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Generar un hash simple basado en la fecha/hora del build
const buildHash = Date.now().toString(36)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-build-hash',
      transformIndexHtml(html) {
        return html.replace(/__BUILD_HASH__/g, buildHash)
      },
    },
  ],
  define: {
    'import.meta.env.VITE_BUILD_HASH': JSON.stringify(buildHash),
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        // ... existing code ...
      }
    },
  },
})

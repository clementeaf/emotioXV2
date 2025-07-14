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
      '@shared': path.resolve(__dirname, '../shared/dist'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@tanstack/react-query', 'zustand'],
          'vendor-utils': ['date-fns', 'lodash'],

          // Feature chunks - usar archivos específicos en lugar de directorios
          'cognitive-tasks': [
            './src/components/cognitiveTask/CognitiveTaskView.tsx',
            './src/components/cognitiveTask/PreferenceTestTask.tsx',
            './src/components/cognitiveTask/NavigationFlowTask.tsx',
            './src/components/cognitiveTask/tasks.ts'
          ],
          'smart-voc': [
            './src/components/smartVoc/CSATView.tsx',
            './src/components/smartVoc/NPSView.tsx',
            './src/components/smartVoc/EmotionSelectionView.tsx',
            './src/components/smartVoc/AgreementScaleView.tsx',
            './src/components/smartVoc/DifficultyScaleView.tsx'
          ],
          'demographics': [
            './src/components/demographics/DemographicsForm.tsx'
          ],
          'flow': [
            './src/components/flow/CurrentStepRenderer.tsx',
            './src/components/flow/FlowStepContent.tsx',
            './src/hooks/useFlowBuilder.ts'
          ],
          'auth': [
            './src/pages/ParticipantLogin.tsx',
            './src/components/auth/AuthSubmitButton.tsx',
            './src/components/auth/AuthLegalText.tsx',
            './src/components/auth/AuthHeader.tsx',
            './src/services/auth.service.ts'
          ],
          'common': [
            './src/components/common/FormSubmitButton.tsx',
            './src/components/common/TextAreaField.tsx',
            './src/components/common/RadioButtonGroup.tsx',
            './src/components/common/CheckboxGroup.tsx',
            './src/components/common/FormField.tsx',
            './src/components/common/ErrorDisplay.tsx',
            './src/components/common/LoadingIndicator.tsx'
          ],
          'ui': [
            './src/components/ui/Button.tsx',
            './src/components/ui/Card.tsx',
            './src/components/ui/Modal.tsx',
            './src/components/ui/Input.tsx',
            './src/components/ui/Alert.tsx'
          ]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash].js';
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Aumentar límite a 1MB
    target: 'es2015', // Target más amplio para mejor compatibilidad
    minify: 'terser', // Usar terser para mejor minificación
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log en producción
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'zustand',
      'date-fns'
    ],
    exclude: ['../shared']
  }
})

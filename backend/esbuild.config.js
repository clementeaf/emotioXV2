module.exports = {
  // Configuración para el bundler esbuild
  bundle: true,
  minify: false,
  sourcemap: true,
  platform: 'node',
  target: 'node18',
  outdir: '.build',
  external: [
    'aws-sdk',
    'aws-sdk/*',
    '@aws-sdk/*'
  ],
  // Preservar nombres de módulos para mejor depuración
  keepNames: true,
  // Incluir todos los archivos de código fuente
  include: ['src/**/*'],
  // No incluir archivos de prueba
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
  // Transformadores para TypeScript
  tsconfig: './tsconfig.json',
  // Manejo específico para dependencias
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  // Banners para incluir información adicional
  banner: {
    js: '// Built with esbuild - https://esbuild.github.io/'
  }
}; 
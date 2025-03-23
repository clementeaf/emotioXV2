/**
 * Script para preparar el despliegue
 * - Limpia el directorio dist y archivos temporales
 * - Compila el código TypeScript
 * - Genera la configuración necesaria
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const checkRequirements = require('./check-requirements');

// Rutas principales
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const NODE_MODULES_DIR = path.join(ROOT_DIR, 'node_modules');
const SERVERLESS_DIR = path.join(ROOT_DIR, '.serverless');
const WEBPACK_DIR = path.join(ROOT_DIR, '.webpack');

// Función principal
function prepareDeploy() {
  try {
    console.log('🚀 Preparando despliegue...');
    
    // Verificar requisitos
    const requirementsResult = checkRequirements();
    if (requirementsResult !== 0) {
      console.error('❌ No se cumplen los requisitos necesarios para el despliegue');
      process.exit(1);
    }
    
    // Limpiar directorios
    console.log('🧹 Limpiando directorios...');
    cleanDirectories();
    
    // Instalar dependencias si es necesario
    if (!fs.existsSync(path.join(NODE_MODULES_DIR, '.package-lock.json'))) {
      console.log('📦 Instalando dependencias...');
      execSync('npm ci', { stdio: 'inherit', cwd: ROOT_DIR });
    }
    
    // Compilar código
    console.log('🔨 Compilando código...');
    execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });
    
    console.log('✅ Preparación completa. Listo para desplegar!');
    return 0;
  } catch (error) {
    console.error('❌ Error al preparar el despliegue:', error);
    return 1;
  }
}

// Limpiar directorios
function cleanDirectories() {
  // Limpiar dist
  if (fs.existsSync(DIST_DIR)) {
    console.log(`Eliminando ${DIST_DIR}`);
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  
  // Limpiar .serverless
  if (fs.existsSync(SERVERLESS_DIR)) {
    console.log(`Eliminando ${SERVERLESS_DIR}`);
    fs.rmSync(SERVERLESS_DIR, { recursive: true, force: true });
  }
  
  // Limpiar .webpack
  if (fs.existsSync(WEBPACK_DIR)) {
    console.log(`Eliminando ${WEBPACK_DIR}`);
    fs.rmSync(WEBPACK_DIR, { recursive: true, force: true });
  }
  
  // Crear dist
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const result = prepareDeploy();
  process.exit(result);
}

module.exports = prepareDeploy; 
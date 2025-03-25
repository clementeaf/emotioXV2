/**
 * Script para actualizar la configuración del frontend
 * - Lee el archivo endpoints.json generado por el script fix-endpoints.js
 * - Copia los endpoints al directorio del frontend
 * - Actualiza el archivo .env del frontend con las URLs
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Rutas de los archivos
const backendEndpointsPath = path.join(__dirname, '..', 'endpoints.json');
const frontendEndpointsPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'config', 'endpoints.json');
const frontendEnvPath = path.join(__dirname, '..', '..', 'frontend', '.env');
const frontendEnvExamplePath = path.join(__dirname, '..', '..', 'frontend', '.env.example');

// Función principal
async function updateFrontendConfig() {
  try {
    console.log('🔄 Actualizando configuración del frontend...');

    // Verificar si existe el archivo de endpoints
    if (!fs.existsSync(backendEndpointsPath)) {
      console.error('❌ No se encontró el archivo endpoints.json');
      return;
    }

    // Leer el archivo de endpoints
    const endpointsData = fs.readFileSync(backendEndpointsPath, 'utf8');
    const endpoints = JSON.parse(endpointsData);

    // Crear directorio para endpoints del frontend si no existe
    const frontendConfigDir = path.dirname(frontendEndpointsPath);
    if (!fs.existsSync(frontendConfigDir)) {
      fs.mkdirSync(frontendConfigDir, { recursive: true });
    }

    // Guardar endpoints en el frontend
    fs.writeFileSync(frontendEndpointsPath, JSON.stringify(endpoints, null, 2));
    console.log('✅ Endpoints copiados al frontend:', frontendEndpointsPath);

    // Actualizar .env del frontend
    updateFrontendEnv(endpoints);

    console.log('✅ Configuración del frontend actualizada correctamente');
  } catch (error) {
    console.error('❌ Error al actualizar configuración del frontend:', error);
    process.exit(1);
  }
}

// Función para actualizar el archivo .env del frontend
function updateFrontendEnv(endpoints) {
  try {
    const websocketUrl = endpoints.websocketUrl;

    // Crear variables de entorno para el frontend
    // Ya no incluimos VITE_API_URL porque ahora se obtiene dinámicamente de endpoints.json
    const envContent = `
# API Configuration
# La URL base ahora se obtiene directamente de endpoints.json
VITE_WS_URL=${websocketUrl}
VITE_APP_ENV=${process.env.STAGE || 'dev'}
VITE_DIRECT_API=true
`;

    // Guardar archivo .env
    fs.writeFileSync(frontendEnvPath, envContent.trim());
    console.log('✅ Archivo .env del frontend actualizado (sin URL hardcodeada)');

    // Actualizar también .env.example si existe
    if (fs.existsSync(frontendEnvExamplePath)) {
      fs.writeFileSync(frontendEnvExamplePath, envContent.trim());
      console.log('✅ Archivo .env.example del frontend actualizado');
    }
  } catch (error) {
    console.error('❌ Error al actualizar .env del frontend:', error);
  }
}

// Ejecutar el script
updateFrontendConfig(); 
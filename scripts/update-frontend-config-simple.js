/**
 * Script simple para actualizar la configuración del frontend
 * Este script toma la URL base de la API como parámetro y actualiza la configuración del frontend
 * 
 * Uso: node update-frontend-config-simple.js <api-url> <ws-url> <stage>
 * Ejemplo: node update-frontend-config-simple.js https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com wss://pgfnp44rj1.execute-api.us-east-1.amazonaws.com dev
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Verificar argumentos
const apiUrl = process.argv[2];
const wsUrl = process.argv[3];
const stage = process.argv[4] || 'dev';

if (!apiUrl || !wsUrl) {
  console.error(`${colors.red}Error: Debes proporcionar la URL base de la API y la URL de WebSocket${colors.reset}`);
  console.error(`${colors.yellow}Uso: node update-frontend-config-simple.js <api-url> <ws-url> <stage>${colors.reset}`);
  console.error(`${colors.yellow}Ejemplo: node update-frontend-config-simple.js https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com wss://pgfnp44rj1.execute-api.us-east-1.amazonaws.com dev${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.cyan}Actualizando configuración del frontend con:${colors.reset}`);
console.log(`${colors.blue}API URL: ${apiUrl}${colors.reset}`);
console.log(`${colors.blue}WebSocket URL: ${wsUrl}${colors.reset}`);
console.log(`${colors.blue}Stage: ${stage}${colors.reset}`);

// Crear configuración para el frontend
const frontendConfig = {
  API_URL: apiUrl,
  WEBSOCKET_URL: wsUrl,
  STAGE: stage,
  REGION: process.env.AWS_REGION || 'us-east-1',
};

// Ruta al directorio frontend
const frontendPath = path.resolve(__dirname, '..', 'frontend');
console.log(`${colors.blue}Usando ruta del frontend: ${frontendPath}${colors.reset}`);

// Actualizar .env del frontend
const envContent = Object.entries(frontendConfig)
  .map(([key, value]) => `NEXT_PUBLIC_${key}=${value}`)
  .join('\n');

const envFilePath = path.join(frontendPath, '.env');
fs.writeFileSync(envFilePath, envContent + '\n');
console.log(`${colors.green}✓ Archivo .env actualizado: ${envFilePath}${colors.reset}`);

// Actualizar archivo de configuración de runtime
const runtimeConfig = {
  apiUrl: frontendConfig.API_URL,
  websocketUrl: frontendConfig.WEBSOCKET_URL,
  stage: frontendConfig.STAGE,
  region: frontendConfig.REGION,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [`http://localhost:3000`],
};

// Asegurar que existe el directorio
const configDir = path.join(frontendPath, 'src', 'config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Escribir archivo de configuración
const configFilePath = path.join(configDir, `config.${stage}.json`);
fs.writeFileSync(configFilePath, JSON.stringify(runtimeConfig, null, 2));
console.log(`${colors.green}✓ Archivo de configuración actualizado: ${configFilePath}${colors.reset}`);

// Actualizar archivo api.config.ts
updateApiConfig(frontendConfig, frontendPath);

console.log(`${colors.green}✓ Configuración del frontend actualizada exitosamente${colors.reset}`);

function updateApiConfig(config, frontendPath) {
  const apiConfigPath = path.join(frontendPath, 'src', 'config', 'api.config.ts');
  
  // Verificar si el archivo existe
  if (!fs.existsSync(apiConfigPath)) {
    console.log(`${colors.yellow}⚠ El archivo api.config.ts no existe. No se actualizará.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.blue}Actualizando api.config.ts...${colors.reset}`);
  
  try {
    // Leer el archivo actual
    let apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');
    
    // Actualizar las URLs
    if (config.API_URL) {
      apiConfigContent = apiConfigContent.replace(
        /apiUrl: .*?,/g, 
        `apiUrl: process.env.NEXT_PUBLIC_API_URL || '${config.API_URL}',`
      );
    }
    
    if (config.WEBSOCKET_URL) {
      apiConfigContent = apiConfigContent.replace(
        /websocketUrl: .*?,/g, 
        `websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || '${config.WEBSOCKET_URL}',`
      );
      
      // Si no existe la propiedad websocketUrl, agregarla después de apiUrl
      if (!apiConfigContent.includes('websocketUrl:')) {
        apiConfigContent = apiConfigContent.replace(
          /(apiUrl: .*?,)/g, 
          `$1\n  websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || '${config.WEBSOCKET_URL}',`
        );
      }
    }
    
    // Actualizar stage y region
    apiConfigContent = apiConfigContent.replace(
      /stage: .*?,/g, 
      `stage: process.env.NEXT_PUBLIC_STAGE || '${config.STAGE}',`
    );
    
    apiConfigContent = apiConfigContent.replace(
      /region: .*?,/g, 
      `region: process.env.NEXT_PUBLIC_REGION || '${config.REGION}',`
    );
    
    // Guardar el archivo actualizado
    fs.writeFileSync(apiConfigPath, apiConfigContent);
    console.log(`${colors.green}✓ Archivo api.config.ts actualizado${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Error actualizando api.config.ts:${colors.reset}`, error);
  }
} 
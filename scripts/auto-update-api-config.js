/**
 * Script para actualizar automáticamente la configuración de la API en el frontend
 * después de un despliegue de serverless.
 * 
 * Este script:
 * 1. Ejecuta serverless deploy para desplegar el backend
 * 2. Extrae las URLs de la salida del comando serverless deploy
 * 3. Actualiza la configuración del frontend con las URLs
 * 
 * Uso: node auto-update-api-config.js <stage>
 * Ejemplo: node auto-update-api-config.js dev
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Obtener la etapa del despliegue
const stage = process.argv[2] || 'dev';
console.log(`${colors.cyan}Actualizando configuración para la etapa: ${stage}${colors.reset}`);

// Función para ejecutar un script
const runScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Ejecutando script: ${scriptPath} ${args.join(' ')}${colors.reset}`);
    
    const process = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}Script ${scriptPath} ejecutado correctamente${colors.reset}`);
        resolve();
      } else {
        console.error(`${colors.red}Error al ejecutar el script ${scriptPath}, código de salida: ${code}${colors.reset}`);
        reject(new Error(`Error al ejecutar el script ${scriptPath}`));
      }
    });
  });
};

// Función para desplegar el backend y extraer las URLs
const deployAndExtractUrls = (stage) => {
  try {
    // Ruta al directorio backendV2
    const backendPath = path.resolve(__dirname, '..', 'backendV2');
    console.log(`${colors.blue}Desplegando backend desde: ${backendPath}${colors.reset}`);
    
    // Ejecutar serverless deploy
    console.log(`${colors.cyan}Ejecutando serverless deploy --stage ${stage}...${colors.reset}`);
    const output = execSync(
      `cd "${backendPath}" && npx serverless deploy --stage ${stage}${process.env.AWS_PROFILE ? ` --profile ${process.env.AWS_PROFILE}` : ''}`,
      { encoding: 'utf8' }
    );
    
    console.log(`${colors.green}Despliegue completado${colors.reset}`);
    console.log(output);
    
    // Verificar si no hubo cambios que desplegar
    if (output.includes('No changes to deploy') || output.includes('Deployment skipped')) {
      console.log(`${colors.yellow}No se detectaron cambios en el despliegue. Obteniendo información con serverless info...${colors.reset}`);
      
      const serverlessOutput = execSync(
        `cd "${backendPath}" && npx serverless info --stage ${stage} --verbose${process.env.AWS_PROFILE ? ` --profile ${process.env.AWS_PROFILE}` : ''}`,
        { encoding: 'utf8' }
      );
      
      console.log(`${colors.green}Información de serverless obtenida:${colors.reset}`);
      console.log(serverlessOutput);
      
      // Extraer las URLs de la salida de serverless info
      const endpoints = serverlessOutput.match(/endpoints:([\s\S]*?)functions:/);
      let httpApiEndpoint = '';
      let wsApiEndpoint = '';
      
      if (endpoints && endpoints[1]) {
        const endpointsText = endpoints[1];
        
        // Buscar la primera línea con ANY - https://
        const httpMatch = endpointsText.match(/ANY - (https:\/\/[^\/]+)/);
        if (httpMatch && httpMatch[1]) {
          httpApiEndpoint = httpMatch[1];
          console.log(`${colors.green}API HTTP encontrado: ${httpApiEndpoint}${colors.reset}`);
        }
        
        // Buscar la línea con wss://
        const wsMatch = endpointsText.match(/(wss:\/\/[^\s]+)/);
        if (wsMatch && wsMatch[1]) {
          wsApiEndpoint = wsMatch[1];
          console.log(`${colors.green}WebSocket encontrado: ${wsApiEndpoint}${colors.reset}`);
        }
      }
      
      return { httpApiEndpoint, wsApiEndpoint };
    }
    
    // Extraer las URLs de la salida
    const endpoints = output.match(/endpoints:([\s\S]*?)functions:/);
    let httpApiEndpoint = '';
    let wsApiEndpoint = '';
    
    if (endpoints && endpoints[1]) {
      const endpointsText = endpoints[1];
      
      // Buscar la primera línea con ANY - https://
      const httpMatch = endpointsText.match(/ANY - (https:\/\/[^\/]+)/);
      if (httpMatch && httpMatch[1]) {
        httpApiEndpoint = httpMatch[1];
        console.log(`${colors.green}API HTTP encontrado: ${httpApiEndpoint}${colors.reset}`);
      }
      
      // Buscar la línea con wss://
      const wsMatch = endpointsText.match(/(wss:\/\/[^\s]+)/);
      if (wsMatch && wsMatch[1]) {
        wsApiEndpoint = wsMatch[1];
        console.log(`${colors.green}WebSocket encontrado: ${wsApiEndpoint}${colors.reset}`);
      }
    }
    
    return { httpApiEndpoint, wsApiEndpoint };
  } catch (error) {
    console.error(`${colors.red}Error desplegando el backend:${colors.reset}`, error);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    // Desplegar el backend y extraer las URLs
    const { httpApiEndpoint, wsApiEndpoint } = deployAndExtractUrls(stage);
    
    if (!httpApiEndpoint && !wsApiEndpoint) {
      console.error(`${colors.red}No se pudieron extraer las URLs de la salida del despliegue${colors.reset}`);
      process.exit(1);
    }
    
    // Ruta al script de actualización de configuración del frontend
    const updateFrontendConfigScript = path.resolve(__dirname, 'update-frontend-config-simple.js');
    
    // Verificar si el script existe
    if (!fs.existsSync(updateFrontendConfigScript)) {
      console.error(`${colors.red}El script ${updateFrontendConfigScript} no existe${colors.reset}`);
      process.exit(1);
    }
    
    // Ejecutar el script de actualización de configuración del frontend
    await runScript(updateFrontendConfigScript, [httpApiEndpoint, wsApiEndpoint, stage]);
    
    console.log(`${colors.green}Configuración de la API actualizada correctamente${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error en el script:${colors.reset}`, error);
    process.exit(1);
  }
};

// Ejecutar el script
main(); 
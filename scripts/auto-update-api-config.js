/**
 * Script para actualizar automáticamente la configuración de la API en el frontend
 * después de un despliegue de serverless.
 * 
 * Este script:
 * 1. Obtiene información del stack de CloudFormation o del despliegue de serverless
 * 2. Actualiza el archivo endpoints.json en el frontend
 * 3. Actualiza la configuración de la API en el frontend
 * 4. Proporciona un mecanismo para detectar automáticamente los endpoints en entornos de desarrollo o producción
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Obtener la etapa del despliegue
const stage = process.argv[2] || 'dev';
console.log(`Actualizando configuración para la etapa: ${stage}`);

// Función para ejecutar un script
const runScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando script: ${scriptPath} ${args.join(' ')}`);
    
    const process = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`Script ${scriptPath} ejecutado correctamente`);
        resolve();
      } else {
        console.error(`Error al ejecutar el script ${scriptPath}, código de salida: ${code}`);
        reject(new Error(`Error al ejecutar el script ${scriptPath}`));
      }
    });
  });
};

// Función principal
const main = async () => {
  try {
    // Ruta al script de actualización de configuración del frontend
    const updateFrontendConfigScript = path.resolve(__dirname, '../backend/scripts/update-frontend-config.js');
    
    // Verificar si el script existe
    if (!fs.existsSync(updateFrontendConfigScript)) {
      console.error(`El script ${updateFrontendConfigScript} no existe`);
      process.exit(1);
    }
    
    // Ejecutar el script de actualización de configuración del frontend
    await runScript(updateFrontendConfigScript, [stage]);
    
    console.log('Configuración de la API actualizada correctamente');
  } catch (error) {
    console.error(`Error en el script: ${error.message}`);
    process.exit(1);
  }
};

// Ejecutar el script
main(); 
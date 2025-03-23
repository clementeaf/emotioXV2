/**
 * Script para actualizar la configuración del frontend con las salidas del despliegue de serverless
 * Este script se ejecuta después del despliegue para actualizar automáticamente la configuración del frontend
 */

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Configuración de AWS
const configureAWS = (stage) => {
  const region = process.env.AWS_REGION || 'us-east-1';
  AWS.config.update({ region });
  console.log(`AWS configurado para la región: ${region}, etapa: ${stage}`);
};

// Obtener las salidas del stack de CloudFormation
const getStackOutputs = async (stackName) => {
  try {
    const cloudformation = new AWS.CloudFormation();
    const { Stacks } = await cloudformation.describeStacks({ StackName: stackName }).promise();
    
    if (!Stacks || Stacks.length === 0) {
      throw new Error(`No se encontró el stack: ${stackName}`);
    }
    
    const outputs = {};
    Stacks[0].Outputs.forEach(output => {
      outputs[output.OutputKey] = output.OutputValue;
    });
    
    return outputs;
  } catch (error) {
    console.error(`Error al obtener las salidas del stack: ${error.message}`);
    return null;
  }
};

// Generar configuración de desarrollo local
const generateLocalDevConfig = () => {
  console.log('Generando configuración de desarrollo local...');
  
  return {
    ServiceEndpoint: 'http://localhost:4700/api',
    WebSocketEndpoint: 'ws://localhost:4700',
    Region: process.env.AWS_REGION || 'us-east-1',
    Stage: 'dev',
    ResearchTableName: 'ResearchTable-dev',
    WelcomeScreenTableName: 'WelcomeScreenTable-dev',
    UserPoolId: 'local-user-pool',
    UserPoolClientId: 'local-user-pool-client',
    IdentityPoolId: 'local-identity-pool'
  };
};

// Actualizar el archivo de configuración del frontend
const updateFrontendConfig = async (outputs, stage) => {
  // Si no hay salidas y estamos en desarrollo local, generamos una configuración local
  if (!outputs && stage === 'dev') {
    outputs = generateLocalDevConfig();
    console.log('Usando configuración de desarrollo local');
  } else if (!outputs) {
    console.error('No hay salidas para actualizar la configuración del frontend');
    return false;
  }
  
  try {
    // Actualizar el archivo outputs.json
    const outputsPath = path.resolve(__dirname, '../../frontend/src/config/outputs.json');
    fs.writeFileSync(outputsPath, JSON.stringify(outputs, null, 2));
    console.log(`Archivo outputs.json actualizado en: ${outputsPath}`);
    
    // Actualizar el archivo api.config.ts
    const apiConfigPath = path.resolve(__dirname, '../../frontend/src/config/api.config.ts');
    let apiConfig = fs.readFileSync(apiConfigPath, 'utf8');
    
    // Actualizar la URL de la API según la etapa
    if (outputs.ServiceEndpoint) {
      const apiUrl = outputs.ServiceEndpoint;
      
      // Reemplazar la URL de la API según la etapa
      if (stage === 'dev') {
        apiConfig = apiConfig.replace(
          /baseURL: .*?\|\|.*?\(isDevelopmentMode\(\) \? ['"].*?['"] : ['"].*?['"]\)/,
          `baseURL: process.env.NEXT_PUBLIC_API_URL || (isDevelopmentMode() ? '${apiUrl}' : 'https://api.emotio-x.com')`
        );
      } else if (stage === 'test') {
        apiConfig = apiConfig.replace(
          /baseURL: .*?\|\|.*?\(isDevelopmentMode\(\) \? ['"].*?['"] : ['"].*?['"]\)/,
          `baseURL: process.env.NEXT_PUBLIC_API_URL || (isDevelopmentMode() ? 'http://localhost:4700/api' : '${apiUrl}')`
        );
      } else if (stage === 'prod') {
        apiConfig = apiConfig.replace(
          /baseURL: .*?\|\|.*?\(isDevelopmentMode\(\) \? ['"].*?['"] : ['"].*?['"]\)/,
          `baseURL: process.env.NEXT_PUBLIC_API_URL || (isDevelopmentMode() ? 'http://localhost:4700/api' : '${apiUrl}')`
        );
      }
      
      fs.writeFileSync(apiConfigPath, apiConfig);
      console.log(`Archivo api.config.ts actualizado con la URL de la API: ${apiUrl}`);
    } else {
      console.warn('No se encontró la URL del servicio en las salidas');
    }
    
    // Actualizar el archivo endpoints.json
    await updateEndpoints();
    
    // Crear o actualizar el archivo .env
    updateEnvFile(outputs, stage);
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar la configuración del frontend: ${error.message}`);
    return false;
  }
};

// Actualizar los endpoints
const updateEndpoints = async () => {
  try {
    const sourceFile = path.resolve(__dirname, '../endpoints.json');
    const targetDir = path.resolve(__dirname, '../../frontend/src/config');
    const targetFile = path.join(targetDir, 'endpoints.json');
    
    // Verificar si existe el archivo fuente
    if (!fs.existsSync(sourceFile)) {
      console.warn(`El archivo de endpoints no existe: ${sourceFile}`);
      
      // Crear un archivo de endpoints básico si no existe
      const basicEndpoints = {
        "requestOTP": {
          "POST": "/auth/request-otp"
        },
        "validateOTP": {
          "POST": "/auth/validate-otp"
        },
        "logout": {
          "POST": "/auth/logout"
        },
        "createUser": {
          "POST": "/users"
        },
        "getUser": {
          "GET": "/users/me"
        },
        "updateUser": {
          "PUT": "/users/me"
        },
        "deleteUser": {
          "DELETE": "/users/me"
        },
        "optionsHandler": {
          "OPTIONS": "/*"
        },
        "research": {
          "CREATE": "/research",
          "GET": "/research/{id}",
          "LIST": "/research",
          "UPDATE": "/research/{id}",
          "DELETE": "/research/{id}",
          "UPDATE_STATUS": "/research/{id}/status",
          "UPDATE_STAGE": "/research/{id}/stage"
        }
      };
      
      // Crear el archivo de endpoints básico
      fs.writeFileSync(sourceFile, JSON.stringify(basicEndpoints, null, 2));
      console.log(`Archivo de endpoints básico creado: ${sourceFile}`);
    }
    
    // Crear el directorio si no existe
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copiar el archivo
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Archivo endpoints.json copiado de ${sourceFile} a ${targetFile}`);
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar los endpoints: ${error.message}`);
    return false;
  }
};

// Actualizar el archivo .env
const updateEnvFile = (outputs, stage) => {
  try {
    const envPath = path.resolve(__dirname, '../../frontend/.env');
    
    // Crear contenido del archivo .env
    const envContent = [
      `NEXT_PUBLIC_API_URL=${outputs.ServiceEndpoint || ''}`,
      `NEXT_PUBLIC_WEBSOCKET_URL=${outputs.WebSocketEndpoint || ''}`,
      `NEXT_PUBLIC_STAGE=${stage}`,
      `NEXT_PUBLIC_REGION=${outputs.Region || process.env.AWS_REGION || 'us-east-1'}`,
      `NEXT_PUBLIC_USER_POOL_ID=${outputs.UserPoolId || ''}`,
      `NEXT_PUBLIC_USER_POOL_CLIENT_ID=${outputs.UserPoolClientId || ''}`,
      `NEXT_PUBLIC_IDENTITY_POOL_ID=${outputs.IdentityPoolId || ''}`,
      ''  // Línea vacía al final
    ].join('\n');
    
    // Escribir el archivo .env
    fs.writeFileSync(envPath, envContent);
    console.log(`Archivo .env actualizado: ${envPath}`);
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar el archivo .env: ${error.message}`);
    return false;
  }
};

// Función principal
const main = async () => {
  try {
    // Obtener la etapa del despliegue
    const stage = process.argv[2] || 'dev';
    console.log(`Actualizando configuración para la etapa: ${stage}`);
    
    // Configurar AWS
    configureAWS(stage);
    
    // Obtener el nombre del stack
    const serviceName = 'backend';
    const stackName = `${serviceName}-${stage}`;
    console.log(`Obteniendo salidas del stack: ${stackName}`);
    
    // Obtener las salidas del stack
    const outputs = await getStackOutputs(stackName);
    
    // Actualizar la configuración del frontend
    const updated = await updateFrontendConfig(outputs, stage);
    
    if (updated) {
      console.log('Configuración del frontend actualizada correctamente');
    } else {
      console.error('Error al actualizar la configuración del frontend');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error en el script: ${error.message}`);
    process.exit(1);
  }
};

// Ejecutar el script
main(); 
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Configuración de AWS
AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.SharedIniFileCredentials({ profile: process.env.AWS_PROFILE || 'default' })
});

const cloudformation = new AWS.CloudFormation();

async function getStackOutputs(env) {
  const stackName = `emotiox-backend-${env}`;

  try {
    console.log(`${colors.cyan}Obteniendo información del stack ${stackName}...${colors.reset}`);
    
    const { Stacks } = await cloudformation.describeStacks({
      StackName: stackName
    }).promise();

    if (!Stacks || Stacks.length === 0) {
      throw new Error(`No se encontró el stack ${stackName}`);
    }

    const outputs = {};
    Stacks[0].Outputs.forEach(output => {
      outputs[output.OutputKey] = output.OutputValue;
    });

    console.log(`${colors.green}✓ Información del stack obtenida correctamente${colors.reset}`);
    return outputs;
  } catch (error) {
    console.error(`${colors.red}✗ Error obteniendo información del stack ${stackName}:${colors.reset}`, error);
    
    // Intentar obtener la información mediante serverless info
    try {
      console.log(`${colors.yellow}Intentando obtener información mediante serverless info...${colors.reset}`);
      
      const serverlessOutput = execSync(
        `cd backend && npx serverless info --stage ${env} --verbose${process.env.AWS_PROFILE ? ` --profile ${process.env.AWS_PROFILE}` : ''}`,
        { encoding: 'utf8' }
      );
      
      // Extraer las URLs de la salida de serverless info
      const httpApiMatch = serverlessOutput.match(/HttpApiEndpoint: (https:\/\/[^\s]+)/);
      const wsApiMatch = serverlessOutput.match(/WebSocketEndpoint: (wss:\/\/[^\s]+)/);
      
      const outputs = {};
      
      if (httpApiMatch && httpApiMatch[1]) {
        outputs.HttpApiEndpoint = httpApiMatch[1];
      }
      
      if (wsApiMatch && wsApiMatch[1]) {
        outputs.WebSocketEndpoint = wsApiMatch[1];
      }
      
      if (Object.keys(outputs).length > 0) {
        console.log(`${colors.green}✓ Información obtenida mediante serverless info${colors.reset}`);
        return outputs;
      } else {
        throw new Error('No se pudo extraer la información de las URLs');
      }
    } catch (fallbackError) {
      console.error(`${colors.red}✗ Error al intentar obtener información mediante serverless info:${colors.reset}`, fallbackError);
      throw error;
    }
  }
}

async function updateFrontendConfig(env) {
  console.log(`${colors.cyan}Actualizando configuración del frontend para ambiente: ${env}${colors.reset}`);

  try {
    // Obtener outputs del stack de CloudFormation
    const outputs = await getStackOutputs(env);
    
    // Crear configuración para el frontend
    const frontendConfig = {
      API_URL: outputs.HttpApiEndpoint || '',
      WEBSOCKET_URL: outputs.WebSocketEndpoint || '',
      STAGE: env,
      REGION: process.env.AWS_REGION || 'us-east-1',
    };

    console.log(`${colors.blue}Configuración a aplicar:${colors.reset}`);
    console.log(frontendConfig);

    // Actualizar .env del frontend
    const envContent = Object.entries(frontendConfig)
      .map(([key, value]) => `NEXT_PUBLIC_${key}=${value}`)
      .join('\n');

    const envFilePath = path.join(process.cwd(), 'frontend', '.env');
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
    const configDir = path.join(process.cwd(), 'frontend', 'src', 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Escribir archivo de configuración
    const configFilePath = path.join(configDir, `config.${env}.json`);
    fs.writeFileSync(configFilePath, JSON.stringify(runtimeConfig, null, 2));
    console.log(`${colors.green}✓ Archivo de configuración actualizado: ${configFilePath}${colors.reset}`);

    // Actualizar archivo api.config.ts
    updateApiConfig(frontendConfig);

    console.log(`${colors.green}✓ Configuración del frontend actualizada exitosamente${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✗ Error actualizando la configuración del frontend:${colors.reset}`, error);
    process.exit(1);
  }
}

function updateApiConfig(config) {
  const apiConfigPath = path.join(process.cwd(), 'frontend', 'src', 'config', 'api.config.ts');
  
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

// Ejecutar el script
const env = process.argv[2];
if (!['dev', 'test', 'prod'].includes(env)) {
  console.error(`${colors.red}Error: El ambiente debe ser dev, test o prod${colors.reset}`);
  process.exit(1);
}

updateFrontendConfig(env);
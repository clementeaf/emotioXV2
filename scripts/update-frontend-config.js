const { CloudFormationClient, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');
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

// Creamos el cliente de CloudFormation usando AWS SDK v3
const cloudformationClient = new CloudFormationClient({
  region: process.env.AWS_REGION || 'us-east-1'
  // No usamos credenciales explícitas para permitir que AWS use las credenciales del sistema
});

async function getStackOutputs(env) {
  const stackName = `emotioxv2-backend-${env}`;  // Actualizamos el nombre del stack para que coincida con lo que muestra serverless

  try {
    console.log(`${colors.cyan}Obteniendo información del stack ${stackName}...${colors.reset}`);
    
    const command = new DescribeStacksCommand({
      StackName: stackName
    });
    
    const response = await cloudformationClient.send(command);
    const stacks = response.Stacks;

    if (!stacks || stacks.length === 0) {
      throw new Error(`No se encontró el stack ${stackName}`);
    }

    const outputs = {};
    stacks[0].Outputs.forEach(output => {
      outputs[output.OutputKey] = output.OutputValue;
    });

    console.log(`${colors.green}✓ Información del stack obtenida correctamente${colors.reset}`);
    return outputs;
  } catch (error) {
    console.error(`${colors.red}✗ Error obteniendo información del stack ${stackName}:${colors.reset}`, error);
    
    // Intentar obtener la información mediante serverless info
    try {
      console.log(`${colors.yellow}Intentando obtener información mediante serverless info...${colors.reset}`);
      
      // Calculamos la ruta al backendV2 desde donde estamos
      const backendPath = path.resolve(__dirname, '..', 'backendV2');
      
      console.log(`${colors.blue}Usando ruta del backend: ${backendPath}${colors.reset}`);
      
      const serverlessOutput = execSync(
        `cd "${backendPath}" && npx serverless info --stage ${env} --verbose${process.env.AWS_PROFILE ? ` --profile ${process.env.AWS_PROFILE}` : ''}`,
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
      
      const outputs = {};
      if (httpApiEndpoint) {
        outputs.HttpApiEndpoint = httpApiEndpoint;
      }
      
      if (wsApiEndpoint) {
        outputs.WebSocketEndpoint = wsApiEndpoint;
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
    const configFilePath = path.join(configDir, `config.${env}.json`);
    fs.writeFileSync(configFilePath, JSON.stringify(runtimeConfig, null, 2));
    console.log(`${colors.green}✓ Archivo de configuración actualizado: ${configFilePath}${colors.reset}`);

    // Actualizar archivo api.config.ts
    updateApiConfig(frontendConfig, frontendPath);

    console.log(`${colors.green}✓ Configuración del frontend actualizada exitosamente${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✗ Error actualizando la configuración del frontend:${colors.reset}`, error);
    process.exit(1);
  }
}

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

// Ejecutar el script
const env = process.argv[2];
if (!['dev', 'test', 'prod'].includes(env)) {
  console.error(`${colors.red}Error: El ambiente debe ser dev, test o prod${colors.reset}`);
  process.exit(1);
}

updateFrontendConfig(env);
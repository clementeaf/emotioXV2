/**
 * Script para exportar los endpoints de la API al frontend
 * Este script lee los archivos generados por los plugins serverless-export-outputs y serverless-plugin-export-endpoints
 * y crea un archivo de configuración que el frontend puede importar.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Rutas de los archivos generados por los plugins
const outputsPath = path.resolve(__dirname, '../outputs.json');
const endpointsPath = path.resolve(__dirname, '../endpoints.json');

// Ruta donde se guardarán los archivos de configuración para el frontend
const frontendConfigDir = path.resolve(__dirname, '../../frontend/src/config');
const frontendConfigPath = path.resolve(frontendConfigDir, 'api-endpoints.js');
const frontendConfigPathTs = path.resolve(frontendConfigDir, 'api-endpoints.ts');
const frontendEndpointsJsonPath = path.resolve(frontendConfigDir, 'endpoints.json');
const frontendOutputsJsonPath = path.resolve(frontendConfigDir, 'outputs.json');

// Valores por defecto
const DEFAULT_STAGE = process.env.STAGE || 'dev';
const DEFAULT_REGION = process.env.REGION || 'us-east-1';

// Función para obtener información del último despliegue
function getDeploymentInfo() {
  try {
    // Leer el estado del despliegue desde .serverless/serverless-state.json
    const serverlessStatePath = path.resolve(__dirname, '../.serverless/serverless-state.json');
    
    if (fs.existsSync(serverlessStatePath)) {
      const serverlessState = JSON.parse(fs.readFileSync(serverlessStatePath, 'utf8'));
      
      // Extraer información relevante
      const serviceName = serverlessState.service.service;
      const stage = serverlessState.service.provider.stage;
      const region = serverlessState.service.provider.region;
      
      // Intentar obtener el endpoint de API Gateway
      let apiEndpoint = '';
      let websocketEndpoint = '';
      
      try {
        // Obtener endpoints usando AWS CLI
        const apiInfo = JSON.parse(
          execSync(
            `aws apigateway get-rest-apis --query "items[?name=='${serviceName}-${stage}']"`,
            { encoding: 'utf8' }
          )
        );
        
        if (apiInfo && apiInfo.length > 0) {
          const apiId = apiInfo[0].id;
          apiEndpoint = `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;
        }
        
        // También podríamos obtener el endpoint WebSocket, pero es más complejo
      } catch (error) {
        console.warn('No se pudo obtener información desde AWS CLI:', error.message);
      }
      
      // Si no pudimos obtener la información desde AWS, usar la información del archivo de estado
      if (!apiEndpoint && serverlessState.service.provider.compiledCloudFormationTemplate &&
          serverlessState.service.provider.compiledCloudFormationTemplate.Outputs) {
        
        const outputs = serverlessState.service.provider.compiledCloudFormationTemplate.Outputs;
        
        if (outputs.ServiceEndpoint) {
          apiEndpoint = outputs.ServiceEndpoint.Value;
        } else if (outputs.ApiEndpoint) {
          apiEndpoint = outputs.ApiEndpoint.Value;
        }
      }
      
      // Si aún no tenemos el endpoint, construirlo manualmente
      if (!apiEndpoint) {
        // Intentar obtener el ID de la API Gateway desde el estado
        let apiId = '';
        
        // Buscar en los recursos para encontrar el ID de API Gateway
        if (serverlessState.service.provider.compiledCloudFormationTemplate &&
            serverlessState.service.provider.compiledCloudFormationTemplate.Resources) {
            
            const resources = serverlessState.service.provider.compiledCloudFormationTemplate.Resources;
            
            for (const key in resources) {
                if (resources[key].Type === 'AWS::ApiGateway::RestApi') {
                    // Usar el ID lógico para intentar construir el ID físico
                    apiId = `\${ApiGatewayRestApi}`;
                    break;
                }
            }
        }
        
        // Si no encontramos el ID, usamos el último despliegue exitoso
        if (!apiId) {
            try {
                const infoOutput = execSync('serverless info --verbose', { encoding: 'utf8' });
                const endpointMatch = infoOutput.match(/endpoints:\s+ANY - (https:\/\/[^\/]+)/);
                
                if (endpointMatch && endpointMatch[1]) {
                    apiEndpoint = endpointMatch[1];
                }
            } catch (error) {
                console.warn('No se pudo obtener información del último despliegue:', error.message);
            }
        }
        
        // Como último recurso, intentar con el ID de despliegue actual
        if (!apiEndpoint) {
            // Este es nuestro último intento de obtener el endpoint
            try {
                const stackInfoOutput = execSync(`serverless info --verbose --stage ${stage}`, { encoding: 'utf8' });
                console.log('Stack info:', stackInfoOutput);
                
                // Buscar cualquier URL que parezca un endpoint
                const urlMatch = stackInfoOutput.match(/(https:\/\/[^\/\s]+)/);
                if (urlMatch && urlMatch[1]) {
                    apiEndpoint = `${urlMatch[1]}/${stage}`;
                }
            } catch (error) {
                console.warn('No se pudo obtener información del stack:', error.message);
            }
        }
      }
      
      return {
        serviceName,
        stage,
        region,
        apiEndpoint,
        websocketEndpoint
      };
    }
  } catch (error) {
    console.warn('Error al leer el estado del despliegue:', error.message);
  }
  
  return null;
}

// Función para resolver referencias de CloudFormation
function resolveCloudFormationRefs(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Si es un objeto Fn::Join, concatenar los valores directamente
  if (obj["Fn::Join"] && Array.isArray(obj["Fn::Join"]) && obj["Fn::Join"].length >= 2) {
    const separator = obj["Fn::Join"][0];
    const values = obj["Fn::Join"][1];
    
    // Resolver cada valor y unirlos
    return values.map(val => {
      if (typeof val === 'object' && val !== null) {
        // Aquí simplemente usamos un valor por defecto para Ref
        if (val.Ref === "ApiGatewayRestApi") {
          return "4hdn6j00e6";
        } else if (val.Ref === "AWS::Region") {
          return "us-east-1";
        } else if (val.Ref === "AWS::URLSuffix") {
          return "amazonaws.com";
        } else {
          return val.Ref || "[ref]";
        }
      }
      return val;
    }).join(separator);
  }
  
  // Si es un objeto AWS::Region o similar, devolvemos un valor por defecto
  if (obj.Ref === "AWS::Region") {
    return "us-east-1";
  } else if (obj.Ref === "ApiGatewayRestApi") {
    return "4hdn6j00e6";
  } else if (obj.Ref === "AWS::URLSuffix") {
    return "amazonaws.com";
  }
  
  // Si es un objeto con una única propiedad Value, devolvemos ese valor
  if (obj.Value && Object.keys(obj).length === 1) {
    return resolveCloudFormationRefs(obj.Value);
  }
  
  // Caso especial para los endpoints
  if (obj.apiUrl && typeof obj.apiUrl === 'object') {
    const resolvedUrl = resolveCloudFormationRefs(obj.apiUrl);
    if (resolvedUrl) {
      obj.apiUrl = resolvedUrl;
    } else {
      // Valor por defecto seguro
      obj.apiUrl = "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev";
    }
  }
  
  // Recursivamente resolver todas las propiedades del objeto
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = resolveCloudFormationRefs(obj[key]);
    }
  }
  
  return obj;
}

// Función adicional para corregir URLs que contienen [object Object]
function sanitizeUrls(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Base URL segura
  const safeBaseUrl = "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev";
  
  // Para cada propiedad en el objeto
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Si es una cadena y contiene [object Object]
      if (typeof value === 'string' && value.includes('[object Object]')) {
        // Reemplazar con URL segura
        if (value.endsWith('/auth')) {
          obj[key] = `${safeBaseUrl}/auth`;
        } else if (value.endsWith('/research')) {
          obj[key] = `${safeBaseUrl}/research`;
        } else if (value.endsWith('/welcome-screens')) {
          obj[key] = `${safeBaseUrl}/welcome-screens`;
        } else if (value.endsWith('/thank-you-screens')) {
          obj[key] = `${safeBaseUrl}/thank-you-screens`;
        } else {
          // Solo reemplazar la parte [object Object] con la base URL
          obj[key] = value.replace('[object Object]', safeBaseUrl);
        }
      } else if (typeof value === 'object') {
        // Recursivamente sanitizar objetos anidados
        obj[key] = sanitizeUrls(value);
      }
    }
  }
  
  return obj;
}

// Función principal
async function exportEndpoints() {
  try {
    // Asegurarse de que existan los directorios
    if (!fs.existsSync(frontendConfigDir)) {
      fs.mkdirSync(frontendConfigDir, { recursive: true });
    }
    
    let outputs = {};
    let endpoints = {};
    let deploymentInfo = null;
    
    // Intentar leer archivos de outputs y endpoints generados por los plugins
    const pluginsGeneratedFiles = fs.existsSync(outputsPath) && fs.existsSync(endpointsPath);
    
    if (pluginsGeneratedFiles) {
      console.log('✅ Archivos generados por plugins encontrados, utilizando esos datos.');
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'));
      
      // Resolver referencias de CloudFormation si existen
      outputs = resolveCloudFormationRefs(outputs);
      endpoints = resolveCloudFormationRefs(endpoints);
    } else {
      console.log('⚠️ Archivos generados por plugins no encontrados, generando manualmente.');
      
      // Obtener información del despliegue
      deploymentInfo = getDeploymentInfo();
      
      if (deploymentInfo && deploymentInfo.apiEndpoint) {
        console.log('✅ Información del despliegue obtenida correctamente.');
        
        // Crear outputs manualmente
        outputs = {
          ServiceEndpoint: deploymentInfo.apiEndpoint,
          WebSocketEndpoint: deploymentInfo.websocketEndpoint || '',
          Region: deploymentInfo.region,
          Stage: deploymentInfo.stage,
          AuthApiUrl: `${deploymentInfo.apiEndpoint}/auth`,
          ResearchApiUrl: `${deploymentInfo.apiEndpoint}/research`,
          WelcomeScreenApiUrl: `${deploymentInfo.apiEndpoint}/welcome-screens`,
          EyeTrackingRecruitApiUrl: `${deploymentInfo.apiEndpoint}/eye-tracking-recruit`
        };
        
        // Crear un objeto endpoints simple
        endpoints = {
          endpointsData: `HttpApiUrl = "${deploymentInfo.apiEndpoint}"`
        };
        
        // Guardar los archivos para uso futuro
        fs.writeFileSync(outputsPath, JSON.stringify(outputs, null, 2));
        fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2));
        
        console.log('✅ Archivos de configuración generados y guardados en el proyecto.');
      } else {
        console.error('❌ No se pudo obtener información del despliegue.');
        
        // Usar valores por defecto o buscar en despliegues previos
        try {
          const prevInfoOutput = execSync('serverless info', { encoding: 'utf8' });
          console.log('Información del servidor:', prevInfoOutput);
          
          const endpointMatch = prevInfoOutput.match(/ANY - (https:\/\/[^\/\s]+)/);
          if (endpointMatch && endpointMatch[1]) {
            const apiEndpoint = endpointMatch[1] + '/' + DEFAULT_STAGE;
            
            outputs = {
              ServiceEndpoint: apiEndpoint,
              WebSocketEndpoint: '',
              Region: DEFAULT_REGION,
              Stage: DEFAULT_STAGE,
              AuthApiUrl: `${apiEndpoint}/auth`,
              ResearchApiUrl: `${apiEndpoint}/research`,
              WelcomeScreenApiUrl: `${apiEndpoint}/welcome-screens`,
              EyeTrackingRecruitApiUrl: `${apiEndpoint}/eye-tracking-recruit`
            };
            
            endpoints = {
              endpointsData: `HttpApiUrl = "${apiEndpoint}"`
            };
          } else {
            throw new Error('No se encontró ningún endpoint en la información del servidor');
          }
        } catch (error) {
          console.error('❌ No se pudo obtener información de despliegues previos:', error.message);
          
          console.log('⚠️ Utilizando valores por defecto.');
          // Usar los valores actuales desplegados
          outputs = {
            ServiceEndpoint: "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev",
            WebSocketEndpoint: "wss://pgfnp44rj1.execute-api.us-east-1.amazonaws.com/dev",
            Region: DEFAULT_REGION,
            Stage: DEFAULT_STAGE,
            AuthApiUrl: "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/auth",
            ResearchApiUrl: "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/research",
            WelcomeScreenApiUrl: "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/welcome-screens",
            EyeTrackingRecruitApiUrl: "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/eye-tracking-recruit"
          };
          
          endpoints = {
            endpointsData: `HttpApiUrl = "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev"`
          };
        }
      }
    }
    
    // Crear archivo de endpoints.json para el frontend
    const apiBaseUrl = resolveCloudFormationRefs(outputs.ServiceEndpoint || '');
    const frontendEndpoints = {
      apiUrl: apiBaseUrl,
      websocketUrl: resolveCloudFormationRefs(outputs.WebSocketEndpoint || ''),
      endpoints: {
        auth: {
          register: `${apiBaseUrl}/auth/register`,
          login: `${apiBaseUrl}/auth/login`,
          logout: `${apiBaseUrl}/auth/logout`
        },
        users: {
          getUser: `${apiBaseUrl}/users/{id}`,
          updateUser: `${apiBaseUrl}/users/{id}`,
          deleteUser: `${apiBaseUrl}/users/{id}`,
          getAllUsers: `${apiBaseUrl}/users`
        },
        research: {
          createResearch: `${apiBaseUrl}/research`,
          getResearch: `${apiBaseUrl}/research/{id}`,
          getAllResearch: `${apiBaseUrl}/research`,
          updateResearch: `${apiBaseUrl}/research/{id}`,
          deleteResearch: `${apiBaseUrl}/research/{id}`
        },
        forms: {
          createForm: `${apiBaseUrl}/forms`,
          getForm: `${apiBaseUrl}/forms/{id}`,
          getFormsByResearch: `${apiBaseUrl}/forms/research/{researchId}`,
          updateForm: `${apiBaseUrl}/forms/{id}`,
          deleteForm: `${apiBaseUrl}/forms/{id}`
        },
        welcomeScreen: {
          create: `${apiBaseUrl}/welcome-screens`,
          get: `${apiBaseUrl}/welcome-screens/{id}`,
          getByResearch: `${apiBaseUrl}/welcome-screens/research/{researchId}`,
          update: `${apiBaseUrl}/welcome-screens/{id}`,
          delete: `${apiBaseUrl}/welcome-screens/{id}`
        },
        thankYouScreen: {
          create: `${apiBaseUrl}/thank-you-screens`,
          get: `${apiBaseUrl}/thank-you-screens/{id}`,
          getByResearch: `${apiBaseUrl}/thank-you-screens/research/{researchId}`,
          update: `${apiBaseUrl}/thank-you-screens/{id}`,
          delete: `${apiBaseUrl}/thank-you-screens/{id}`
        },
        eyeTrackingRecruit: {
          // Configuraciones
          getConfigByResearchId: `${apiBaseUrl}/eye-tracking-recruit/research/{researchId}/config`,
          createConfig: `${apiBaseUrl}/eye-tracking-recruit/research/{researchId}/config`,
          updateConfig: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}`,
          completeConfig: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}/complete`,
          deleteConfig: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}`,
          
          // Participantes
          createParticipant: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}/participant`,
          updateParticipantStatus: `${apiBaseUrl}/eye-tracking-recruit/participant/{participantId}/status`,
          getParticipantsByConfigId: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}/participants`,
          getStatsByConfigId: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}/stats`,
          
          // Enlaces de reclutamiento
          generateRecruitmentLink: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}/link`,
          getActiveLinks: `${apiBaseUrl}/eye-tracking-recruit/config/{configId}/links`,
          deactivateLink: `${apiBaseUrl}/eye-tracking-recruit/link/{token}/deactivate`,
          validateRecruitmentLink: `${apiBaseUrl}/eye-tracking-recruit/link/{token}/validate`,
          
          // Resumen de investigación
          getResearchSummary: `${apiBaseUrl}/eye-tracking-recruit/research/{researchId}/summary`,
          
          // Endpoints públicos
          registerPublicParticipant: `${apiBaseUrl}/eye-tracking-recruit/public/participant/start`,
          updatePublicParticipantStatus: `${apiBaseUrl}/eye-tracking-recruit/public/participant/{participantId}/status`
        }
      },
      "_original": {
        "endpointsData": endpoints.endpointsData ? resolveCloudFormationRefs(endpoints.endpointsData) : `HttpApiUrl = "${apiBaseUrl}"`
      },
      "_cors_enabled": true
    };
    
    // Resolver cualquier referencia CloudFormation residual
    resolveCloudFormationRefs(frontendEndpoints);
    
    // Sanitizar URLs que puedan contener [object Object]
    sanitizeUrls(frontendEndpoints);
    sanitizeUrls(outputs);
    
    // Guardar el archivo endpoints.json
    fs.writeFileSync(frontendEndpointsJsonPath, JSON.stringify(frontendEndpoints, null, 2));
    
    // Guardar archivo outputs.json
    fs.writeFileSync(frontendOutputsJsonPath, JSON.stringify(outputs, null, 2));
    
    // Crear un objeto con las URLs de la API para los archivos JS/TS
    const apiConfig = {
      apiBaseUrl: outputs.ServiceEndpoint || '',
      authApiUrl: outputs.AuthApiUrl || `${outputs.ServiceEndpoint}/auth`,
      researchApiUrl: outputs.ResearchApiUrl || `${outputs.ServiceEndpoint}/research`,
      welcomeScreenApiUrl: outputs.WelcomeScreenApiUrl || `${outputs.ServiceEndpoint}/welcome-screens`,
      eyeTrackingRecruitApiUrl: outputs.EyeTrackingRecruitApiUrl || `${outputs.ServiceEndpoint}/eye-tracking-recruit`,
      webSocketEndpoint: outputs.WebSocketEndpoint || '',
      stage: outputs.Stage || DEFAULT_STAGE,
      region: outputs.Region || DEFAULT_REGION,
      endpoints: {
        // Añadir endpoints específicos según las rutas definidas en serverless.yml
        auth: {
          login: '/login',
          register: '/register',
          me: '/me',
          logout: '/logout',
          refreshToken: '/refresh-token'
        },
        research: {
          create: '',
          get: '/{id}',
          getAll: '',
          update: '/{id}',
          delete: '/{id}'
        },
        welcomeScreen: {
          create: '',
          getByResearch: '/research/{researchId}',
          update: '/{id}',
          delete: '/{id}'
        },
        // Añadir endpoints para eye-tracking-recruit
        eyeTrackingRecruit: {
          getConfigByResearchId: '/research/{researchId}/config',
          createConfig: '/research/{researchId}/config',
          updateConfig: '/config/{configId}',
          completeConfig: '/config/{configId}/complete',
          deleteConfig: '/config/{configId}',
          createParticipant: '/config/{configId}/participant',
          updateParticipantStatus: '/participant/{participantId}/status',
          getParticipantsByConfigId: '/config/{configId}/participants',
          getStatsByConfigId: '/config/{configId}/stats',
          generateRecruitmentLink: '/config/{configId}/link',
          getActiveLinks: '/config/{configId}/links',
          deactivateLink: '/link/{token}/deactivate',
          validateRecruitmentLink: '/link/{token}/validate',
          getResearchSummary: '/research/{researchId}/summary',
          registerPublicParticipant: '/public/participant/start',
          updatePublicParticipantStatus: '/public/participant/{participantId}/status'
        }
      }
    };

    // Crear el archivo de configuración para JavaScript
    const jsContent = `
/**
 * Configuración de endpoints de la API
 * Este archivo es generado automáticamente por el script export-endpoints.js
 * No modificar manualmente.
 * 
 * Generado: ${new Date().toISOString()}
 */

const API_CONFIG = ${JSON.stringify(apiConfig, null, 2)};

export default API_CONFIG;
`;

    // Crear el archivo de configuración para TypeScript
    const tsContent = `
/**
 * Configuración de endpoints de la API
 * Este archivo es generado automáticamente por el script export-endpoints.js
 * No modificar manualmente.
 * 
 * Generado: ${new Date().toISOString()}
 */

export interface ApiEndpoint {
  apiBaseUrl: string;
  authApiUrl: string;
  researchApiUrl: string;
  welcomeScreenApiUrl: string;
  eyeTrackingRecruitApiUrl: string;
  webSocketEndpoint: string;
  stage: string;
  region: string;
  endpoints: {
    auth: {
      login: string;
      register: string;
      me: string;
      logout: string;
      refreshToken: string;
    };
    research: {
      create: string;
      get: string;
      getAll: string;
      update: string;
      delete: string;
    };
    welcomeScreen: {
      create: string;
      getByResearch: string;
      update: string;
      delete: string;
    };
    eyeTrackingRecruit: {
      getConfigByResearchId: string;
      createConfig: string;
      updateConfig: string;
      completeConfig: string;
      deleteConfig: string;
      createParticipant: string;
      updateParticipantStatus: string;
      getParticipantsByConfigId: string;
      getStatsByConfigId: string;
      generateRecruitmentLink: string;
      getActiveLinks: string;
      deactivateLink: string;
      validateRecruitmentLink: string;
      getResearchSummary: string;
      registerPublicParticipant: string;
      updatePublicParticipantStatus: string;
    };
  };
}

const API_CONFIG: ApiEndpoint = ${JSON.stringify(apiConfig, null, 2)};

export default API_CONFIG;
`;

    // Escribir los archivos de configuración
    fs.writeFileSync(frontendConfigPath, jsContent);
    fs.writeFileSync(frontendConfigPathTs, tsContent);

    console.log('✅ Configuración de endpoints exportada correctamente:');
    console.log(`   - endpoints.json: ${frontendEndpointsJsonPath}`);
    console.log(`   - outputs.json: ${frontendOutputsJsonPath}`);
    console.log(`   - JavaScript: ${frontendConfigPath}`);
    console.log(`   - TypeScript: ${frontendConfigPathTs}`);
    
  } catch (error) {
    console.error('❌ Error al exportar los endpoints:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
exportEndpoints(); 
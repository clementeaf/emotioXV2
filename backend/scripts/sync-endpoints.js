/**
 * Script para sincronizar los endpoints entre backend y frontend
 * Este script analiza el archivo serverless.yml para extraer todos los endpoints
 * y genera un archivo endpoints.json tanto para el backend como para el frontend
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Rutas de los archivos
const serverlessPath = path.join(__dirname, '..', 'serverless.yml');
const outputsPath = path.join(__dirname, '..', 'outputs.json');
const backendEndpointsPath = path.join(__dirname, '..', 'endpoints.json');
const frontendEndpointsPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'config', 'endpoints.json');

// Función para leer el archivo serverless.yml
function parseServerlessFile() {
  try {
    const content = fs.readFileSync(serverlessPath, 'utf8');
    return yaml.load(content);
  } catch (error) {
    console.error('❌ Error al leer serverless.yml:', error);
    process.exit(1);
  }
}

// Función para leer el archivo outputs.json
function parseOutputsFile() {
  try {
    if (fs.existsSync(outputsPath)) {
      const content = fs.readFileSync(outputsPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const outputs = {};
      lines.forEach(line => {
        const [key, value] = line.split(' = ');
        outputs[key.trim()] = value.replace(/"/g, '').trim();
      });
      
      return outputs;
    }
    return null;
  } catch (error) {
    console.error('❌ Error al leer outputs.json:', error);
    return null;
  }
}

// Función para extraer los endpoints
function extractEndpoints(serverlessConfig, outputs) {
  const endpoints = {};
  const httpApiUrl = outputs?.HttpApiUrl || 'https://localhost:4000';
  const wsApiUrl = outputs?.WebSocketApiUrl || 'wss://localhost:4000/dev';
  
  // Función para formatear la URL completa
  const formatUrl = (path) => {
    // Eliminar el slash inicial si existe para evitar doble slash
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${httpApiUrl}/${cleanPath}`;
  };
  
  // Extraer los endpoints HTTP
  if (serverlessConfig.functions) {
    Object.entries(serverlessConfig.functions).forEach(([functionName, functionConfig]) => {
      if (functionConfig.events) {
        functionConfig.events.forEach(event => {
          if (event.httpApi) {
            const { path, method } = event.httpApi;
            
            // Extraer la última parte de la ruta para usarla como clave
            const pathParts = path.split('/').filter(Boolean);
            let endpointKey = pathParts[pathParts.length - 1];
            
            // Si la última parte es una variable (como {id}), usar la parte anterior
            if (endpointKey.startsWith('{') && endpointKey.endsWith('}')) {
              endpointKey = pathParts[pathParts.length - 2];
            }
            
            // Para rutas como /api/users/me, usar 'user' como clave
            if (pathParts.includes('users') && endpointKey === 'me') {
              const action = method.toLowerCase();
              if (action === 'get') endpointKey = 'getUser';
              else if (action === 'put') endpointKey = 'updateUser';
              else if (action === 'delete') endpointKey = 'deleteUser';
              else endpointKey = `${action}User`;
            } else if (pathParts.includes('auth')) {
              // Para rutas de autenticación
              endpointKey = pathParts[pathParts.length - 1];
            }
            
            // Para endpoints anidados como research/status
            if (pathParts.includes('research') && pathParts.length > 2) {
              const subAction = pathParts[pathParts.length - 1];
              if (!endpoints.research) endpoints.research = {};
              
              // Convertir método a nombre de acción para research
              if (method === 'GET' && endpointKey !== 'research') {
                endpoints.research[subAction] = formatUrl(path);
              } else if (method === 'POST' && pathParts.includes('research') && !pathParts.includes('{id}')) {
                endpoints.research.create = formatUrl(path);
              } else if (method === 'GET' && pathParts.includes('research') && !pathParts.includes('{id}')) {
                endpoints.research.list = formatUrl(path);
              } else if (method === 'GET' && pathParts.includes('{id}')) {
                endpoints.research.get = formatUrl(path);
              } else if (method === 'PUT') {
                endpoints.research.update = formatUrl(path);
              } else if (method === 'DELETE') {
                endpoints.research.delete = formatUrl(path);
              } else {
                // Para otros casos, usar el método como clave
                if (!endpoints.research[endpointKey]) {
                  endpoints.research[endpointKey] = {};
                }
                endpoints.research[endpointKey][method] = formatUrl(path);
              }
            } 
            // Para endpoints de formularios
            else if (pathParts.includes('forms')) {
              if (!endpoints.forms) endpoints.forms = {};
              
              if (method === 'GET' && pathParts.includes('responses')) {
                endpoints.forms.getResponses = formatUrl(path);
              } else if (method === 'POST' && pathParts.includes('responses')) {
                endpoints.forms.submitResponses = formatUrl(path);
              } else if (method === 'POST' && pathParts.includes('publish')) {
                endpoints.forms.publish = formatUrl(path);
              } else if (method === 'POST' && pathParts.includes('unpublish')) {
                endpoints.forms.unpublish = formatUrl(path);
              } else if (method === 'GET' && pathParts.includes('public')) {
                endpoints.forms.getPublic = formatUrl(path);
              } else if (method === 'GET' && !pathParts.includes('{id}')) {
                endpoints.forms.list = formatUrl(path);
              } else if (method === 'GET' && pathParts.includes('{id}')) {
                endpoints.forms.get = formatUrl(path);
              } else if (method === 'POST') {
                endpoints.forms.create = formatUrl(path);
              } else if (method === 'PUT') {
                endpoints.forms.update = formatUrl(path);
              } else if (method === 'DELETE') {
                endpoints.forms.delete = formatUrl(path);
              } else {
                // Para otros casos
                endpoints.forms[endpointKey] = formatUrl(path);
              }
            }
            // Para otros endpoints no anidados
            else {
              // Usar el nombre de la función como clave, pero mapear métodos comunes
              if (method === 'POST' && endpointKey === 'login') {
                endpoints.login = formatUrl(path);
              } else if (method === 'POST' && endpointKey === 'register') {
                endpoints.register = formatUrl(path);
              } else if (method === 'POST' && endpointKey === 'logout') {
                endpoints.logout = formatUrl(path);
              } else if (method === 'OPTIONS') {
                endpoints.optionsHandler = formatUrl(path);
              } else {
                // Para otros casos, usar el método como clave
                if (!endpoints[endpointKey]) {
                  endpoints[endpointKey] = {};
                }
                endpoints[endpointKey][method] = formatUrl(path);
              }
            }
          }
        });
      }
    });
  }
  
  // Agregar WebSocket URL
  endpoints.websocket = wsApiUrl;
  
  return endpoints;
}

// Función principal
function main() {
  try {
    console.log('🔄 Sincronizando endpoints...');
    
    // Parsear configuración serverless
    const serverlessConfig = parseServerlessFile();
    
    // Leer outputs para obtener las URLs generadas
    const outputs = parseOutputsFile();
    
    // Extraer endpoints
    const endpoints = extractEndpoints(serverlessConfig, outputs);
    
    // Guardar endpoints en el backend
    fs.writeFileSync(backendEndpointsPath, JSON.stringify(endpoints, null, 2));
    console.log(`✅ Endpoints guardados en: ${backendEndpointsPath}`);
    
    // Crear directorio para endpoints del frontend si no existe
    const frontendDir = path.dirname(frontendEndpointsPath);
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    // Guardar endpoints en el frontend
    fs.writeFileSync(frontendEndpointsPath, JSON.stringify(endpoints, null, 2));
    console.log(`✅ Endpoints copiados al frontend: ${frontendEndpointsPath}`);
    
    console.log('✅ Sincronización de endpoints completada con éxito');
  } catch (error) {
    console.error('❌ Error al sincronizar endpoints:', error);
    process.exit(1);
  }
}

// Ejecutar función principal
main(); 
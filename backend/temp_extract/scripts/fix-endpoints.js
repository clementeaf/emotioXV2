/**
 * Script simplificado para generar endpoints desde outputs.json
 */
const fs = require('fs');
const path = require('path');

// Rutas de los archivos
const outputsPath = path.join(__dirname, '..', 'outputs.json');
const backendEndpointsPath = path.join(__dirname, '..', 'endpoints.json');
const frontendEndpointsPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'config', 'endpoints.json');

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
      
      console.log('Outputs parseados:', outputs);
      return outputs;
    }
    return null;
  } catch (error) {
    console.error('❌ Error al leer outputs.json:', error);
    return null;
  }
}

// Función para generar los endpoints
function generateEndpoints(outputs) {
  // Corregir URL mal formada si es necesario
  let httpApiUrl = outputs?.HttpApiUrl || 'https://localhost:4000';
  if (httpApiUrl.includes('amazonaws.comamazonaws.com')) {
    httpApiUrl = httpApiUrl.replace('amazonaws.comamazonaws.com', 'amazonaws.com');
    console.log('⚠️ URL corregida:', httpApiUrl);
  }
  
  const wsApiUrl = outputs?.WebSocketApiUrl || 'wss://localhost:4000/dev';
  
  console.log('API URL:', httpApiUrl);
  console.log('WebSocket URL:', wsApiUrl);
  
  // Función para formatear URLs
  const formatUrl = (path) => {
    if (path.startsWith('/')) {
      return `${httpApiUrl}${path}`;
    }
    return `${httpApiUrl}/${path}`;
  };
  
  // Generar los endpoints básicos
  const endpoints = {
    login: {
      POST: formatUrl('/api/auth/login')
    },
    register: {
      POST: formatUrl('/api/auth/register')
    },
    logout: {
      POST: formatUrl('/api/auth/logout')
    },
    getUser: {
      GET: formatUrl('/api/users/me')
    },
    updateUser: {
      PUT: formatUrl('/api/users/me')
    },
    deleteUser: {
      DELETE: formatUrl('/api/users/me')
    },
    optionsHandler: {
      OPTIONS: formatUrl('/api/{proxy+}')
    },
    research: {
      create: formatUrl('/api/research'),
      get: formatUrl('/api/research/{id}'),
      list: formatUrl('/api/research'),
      update: formatUrl('/api/research/{id}'),
      delete: formatUrl('/api/research/{id}')
    },
    forms: {
      create: formatUrl('/api/forms'),
      get: formatUrl('/api/forms/{id}'),
      list: formatUrl('/api/forms'),
      update: formatUrl('/api/forms/{id}'),
      delete: formatUrl('/api/forms/{id}'),
      publish: formatUrl('/api/forms/{id}/publish'),
      unpublish: formatUrl('/api/forms/{id}/unpublish'),
      getPublic: formatUrl('/api/public/forms/{id}'),
      submitResponses: formatUrl('/api/public/forms/{id}/responses'),
      getResponses: formatUrl('/api/forms/{id}/responses')
    },
    welcomeScreen: {
      get: formatUrl('/api/welcome-screen'),
      update: formatUrl('/api/welcome-screen')
    },
    websocket: wsApiUrl
  };
  
  return endpoints;
}

// Función principal
function main() {
  try {
    console.log('🔄 Generando endpoints...');
    
    // Leer outputs para obtener las URLs generadas
    const outputs = parseOutputsFile();
    
    if (!outputs) {
      console.error('❌ No se pudo leer el archivo outputs.json');
      process.exit(1);
    }
    
    // Generar endpoints
    const endpoints = generateEndpoints(outputs);
    
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
    
    console.log('✅ Generación de endpoints completada con éxito');
  } catch (error) {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }
}

// Ejecutar función principal
main(); 
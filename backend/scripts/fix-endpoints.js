/**
 * Script para arreglar los endpoints generados por Serverless
 * - Lee el archivo endpoints.json generado por serverless-plugin-export-endpoints
 * - Corrige las URLs para asegurar que tengan el formato correcto
 * - Guarda el archivo actualizado
 */

const fs = require('fs');
const path = require('path');

// Rutas de los archivos
const endpointsPath = path.join(__dirname, '..', 'endpoints.json');
const outputPath = endpointsPath; // Sobreescribimos el mismo archivo

// Función principal
async function fixEndpoints() {
  try {
    console.log('🛠️  Corrigiendo endpoints...');

    // Verificar si existe el archivo de endpoints
    if (!fs.existsSync(endpointsPath)) {
      console.error('❌ No se encontró el archivo endpoints.json');
      return;
    }

    // Leer el archivo de endpoints
    const endpointsData = fs.readFileSync(endpointsPath, 'utf8');
    const endpointsJson = JSON.parse(endpointsData);

    // Procesar los endpoints
    let apiUrl = '';
    let wsUrl = '';

    // Extraer API URL y WebSocket URL
    if (endpointsJson.httpApiUrl) {
      apiUrl = endpointsJson.httpApiUrl;
      // Asegurar que no termina con una barra
      if (apiUrl.endsWith('/')) {
        apiUrl = apiUrl.slice(0, -1);
      }
    }

    if (endpointsJson.WebsocketsApiUrl) {
      wsUrl = endpointsJson.WebsocketsApiUrl;
    }

    // Crear objeto actualizado
    const updatedEndpoints = {
      apiUrl,
      websocketUrl: wsUrl,
      endpoints: {
        // Auth endpoints
        auth: {
          register: `${apiUrl}/api/auth/register`,
          login: `${apiUrl}/api/auth/login`,
          logout: `${apiUrl}/api/auth/logout`,
        },
        // User endpoints
        users: {
          getUser: `${apiUrl}/api/users/{id}`,
          updateUser: `${apiUrl}/api/users/{id}`,
          deleteUser: `${apiUrl}/api/users/{id}`,
          getAllUsers: `${apiUrl}/api/users`,
        },
        // Research endpoints
        research: {
          createResearch: `${apiUrl}/api/research`,
          getResearch: `${apiUrl}/api/research/{id}`,
          getAllResearch: `${apiUrl}/api/research`,
          updateResearch: `${apiUrl}/api/research/{id}`,
          deleteResearch: `${apiUrl}/api/research/{id}`,
        },
        // Forms endpoints
        forms: {
          createForm: `${apiUrl}/api/forms`,
          getForm: `${apiUrl}/api/forms/{id}`,
          getFormsByResearch: `${apiUrl}/api/forms/research/{researchId}`,
          updateForm: `${apiUrl}/api/forms/{id}`,
          deleteForm: `${apiUrl}/api/forms/{id}`,
        },
      },
      // Mantener las URLs originales para referencia
      _original: {
        httpApiUrl: endpointsJson.httpApiUrl,
        WebsocketsApiUrl: endpointsJson.WebsocketsApiUrl,
      }
    };

    // Guardar el archivo actualizado
    fs.writeFileSync(outputPath, JSON.stringify(updatedEndpoints, null, 2));
    console.log('✅ Endpoints corregidos y guardados en:', outputPath);
    
    return updatedEndpoints;
  } catch (error) {
    console.error('❌ Error al procesar endpoints:', error);
    process.exit(1);
  }
}

// Ejecutar el script
fixEndpoints(); 
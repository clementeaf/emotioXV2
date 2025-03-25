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
    
    // Intentar procesar el contenido, que puede estar en varios formatos
    let apiUrl = '';
    let wsUrl = '';
    
    try {
      // Intentar como JSON primero
      const endpointsJson = JSON.parse(endpointsData);
      
      // Extraer API URL y WebSocket URL
      if (endpointsJson.httpApiUrl) {
        apiUrl = endpointsJson.httpApiUrl;
      } else if (endpointsJson.HttpApiUrl) {
        apiUrl = endpointsJson.HttpApiUrl;
      }
      
      if (endpointsJson.WebsocketsApiUrl) {
        wsUrl = endpointsJson.WebsocketsApiUrl;
      } else if (endpointsJson.websocketApiUrl) {
        wsUrl = endpointsJson.websocketApiUrl;
      }
    } catch (error) {
      // Si no es JSON, intentar con formato de variables
      console.log('⚠️ El archivo no está en formato JSON, intentando parsear como variables...');
      
      // Buscar la URL de la API HTTP
      const httpApiMatch = endpointsData.match(/HttpApiUrl\s*=\s*"([^"]+)"/);
      if (httpApiMatch && httpApiMatch[1]) {
        apiUrl = httpApiMatch[1];
      }
      
      // Buscar la URL de WebSocket
      const wsApiMatch = endpointsData.match(/ServiceEndpointWebsocket\s*=\s*"([^"]+)"/);
      if (wsApiMatch && wsApiMatch[1]) {
        wsUrl = wsApiMatch[1];
      }
    }

    // Asegurar que las URLs no terminan con una barra
    if (apiUrl && apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    console.log('📌 API URL detectada:', apiUrl);
    console.log('📌 WebSocket URL detectada:', wsUrl);

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
        // Welcome Screen endpoints
        welcomeScreen: {
          create: `${apiUrl}/api/welcome-screens`,
          get: `${apiUrl}/api/welcome-screens/{id}`,
          getByResearch: `${apiUrl}/api/welcome-screens/research/{researchId}`,
          update: `${apiUrl}/api/welcome-screens/{id}`,
          delete: `${apiUrl}/api/welcome-screens/{id}`,
        },
        // Thank You Screen endpoints
        thankYouScreen: {
          create: `${apiUrl}/api/thank-you-screens`,
          get: `${apiUrl}/api/thank-you-screens/{id}`,
          getByResearch: `${apiUrl}/api/thank-you-screens/research/{researchId}`,
          update: `${apiUrl}/api/thank-you-screens/{id}`,
          delete: `${apiUrl}/api/thank-you-screens/{id}`,
        },
      },
      // Mantener las URLs originales para referencia
      _original: {
        endpointsData
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
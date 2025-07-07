/**
 * Utilidad para exportar los endpoints para uso en frontend
 *
 * Este módulo genera un archivo que contiene todos los endpoints de la API
 * y permite importarlos de forma dinámica desde el frontend sin necesidad
 * de hardcodear URLs
 */

import * as fs from 'fs';
import * as path from 'path';

interface ApiEndpoints {
  http: string;
  websocket: string;
  [key: string]: any;
}

/**
 * Función que escribe los endpoints a un archivo
 */
export function writeEndpointsToFile(endpoints: ApiEndpoints, outputPath: string): void {
  try {
    // Crear directorio si no existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convertir a formato que pueda ser importado en frontend
    const endpointsForExport = {
      ...endpoints,
      timestamp: new Date().toISOString(),
      generatedAt: new Date().toISOString()
    };

    // Escribir en formato JS que puede ser usado como módulo
    const content = `
// Este archivo se genera automáticamente - NO EDITAR MANUALMENTE
// Generado: ${new Date().toISOString()}

export const apiEndpoints = ${JSON.stringify(endpointsForExport, null, 2)};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = ${JSON.stringify(endpoints.http)};
export const API_WEBSOCKET_ENDPOINT = ${JSON.stringify(endpoints.websocket)};

// Función para obtener URL completa de una ruta
export function getApiUrl(path) {
  // Eliminar slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return \`\${apiEndpoints.http}/\${cleanPath}\`;
}

// Función para websocket
export function getWebsocketUrl() {
  return apiEndpoints.websocket;
}

// Versión default para import default
export default apiEndpoints;
`;

    // Escribir al archivo
    fs.writeFileSync(outputPath, content);
    console.log(`Endpoints exportados exitosamente a: ${outputPath}`);
  } catch (error) {
    console.error('Error al exportar endpoints:', error);
    throw error;
  }
}

/**
 * Lee y exporta los endpoints de API
 */
export async function exportEndpoints(outputFilePath: string): Promise<void> {
  try {
    // Crear directorio si no existe
    const outputDirectory = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    // Si estamos en un entorno de despliegue, intentar leer valores de Serverless
    let endpoints: ApiEndpoints;
    if (process.env.SERVERLESS_STAGE) {
      console.log('Usando valores de Serverless para endpoints');
      endpoints = readEndpointsFromServerless();
    } else {
      // Valores por defecto para desarrollo local
      console.log('Usando valores de entorno local para endpoints');
      endpoints = {
        http: process.env.API_ENDPOINT || 'http://localhost:3000/dev',
        websocket: process.env.WEBSOCKET_ENDPOINT || 'ws://localhost:3001/dev',
        stage: process.env.STAGE || 'dev'
      };
    }

    // URLs de desarrollo local por defecto
    let localUrls = {
      "frontend": "http://localhost:3000",
      "publicTests": "http://localhost:4700"
    };

    // Construir contenido del archivo JavaScript de configuración
    const template = `// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: ${new Date().toISOString()}

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "${endpoints.http}",

  // Endpoint WebSocket
  ws: "${endpoints.websocket}",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "${endpoints.stage || process.env.STAGE || 'dev'}"
};

// URLs de desarrollo local
export const LOCAL_URLS = ${JSON.stringify(localUrls, null, 2)};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = "${endpoints.http}";
export const API_WEBSOCKET_ENDPOINT = "${endpoints.websocket}";

// Función para obtener URL completa de una ruta
export function getApiUrl(path) {
  // Eliminar slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return \`\${API_HTTP_ENDPOINT}/\${cleanPath}\`;
}

// Función para websocket
export function getWebsocketUrl() {
  return API_WEBSOCKET_ENDPOINT;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl() {
  return LOCAL_URLS.publicTests || 'http://localhost:4700';
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID) {
  const url = \`\${getPublicTestsUrl()}/\${researchID}\`;
  window.open(url, '_blank');
}

// Versión default para import default
export default API_ENDPOINTS;
`;

    // Escribir archivo
    fs.writeFileSync(outputFilePath, template);
    console.log(`Endpoints exportados exitosamente a: ${outputFilePath}`);
  } catch (error) {
    console.error('Error al exportar endpoints:', error);
    throw error;
  }
}

/**
 * Función que lee los endpoints desde archivos serverless o variables de entorno
 */
export function readEndpointsFromServerless(): ApiEndpoints {
  try {
    // Leer el archivo endpoints.json generado por serverless si existe
    const serverlessDir = path.resolve(process.cwd(), '.serverless');
    const endpointsPath = path.join(serverlessDir, 'endpoints.json');
    const outputsPath = path.join(process.cwd(), 'endpoints-output.json');

    // Valores por defecto
    let endpoints: ApiEndpoints = {
      http: process.env.API_ENDPOINT || 'http://localhost:3000/dev',
      websocket: process.env.WEBSOCKET_ENDPOINT || 'ws://localhost:3001/dev',
      stage: process.env.STAGE || 'dev'
    };

    // Intentar leer endpoints.json si existe
    if (fs.existsSync(endpointsPath)) {
      console.log(`Leyendo endpoints desde: ${endpointsPath}`);
      try {
        const endpointsData = JSON.parse(fs.readFileSync(endpointsPath, 'utf-8'));
        if (endpointsData.http) {
          endpoints.http = Array.isArray(endpointsData.http)
            ? endpointsData.http[0]
            : endpointsData.http;
        }

        if (endpointsData.websocket) {
          endpoints.websocket = Array.isArray(endpointsData.websocket)
            ? endpointsData.websocket[0]
            : endpointsData.websocket;
        }
      } catch (error: any) {
        console.warn(`Error al leer endpoints.json: ${error.message}`);
      }
    }

    // Intentar leer outputs.json si existe (formato clave = valor)
    if (fs.existsSync(outputsPath)) {
      console.log(`Leyendo outputs desde: ${outputsPath}`);
      try {
        // Leer el archivo como texto
        const fileContent = fs.readFileSync(outputsPath, 'utf-8');

        // Parsear el formato clave = valor
        const httpMatch = fileContent.match(/HttpApiUrl\s*=\s*"([^"]+)"/);
        if (httpMatch && httpMatch[1]) {
          endpoints.http = httpMatch[1];
          console.log(`Encontrado HTTP API URL: ${endpoints.http}`);
        }

        const wsMatch = fileContent.match(/WebsocketApiUrl\s*=\s*"([^"]+)"/);
        if (wsMatch && wsMatch[1]) {
          endpoints.websocket = wsMatch[1];
          console.log(`Encontrado WebSocket API URL: ${endpoints.websocket}`);
        }

        const stageMatch = fileContent.match(/Stage\s*=\s*"([^"]+)"/);
        if (stageMatch && stageMatch[1]) {
          endpoints.stage = stageMatch[1];
        }
      } catch (error: any) {
        console.warn(`Error al leer outputs.json: ${error.message}`);
      }
    }

    console.log('Endpoints encontrados:', endpoints);
    return endpoints;
  } catch (error) {
    console.error('Error al leer endpoints:', error);
    // Devolver valores por defecto
    return {
      http: process.env.API_ENDPOINT || 'http://localhost:3000/dev',
      websocket: process.env.WEBSOCKET_ENDPOINT || 'ws://localhost:3001/dev',
      stage: process.env.STAGE || 'dev'
    };
  }
}

// Si se ejecuta directamente, exportar endpoints
if (require.main === module) {
  const outputPath = process.argv[2] || '../../../frontend/src/api/endpoints.js';
  exportEndpoints(outputPath);
}

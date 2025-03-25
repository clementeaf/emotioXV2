import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authHandler } from './controllers/auth.controller';
import { researchHandler } from './controllers/newResearch.controller';
import { welcomeScreenHandler } from './controllers/welcomeScreen.controller';

/**
 * Punto de entrada principal para las funciones serverless
 * Orquesta todas las rutas y redirige a los controladores correspondientes
 */

/**
 * Información de versión
 */
export const versionInfo = {
  name: 'emotioXV2-backend',
  version: '0.1.0',
  environment: process.env.NODE_ENV || 'development'
};

/**
 * Mapeador de rutas principales a sus controladores correspondientes
 */
const routeMap: Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> = {
  'auth': authHandler,
  'research': researchHandler,
  'welcome-screens': welcomeScreenHandler,
  // Aquí se añadirán otros controladores
  // 'emotions': emotionHandler,
};

/**
 * Función principal que procesa todas las solicitudes HTTP
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Evento recibido:', {
    path: event.path,
    method: event.httpMethod,
    pathParams: event.pathParameters,
    queryParams: event.queryStringParameters
  });

  try {
    // Comprobar si es una solicitud WebSocket
    if (event.requestContext && 'connectionId' in event.requestContext) {
      return await handleWebSocketRequest(event);
    }

    // Manejar solicitudes HTTP
    const path = event.path;
    
    // Verificar health check
    if (path === '/health' || path === '/ping') {
      return createResponse(200, { status: 'OK', ...versionInfo });
    }
    
    // Verificar la ruta raíz
    if (path === '/' || path === '') {
      return createResponse(200, { 
        message: 'API de emotioXV2', 
        ...versionInfo,
        endpoints: Object.keys(routeMap).map(route => `/${route}`)
      });
    }
    
    // Determinar el controlador según la ruta principal
    const segments = path.split('/').filter(Boolean);
    const mainRoute = segments[0];
    
    console.log('Procesando ruta:', mainRoute);
    
    if (mainRoute && routeMap[mainRoute]) {
      console.log(`Redirigiendo a controlador para ruta ${mainRoute}`);
      return await routeMap[mainRoute](event);
    }
    
    // Si no se encontró una ruta conocida
    console.log('Ruta no encontrada:', path);
    return createResponse(404, { 
      message: 'Ruta no encontrada',
      path: event.path,
      availableRoutes: Object.keys(routeMap).map(route => `/${route}`)
    });
  } catch (error: any) {
    console.error('Error en handler principal:', error);
    return createResponse(500, {
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Maneja solicitudes WebSocket
 */
const handleWebSocketRequest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extraer información relevante para WebSockets
    const connectionId = (event.requestContext as any).connectionId;
    const routeKey = (event.requestContext as any).routeKey;
    
    if (routeKey === '$connect') {
      console.log(`Nueva conexión: ${connectionId}`);
      return createResponse(200, { message: 'Conectado' });
    } else if (routeKey === '$disconnect') {
      console.log(`Conexión cerrada: ${connectionId}`);
      return createResponse(200, { message: 'Desconectado' });
    } else if (routeKey === '$default') {
      // Aquí se procesarían los mensajes WebSocket
      // Por ahora solo devolvemos un mensaje de confirmación
      return createResponse(200, { message: 'Mensaje recibido' });
    }
    
    return createResponse(400, { message: 'Operación WebSocket no soportada' });
  } catch (error: any) {
    console.error('Error en manejo de WebSocket:', error);
    return createResponse(500, { message: 'Error en operación WebSocket', error: error.message });
  }
};

/**
 * Crea una respuesta HTTP estandarizada
 */
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',  // Permitir todos los orígenes
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS, PATCH, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Requested-With, X-Amz-Meta-*',
      'Access-Control-Max-Age': '86400',   // Caché de preflight 24 horas
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: JSON.stringify(body)
  };
};

// Iniciar la aplicación
console.log(`Iniciando ${versionInfo.name} v${versionInfo.version} en entorno ${versionInfo.environment}`); 
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from './utils/controller.utils';

// Importar todos los controladores
import { authHandler } from './controllers/auth.controller';
import { welcomeScreenHandler } from './controllers/welcomeScreen.controller';
import { thankYouScreenHandler } from './controllers/thankYouScreen.controller';
import { researchHandler } from './controllers/newResearch.controller';
import { smartVocFormController } from './controllers/smartVocForm.controller';
import { eyeTrackingHandler } from './controllers/eyeTracking.controller';
import { s3Handler } from './controllers/s3.controller';

/**
 * Punto de entrada principal para las funciones serverless
 * Enruta las solicitudes a los controladores correspondientes
 */

/**
 * Información de versión
 */
export const versionInfo = {
  name: 'emotioXV2-backend',
  version: '0.1.0',
  environment: process.env.NODE_ENV || 'development',
  status: 'Activo'
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
      return handleWebSocketRequest(event);
    }

    // Para solicitudes OPTIONS, responder con encabezados CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: ''
      };
    }

    // Enrutar a los controladores apropiados basado en la ruta
    const path = event.path.toLowerCase();
    
    // Variable para seguir el modo de depuración/desarrollo
    const isDevelopmentMode = process.env.NODE_ENV === 'development' || process.env.IS_OFFLINE === 'true';

    // Usar un bloque try-catch adicional para manejar errores específicos de enrutamiento
    try {
      if (path.startsWith('/auth')) {
        console.log('Enrutando a authHandler:', path);
        return authHandler(event);
      } else if (path.startsWith('/welcome-screens') || path.includes('/welcome-screen')) {
        console.log('Enrutando a welcomeScreenHandler:', path);
        return welcomeScreenHandler(event);
      } else if (path.startsWith('/thank-you-screens') || path.includes('/thank-you-screen')) {
        console.log('Enrutando a thankYouScreenHandler:', path);
        return thankYouScreenHandler(event);
      } else if (path.includes('/smart-voc')) {
        console.log('Enrutando a smartVocFormController:', path);
        return smartVocFormController(event);
      } else if (path.match(/\/research\/[^\/]+\/smart-voc/)) {
        console.log('Enrutando a smartVocFormController (ruta research):', path);
        return smartVocFormController(event);
      } else if (path.startsWith('/research')) {
        console.log('Enrutando a researchHandler:', path);
        return researchHandler(event);
      } else if (path.startsWith('/eye-tracking')) {
        console.log('Enrutando a eyeTrackingHandler:', path);
        return eyeTrackingHandler(event);
      } else if (path.startsWith('/s3')) {
        console.log('Enrutando a s3Handler:', path);
        return s3Handler(event);
      }
    } catch (routingError: any) {
      console.error('Error al enrutar solicitud:', routingError);
      
      // En modo desarrollo, devolver detalles del error
      if (isDevelopmentMode) {
        return {
          statusCode: 500,
          headers: getCorsHeaders(),
          body: JSON.stringify({
            message: 'Error al procesar la solicitud en el controlador',
            error: routingError.message,
            stack: routingError.stack
          })
        };
      }
      
      // En producción, mostrar un mensaje genérico
      return {
        statusCode: 500,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: 'Error interno del servidor'
        })
      };
    }
    
    // Ruta raíz - información general de la API
    if (path === '/' || path === '') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: 'API de emotioXV2 Backend',
          status: 'Activo',
          info: versionInfo,
          endpoints: [
            '/auth - Autenticación y gestión de usuarios',
            '/research - Gestión de investigaciones (GET, POST, PUT, DELETE)',
            '/research/user - Investigaciones del usuario actual (GET)',
            '/research/:id - Detalle de investigación (GET, PUT, DELETE)',
            '/welcome-screens - Configuración de pantallas de bienvenida (GET, POST, PUT, DELETE)',
            '/thank-you-screens - Configuración de pantallas de agradecimiento (GET, POST, PUT, DELETE)',
            '/smart-voc - Formularios VOC inteligentes (GET, POST, PUT, DELETE)',
            '/eye-tracking - Configuración y datos de eye tracking (GET, POST, PUT, DELETE)',
            '/s3/upload - Generar URL prefirmada para subir archivos (POST)',
            '/s3/download/:key - Generar URL prefirmada para descargar archivos (GET)',
            '/s3/delete/:key - Generar URL prefirmada para eliminar archivos (DELETE)'
          ]
        })
      };
    }

    // Si la ruta no coincide con ningún controlador
    return {
      statusCode: 404,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Ruta no encontrada',
        path: event.path,
        method: event.httpMethod,
        info: versionInfo
      })
    };
  } catch (error: any) {
    console.error('Error en handler principal:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Error interno del servidor',
        error: error.message
      })
    };
  }
};

/**
 * Maneja solicitudes WebSocket
 */
const handleWebSocketRequest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Manejar solicitudes OPTIONS para WebSockets (preflight CORS)
    if (event.httpMethod === 'OPTIONS') {
      console.log('Solicitud WebSocket preflight CORS recibida');
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: ''
      };
    }

    // Extraer información relevante para WebSockets
    const connectionId = (event.requestContext as any).connectionId;
    const routeKey = (event.requestContext as any).routeKey;
    
    if (routeKey === '$connect') {
      console.log(`Nueva conexión WebSocket: ${connectionId}`);
      // Aquí se podría almacenar la conexión en DynamoDB
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({ message: 'Conectado' })
      };
    } else if (routeKey === '$disconnect') {
      console.log(`Conexión WebSocket cerrada: ${connectionId}`);
      // Aquí se podría eliminar la conexión de DynamoDB
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({ message: 'Desconectado' })
      };
    } else if (routeKey === '$default') {
      // Procesar mensajes WebSocket
      console.log(`Mensaje WebSocket recibido de ${connectionId}:`, event.body);
      
      try {
        // Intentar parsear el cuerpo del mensaje
        if (event.body) {
          const message = JSON.parse(event.body);
          
          // Aquí se puede implementar la lógica para manejar diferentes tipos de mensajes
          // Ejemplo: if (message.action === 'sendNotification') { ... }
          
          return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({ 
              message: 'Mensaje recibido',
              data: message
            })
          };
        }
      } catch (parseError) {
        console.error('Error al parsear mensaje WebSocket:', parseError);
      }
      
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({ 
          message: 'Mensaje recibido pero no pudo ser procesado'
        })
      };
    }
    
    return {
      statusCode: 400,
      headers: getCorsHeaders(),
      body: JSON.stringify({ message: 'Operación WebSocket no soportada' })
    };
  } catch (error: any) {
    console.error('Error en manejo de WebSocket:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ 
        message: 'Error en operación WebSocket', 
        error: error.message 
      })
    };
  }
}; 
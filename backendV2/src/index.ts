/**
 * Punto de entrada principal para la API de EmotioXV2
 * Implementa un router unificado para HTTP y WebSocket
 */

import { 
  APIGatewayProxyEvent, 
  APIGatewayProxyResult, 
  Context
} from 'aws-lambda';
import { APIGatewayEventWebsocketRequestContext } from './types/websocket';

// Definición del tipo de conexión
type ConnectionType = 'http' | 'websocket';

// Importaciones lazy para reducir el tamaño de carga inicial
const handlers: Record<string, any> = {};

// Función para obtener un handler de forma lazy (solo se carga cuando se necesita)
async function getHandler(type: string) {
  if (handlers[type]) return handlers[type];
  
  // Carga dinámica de módulos según el tipo de solicitud
  switch (type) {
    case 'auth':
      const authModule = await import('./controllers/auth.controller');
      handlers.auth = authModule.authHandler || authModule;
      return handlers.auth;
    case 'research':
      const researchModule = await import('./controllers/newResearch.controller');
      handlers.research = researchModule.researchHandler || researchModule;
      return handlers.research;
    case 'welcome-screen':
      const welcomeScreenModule = await import('./controllers/welcomeScreen.controller');
      handlers.welcomeScreen = welcomeScreenModule.welcomeScreenHandler || welcomeScreenModule;
      return handlers.welcomeScreen;
    case 'thank-you-screen':
      const thankYouScreenModule = await import('./controllers/thankYouScreen.controller');
      handlers.thankYouScreen = thankYouScreenModule.thankYouScreenHandler || thankYouScreenModule;
      return handlers.thankYouScreen;
    case 'eye-tracking':
      const eyeTrackingModule = await import('./controllers/eyeTracking.controller');
      handlers.eyeTracking = eyeTrackingModule.eyeTrackingHandler || eyeTrackingModule;
      return handlers.eyeTracking;
    case 'eye-tracking-recruit':
      const eyeTrackingRecruitModule = await import('./controllers/eyeTrackingRecruit.controller');
      handlers.eyeTrackingRecruit = eyeTrackingRecruitModule.eyeTrackingRecruitHandler || eyeTrackingRecruitModule;
      return handlers.eyeTrackingRecruit;
    case 'smart-voc':
      const smartVocModule = await import('./controllers/smartVocForm.controller');
      handlers.smartVoc = smartVocModule.smartVocFormHandler || smartVocModule;
      return handlers.smartVoc;
    case 'cognitive-task':
      const cognitiveTaskModule = await import('./controllers/cognitiveTask.controller');
      handlers.cognitiveTask = cognitiveTaskModule.cognitiveTaskHandler || cognitiveTaskModule;
      return handlers.cognitiveTask;
    case 's3':
      const s3Module = await import('./controllers/s3.controller');
      handlers.s3 = s3Module.s3Handler || s3Module;
      return handlers.s3;
    case 'participants':
      const participantsModule = await import('./controllers/participant.controller');
      handlers.participants = participantsModule.participantHandler || participantsModule;
      return handlers.participants;
    case 'websocket':
      try {
        // Manejo dinámico para WebSocket (podría no existir el archivo)
        const handler = async (_event: any, _context: any) => {
          return {
            statusCode: 501,
            body: JSON.stringify({ message: 'Servicio de WebSocket no implementado o en desarrollo' })
          };
        };
        handlers.websocket = handler;
        return handler;
      } catch (error) {
        console.error('Error con controlador de websocket:', error);
        return async (_event: any, _context: any) => {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Servicio de WebSocket no disponible' })
          };
        };
      }
    default:
      // Manejo de ruta desconocida
      return null;
  }
}

// Logging mínimo (usar AWS CloudWatch para logging completo)
const log = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  }
};

/**
 * Manejador principal que detecta automáticamente el tipo de evento
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Verifica tipo de conexión - HTTP o WebSocket
  const connectionType: ConnectionType = process.env.CONNECTION_TYPE as ConnectionType || 'http';
  const functionName = process.env.LAMBDA_FUNCTION_NAME || 'unknown';

  // Inicializa el contexto para seguimiento
  context.callbackWaitsForEmptyEventLoop = false;
  const requestId = context.awsRequestId;
  log.info(`Solicitud iniciada: ${requestId} [${functionName}]`);

  try {
    if (connectionType === 'websocket') {
      return await handleWebsocketRequest(event as any, context);
    } else {
      return await handleHttpRequest(event, context);
    }
  } catch (error) {
    log.error(`Error general en el handler: ${error}`);
    
    // Formato de respuesta de error
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error interno del servidor',
        requestId,
      }),
    };
  }
};

// Manejo de solicitudes WebSocket
async function handleWebsocketRequest(
  event: APIGatewayProxyEvent & { requestContext: APIGatewayEventWebsocketRequestContext },
  context: Context
): Promise<APIGatewayProxyResult> {
  const routeKey = event.requestContext.routeKey;
  log.info(`WebSocket route: ${routeKey}`);

  // Usa lazy loading para el controlador de WebSockets
  const websocketHandler = await getHandler('websocket');
  if (!websocketHandler) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Controlador WebSocket no encontrado' }),
    };
  }

  // Maneja la solicitud WebSocket
  try {
    return await websocketHandler(event, context);
  } catch (error) {
    log.error(`Error en WebSocket handler: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error en WebSocket', error: String(error) }),
    };
  }
}

// Manejo de solicitudes HTTP
async function handleHttpRequest(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Configura headers CORS por defecto
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
  };

  // Responde a solicitudes preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
      },
      body: '',
    };
  }

  try {
    // Extrae el path para determinar el controlador
    const path = event.path || '';
    let controllerType: string | null = null;

    // Mapeo de rutas 
    if (path.startsWith('/auth')) {
      controllerType = 'auth';
    } else if (path.startsWith('/api/research') || path.startsWith('/research')) {
      controllerType = 'research';
    } else if (path.startsWith('/api/welcome-screen') || path.includes('/welcome-screen')) {
      controllerType = 'welcome-screen';
    } else if (path.startsWith('/api/thank-you-screen') || path.includes('/thank-you-screen')) {
      controllerType = 'thank-you-screen';
    } else if (path.startsWith('/api/eye-tracking-recruit') || path.includes('/eye-tracking-recruit')) {
      controllerType = 'eye-tracking-recruit';
    } else if (path.startsWith('/api/eye-tracking') || path.includes('/eye-tracking')) {
      controllerType = 'eye-tracking';
    } else if (path.startsWith('/api/smart-voc') || path.includes('/smart-voc')) {
      controllerType = 'smart-voc';
    } else if (path.startsWith('/api/cognitive-task') || path.includes('/cognitive-task')) {
      controllerType = 'cognitive-task';
    } else if (path.startsWith('/api/s3')) {
      controllerType = 's3';
    } else if (path.startsWith('/api/participants')) {
      controllerType = 'participants';
    } else if (path === '/') {
      // Ruta principal/health check
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'online',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Si no se encontró un controlador adecuado
    if (!controllerType) {
      log.info(`Ruta no encontrada: ${path}`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: `Ruta no encontrada: ${path}` }),
      };
    }

    // Carga dinámica del controlador adecuado (lazy loading)
    const controller = await getHandler(controllerType);
    if (!controller) {
      return {
        statusCode: 501,
        headers,
        body: JSON.stringify({ message: `Controlador no implementado: ${controllerType}` }),
      };
    }

    // Ejecuta el controlador con los parámetros adecuados
    return await controller(event, context);
  } catch (error) {
    log.error(`Error en HTTP handler: ${error}`);
    
    // Devuelve respuesta de error formateada
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Error en el servidor',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        requestId: context.awsRequestId,
      }),
    };
  }
};

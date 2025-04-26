import { 
  APIGatewayProxyEvent, 
  APIGatewayProxyResult, 
  Context
} from 'aws-lambda';
import logger from './logger';
import { type Logger as PinoLogger } from 'pino';
import { APIGatewayEventWebsocketRequestContext } from './types/websocket';
import { ROUTE_DEFINITIONS } from './routeDefinitions';
import { HttpError, InternalServerError, NotFoundError } from './errors';

type ConnectionType = 'http' | 'websocket';

// Importaciones lazy para reducir el tamaño de carga inicial
const handlers: Record<string, any> = {};

// Mapa de importadores dinámicos para los controladores
const controllerImports = {
  'auth': () => import('./controllers/auth.controller'),
  'research': () => import('./controllers/newResearch.controller'),
  'welcome-screen': () => import('./controllers/welcomeScreen.controller'),
  'thank-you-screen': () => import('./controllers/thankYouScreen.controller'),
  'eye-tracking': () => import('./controllers/eyeTracking.controller'),
  'eye-tracking-recruit': () => import('./controllers/eyeTrackingRecruit.controller'),
  'smart-voc': () => import('./controllers/smartVocForm.controller'),
  'cognitive-task': () => import('./controllers/cognitiveTask.controller'),
  's3': () => import('./controllers/s3.controller'),
  'participants': () => import('./controllers/participant.controller'),
};

// Función para obtener un handler de forma lazy (refactorizada)
async function getHandler(type: string) {
  if (handlers[type]) return handlers[type];

  if (type === 'websocket') {
    try {
      // Placeholder para la lógica real del handler WebSocket
      const websocketHandler = async (_event: any, _context: any) => {
        return {
          statusCode: 501,
          body: JSON.stringify({ message: 'Servicio de WebSocket no implementado o en desarrollo' })
        };
      };
      handlers.websocket = websocketHandler;
      return websocketHandler;
    } catch (error) {
      logger.error('Error con controlador de websocket:', error);
      return async (_event: any, _context: any) => {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Servicio de WebSocket no disponible' })
        };
      };
    }
  }

  // Buscar en el mapa de importadores
  const importer = controllerImports[type as keyof typeof controllerImports];

  if (importer) {
    try {
      const module: any = await importer(); // Tratar como any para acceso dinámico
      
      let handler: Function | undefined;

      // <<< INICIO: Lógica específica para 'research' >>>
      if (type === 'research' && typeof module.newResearchHandler === 'function') {
          handler = module.newResearchHandler;
          logger.info(`Usando exportación específica 'newResearchHandler' para ${type}`);
      } 
      // <<< FIN: Lógica específica para 'research' >>>
      // <<< INICIO: Lógica específica para 'welcome-screen' >>>
      else if (type === 'welcome-screen' && typeof module.welcomeScreenHandler === 'function') {
          handler = module.welcomeScreenHandler;
          logger.info(`Usando exportación específica 'welcomeScreenHandler' para ${type}`);
      }
      // <<< FIN: Lógica específica para 'welcome-screen' >>>
      // <<< INICIO: Lógica específica para 'smart-voc' >>>
      else if (type === 'smart-voc' && typeof module.smartVocFormHandler === 'function') {
          handler = module.smartVocFormHandler;
          logger.info(`Usando exportación específica 'smartVocFormHandler' para ${type}`);
      }
      // <<< FIN: Lógica específica para 'smart-voc' >>>
      // <<< INICIO: Lógica específica para 'thank-you-screen' >>>
      else if (type === 'thank-you-screen' && typeof module.thankYouScreenHandler === 'function') {
          handler = module.thankYouScreenHandler;
          logger.info(`Usando exportación específica 'thankYouScreenHandler' para ${type}`);
      }
      // <<< FIN: Lógica específica para 'thank-you-screen' >>>
      // <<< INICIO: Lógica específica para 'cognitive-task' >>>
      else if (type === 'cognitive-task' && typeof module.cognitiveTaskHandler === 'function') {
          handler = module.cognitiveTaskHandler;
          logger.info(`Usando exportación específica 'cognitiveTaskHandler' para ${type}`);
      }
      // <<< FIN: Lógica específica para 'cognitive-task' >>>
      // <<< Mantener la lógica existente como fallback >>>
      // 1. Priorizar la exportación nombrada 'handler' (si no es uno de los específicos)
      else if (typeof module.handler === 'function') {
        handler = module.handler;
        logger.info(`Usando exportación 'handler' para ${type}`);
      }
      // 2. Si no, buscar la primera función exportada (si no es uno de los específicos)
      else {
        for (const key in module) {
          // Asegurarse de no seleccionar la clase constructora si ya intentamos el específico
          if (typeof module[key] === 'function' && 
              !(type === 'research' && key === 'NewResearchController') &&
              !(type === 'welcome-screen' && key === 'WelcomeScreenController') &&
              !(type === 'smart-voc' && key === 'SmartVOCFormController') &&
              !(type === 'thank-you-screen' && key === 'ThankYouScreenController') &&
              !(type === 'cognitive-task' && key === 'CognitiveTaskController')) { // Added check for CognitiveTaskController
            handler = module[key];
            logger.info(`Usando la primera función exportada encontrada ('${key}') para ${type}`);
            break; // Usar la primera que se encuentre
          }
        }
      }
      // 3. Si no, verificar si el módulo mismo es una función (esto probablemente no aplique a nuestros controladores)
      if (!handler && typeof module === 'function') {
        handler = module;
         logger.info(`Usando el módulo exportado directamente como handler para ${type}`);
      }

      if (handler) { // Verificar si se encontró un handler válido
        logger.info(`Controlador listo para ${type}`);
        handlers[type] = handler; 
        return handler;
      } else {
        logger.error(`No se encontró una función handler exportada válida en el módulo para ${type}`);
        return null;
      }
    } catch (error) {
      logger.error({ err: error, controllerType: type }, `Error al cargar dinámicamente el controlador ${type}`);
      return null;
    }
  } else {
    logger.error(`Tipo de controlador desconocido: ${type}`);
    return null; // Manejo de tipo desconocido
  }
}

/**
 * Manejador principal que detecta automáticamente el tipo de evento
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const connectionType: ConnectionType = process.env.CONNECTION_TYPE as ConnectionType || 'http';
  const requestId = context.awsRequestId;

  // Log de inicio de solicitud con Pino (incluye requestId automáticamente si se configura)
  const requestLogger = logger.child({ requestId });
  requestLogger.info({ event }, `Solicitud iniciada [${connectionType}]`);

  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let response;
    if (connectionType === 'websocket') {
      response = await handleWebsocketRequest(event as any, context, requestLogger);
    } else {
      response = await handleHttpRequest(event, context, requestLogger);
    }
    requestLogger.info({ statusCode: response.statusCode }, 'Solicitud completada');
    return response;

  } catch (error) {
    requestLogger.error({ err: error }, 'Error general no capturado en el handler principal');
    
    // Formato de respuesta de error genérico
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

// Manejo de solicitudes HTTP (Refactorizado con manejo de errores)
async function handleHttpRequest(
  event: APIGatewayProxyEvent,
  context: Context,
  requestLogger: PinoLogger
): Promise<APIGatewayProxyResult> {
  // Configura headers CORS por defecto
  const headers = {
    'Access-Control-Allow-Origin': '*' /* Considera restringir esto en producción */,
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
  };

  // Responde a solicitudes preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, PATCH, OPTIONS' /* Incluir OPTIONS */,
        'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Requested-With' /* Revisar si se necesitan más */,
      },
      body: '',
    };
  }

  try {
    const path = event.path || '';
    let controllerType: string | null = null;

    // Manejo especial para la ruta raíz
    if (path === '/') {
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

    // Buscar el controlador correspondiente en las definiciones de ruta
    for (const route of ROUTE_DEFINITIONS) {
      if (route.pathPattern.test(path)) {
        controllerType = route.controllerType;
        requestLogger.info(`Ruta encontrada: ${path} -> Controlador: ${controllerType}`);
        break; // Detenerse en la primera coincidencia
      }
    }

    // Si no se encontró un controlador adecuado
    if (!controllerType) {
       // Lanzar un error NotFoundError aquí en lugar de devolver directamente
       throw new NotFoundError(`Ruta no encontrada: ${path}`);
    }

    // Carga dinámica del controlador adecuado (lazy loading)
    const controller = await getHandler(controllerType);
    if (!controller) {
      // Este es un error interno real del sistema
      requestLogger.error(`Error interno: Controlador para ${controllerType} no pudo ser cargado por getHandler.`);
      throw new InternalServerError(`Error interno al cargar el controlador: ${controllerType}`);
    }

    // Ejecuta el controlador con los parámetros adecuados
    // Los controladores creados con createController esperan solo (event)
    return await controller(event); 

  } catch (error: unknown) {
    // <<< Bloque catch mejorado >>>
    let responseError: HttpError;

    if (error instanceof HttpError) {
      // Error HTTP conocido (lanzado por nosotros o una dependencia)
      responseError = error;
      // Loggear errores 4xx como warning, 5xx como error
      if (responseError.statusCode >= 500) {
        requestLogger.error({ err: error }, `HTTP Error ${responseError.statusCode}: ${responseError.message}`);
      } else {
        requestLogger.warn({ err: error }, `HTTP Error ${responseError.statusCode}: ${responseError.message}`);
      }
    } else {
      // Error inesperado (Error genérico, TypeError, etc.)
      requestLogger.error({ err: error }, `Error inesperado procesando la solicitud HTTP`);
      responseError = new InternalServerError('Ha ocurrido un error inesperado');
    }

    // Construir la respuesta HTTP desde el responseError
    return {
      statusCode: responseError.statusCode,
      headers,
      body: JSON.stringify({
        message: responseError.message,
        // Opcionalmente incluir el código de error interno si existe
        ...(responseError.code && { code: responseError.code }),
        // Incluir stack trace solo en desarrollo
        ...(process.env.NODE_ENV !== 'production' && { stack: responseError.stack }),
        requestId: context.awsRequestId, 
      }),
    };
  }
};

// <<< Re-add handleWebsocketRequest function definition >>>
async function handleWebsocketRequest(
  event: APIGatewayProxyEvent & { requestContext: APIGatewayEventWebsocketRequestContext },
  context: Context,
  requestLogger: PinoLogger
): Promise<APIGatewayProxyResult> {
  const routeKey = event.requestContext.routeKey;
  requestLogger.info(`WebSocket route: ${routeKey}`);

  // Usa lazy loading para el controlador de WebSockets
  const websocketHandler = await getHandler('websocket');
  if (!websocketHandler) {
    requestLogger.error('Controlador WebSocket no encontrado'); // Log error
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Controlador WebSocket no encontrado' }),
    };
  }

  // Maneja la solicitud WebSocket
  try {
    return await websocketHandler(event, context, requestLogger);
  } catch (error: unknown) {
    requestLogger.error({ err: error, routeKey }, `Error en WebSocket handler`); // Log con error
    // Usar HttpError aquí sería ideal si websocketHandler los lanza
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error en WebSocket'}), // Evitar exponer error directo
    };
  }
}

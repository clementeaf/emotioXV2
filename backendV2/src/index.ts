import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';
import { type Logger as PinoLogger } from 'pino';
import { HttpError, InternalServerError, NotFoundError } from './errors';
import logger from './logger';
import { corsMiddleware, getCorsHeaders } from './middlewares/cors';
import { ROUTE_DEFINITIONS } from './routeDefinitions';
import { initializationService } from './services/initialization.service';
import { APIGatewayEventWebsocketRequestContext } from './types/websocket';
// Import estático del controlador admin para forzar su inclusión en el bundle
// (This import ensures admin controller is included in bundle)
import * as educationalContentHandler from './controllers/educationalContentHandler';

type ConnectionType = 'http' | 'websocket';

// Importaciones lazy para reducir el tamaño de carga inicial
type HandlerFunction = (...args: unknown[]) => Promise<unknown>;
const handlers: Record<string, HandlerFunction | undefined> = {};

// Mapa de importadores dinámicos para los controladores
const controllerImports = {
  'admin': () => import('./controllers/admin.controller'),
  'auth': () => import('./controllers/auth.controller'),
  'companies': () => import('./controllers/company.controller'),
  'research': () => import('./controllers/newResearch.controller'),
  'welcome-screen': () => import('./controllers/welcomeScreen.controller'),
  'thank-you-screen': () => import('./controllers/thankYouScreen.controller'),
  'eye-tracking': () => import('./controllers/eyeTracking.controller'),
  'eye-tracking-recruit': () => import('./controllers/eyeTrackingRecruit.controller'),
  'smart-voc': () => import('./controllers/smartVocForm.controller'),
  'cognitive-task': () => import('./controllers/cognitiveTask.controller'),
  's3': () => import('./controllers/s3.controller'),
  'participants': () => import('./controllers/participant.controller'),
  'researchForms': () => import('./controllers/getResearchAvailableForms'),
  'module-responses': () => import('./controllers/moduleResponse.controller'),
  'researchInProgress': () => import('./controllers/researchInProgress.controller'),
  'config': () => import('./controllers/config.controller'),
  'iat': () => import('./controllers/iat.controller'),
};

// Función para obtener un handler de forma lazy (refactorizada)
async function getHandler(type: string): Promise<HandlerFunction | null> {
  if (handlers[type]) return handlers[type] || null;

  // Manejo especial para el controlador admin (import estático)
  if (type === 'admin') {
    // Admin controller is now enabled - handle via dynamic import like other controllers
    const importFn = controllerImports[type];
    if (!importFn) {
      logger.error(`Controller importer for '${type}' not found`);
      return null;
    }
    
    try {
      const controllerModule = await importFn();
      const handler = controllerModule.handler;

      if (typeof handler === 'function') {
        handlers[type] = handler as HandlerFunction;
        return handler as HandlerFunction;
      } else {
        logger.error(`Admin controller handler is missing or not a function`);
        return null;
      }
    } catch (error: unknown) {
      logger.error({ error }, 'Error importing admin controller');
      return null;
    }
  }

  // Manejo especial para el controlador educational-content (import estático)
  if (type === 'educational-content') {
    try {
      const handler = educationalContentHandler.handler;

      if (typeof handler === 'function') {
        handlers[type] = handler as HandlerFunction;
        return handler as HandlerFunction;
      } else {
        logger.error(`Educational content controller handler is missing or not a function`);
        return null;
      }
    } catch (error: unknown) {
      logger.error({ error }, 'Error importing educational content controller');
      return null;
    }
  }

  if (type === 'websocket') {
    // 🎯 IMPLEMENTAR WEBSOCKET HANDLER REAL
    try {
      const websocketHandler = async (event: APIGatewayProxyEvent, _context?: Context) => {
        const routeKey = event.requestContext.routeKey;
        logger.info(`WebSocket route: ${routeKey}`);

        switch (routeKey) {
          case '$connect':
            logger.info('Nueva conexión WebSocket establecida');
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Connected' })
            };

          case '$disconnect':
            logger.info('Conexión WebSocket cerrada');
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Disconnected' })
            };

          case '$default':
          case 'message':
            try {
              const body = JSON.parse(event.body || '{}');
              logger.info('Mensaje WebSocket recibido:', body);

              // 🎯 MANEJAR DIFERENTES TIPOS DE MENSAJES
              switch (body.type) {
                case 'MONITORING_CONNECT':
                  logger.info('Evento de monitoreo recibido:', body.data);
                  return {
                    statusCode: 200,
                    body: JSON.stringify({
                      message: 'Monitoring event received',
                      data: body.data
                    })
                  };

                case 'PARTICIPANT_LOGIN':
                case 'PARTICIPANT_STEP':
                case 'PARTICIPANT_DISQUALIFIED':
                case 'PARTICIPANT_QUOTA_EXCEEDED':
                case 'PARTICIPANT_COMPLETED':
                  logger.info('Evento de participante recibido:', body);
                  return {
                    statusCode: 200,
                    body: JSON.stringify({
                      message: 'Participant event received',
                      data: body.data
                    })
                  };

                default:
                  logger.warn('Tipo de mensaje no reconocido:', body.type);
                  return {
                    statusCode: 400,
                    body: JSON.stringify({
                      message: 'Unknown message type',
                      type: body.type
                    })
                  };
              }
            } catch (parseError: unknown) {
              logger.error({ error: parseError }, 'Error parseando mensaje WebSocket');
              return {
                statusCode: 400,
                body: JSON.stringify({
                  message: 'Invalid JSON message'
                })
              };
            }

          default:
            logger.warn({ route: routeKey }, 'Ruta WebSocket no manejada');
            return {
              statusCode: 400,
              body: JSON.stringify({
                message: 'Unknown WebSocket route',
                route: routeKey
              })
            };
        }
      };
      handlers.websocket = websocketHandler as HandlerFunction;
      return websocketHandler as HandlerFunction;
    } catch (error: unknown) {
      logger.error({ error }, 'Error loading WebSocket handler');
      return null;
    }
  }

  // Standard dynamic import based on controller type
  const importer = controllerImports[type as keyof typeof controllerImports];

  if (importer) {
    try {
      const module: unknown = await importer();
      const moduleAsRecord = module as Record<string, unknown>;
      // Convention: Expect a 'handler' export (not mainHandler)
      const handler = moduleAsRecord.handler || moduleAsRecord.mainHandler;

      if (typeof handler === 'function') {
        logger.info(`Controller ready for ${type} using 'handler' export.`);
        handlers[type] = handler as HandlerFunction;
        return handler as HandlerFunction;
      } else {
        logger.error(`Module for controller type '${type}' loaded, but 'handler' export is missing or not a function.`);
        return null;
      }
    } catch (error: unknown) {
      logger.error({ err: error, controllerType: type }, `Error dynamically loading controller module '${type}'`);
      return null;
    }
  } else {
    logger.error(`Unknown controller type requested: ${type}`);
    return null;
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

  // 🚀 Inicialización automática de recursos (solo primera vez)
  try {
    await initializationService.initialize();
  } catch (error: unknown) {
    requestLogger.warn({ err: error }, 'Warning: Auto-initialization failed, continuing anyway');
  }

  try {
    let response;
    if (connectionType === 'websocket') {
      response = await handleWebsocketRequest(event as any, context, requestLogger);
    } else {
      response = await handleHttpRequest(event, context, requestLogger);
    }
    requestLogger.info({ statusCode: response.statusCode }, 'Solicitud completada');
    return response;

  } catch (error: unknown) {
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
  // 🎯 APLICAR MIDDLEWARE CORS
  const corsResponse = await corsMiddleware(event);
  if (corsResponse) {
    return corsResponse;
  }

  // Configura headers CORS usando el middleware
  const headers = getCorsHeaders(event);

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
    return await controller(event) as APIGatewayProxyResult;

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
    return await websocketHandler(event, context, requestLogger) as APIGatewayProxyResult;
  } catch (error: unknown) {
    requestLogger.error({ err: error, routeKey }, `Error en WebSocket handler`); // Log con error
    // Usar HttpError aquí sería ideal si websocketHandler los lanza
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error en WebSocket' }), // Evitar exponer error directo
    };
  }
}

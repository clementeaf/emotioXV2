import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { type Logger as PinoLogger } from 'pino';
import { getHandler } from './dispatcher';
import { HttpError, InternalServerError, NotFoundError } from './errors';
import { corsMiddleware, getCorsHeaders } from './middlewares/cors';
import { ROUTE_DEFINITIONS } from './routeDefinitions';

// Manejo de solicitudes HTTP
export async function handleHttpRequest(
  event: APIGatewayProxyEvent,
  context: Context,
  requestLogger: PinoLogger
): Promise<APIGatewayProxyResult> {
  // Aplicar middleware de CORS
  const corsResponse = await corsMiddleware(event);
  if (corsResponse) {
    return corsResponse;
  }

  // Obtener headers CORS dinámicos
  const corsHeaders = getCorsHeaders(event);
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

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
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Buscar el controlador correspondiente en las definiciones de ruta
    for (const route of ROUTE_DEFINITIONS) {
      if (route.pathPattern.test(path)) {
        controllerType = route.controllerType;
        requestLogger.info(`Ruta encontrada: ${path} -> Controlador: ${controllerType}`);
        break;
      }
    }

    if (!controllerType) {
      throw new NotFoundError(`Ruta no encontrada: ${path}`);
    }

    const controller = await getHandler(controllerType);
    if (!controller) {
      requestLogger.error(`Error interno: Controlador para ${controllerType} no pudo ser cargado por getHandler.`);
      throw new InternalServerError(`Error interno al cargar el controlador: ${controllerType}`);
    }

    // Ejecuta el controlador
    // Asumiendo que el controlador puede necesitar el logger
    // Necesita retorno explícito para APIGatewayProxyResult
    const result = await controller(event, context, requestLogger) as APIGatewayProxyResult;
    return result;

  } catch (error: unknown) {
    let responseError: HttpError;

    if (error instanceof HttpError) {
      responseError = error;
      if (responseError.statusCode >= 500) {
        requestLogger.error({ err: error }, `HTTP Error ${responseError.statusCode}: ${responseError.message}`);
      } else {
        requestLogger.warn({ err: error }, `HTTP Error ${responseError.statusCode}: ${responseError.message}`);
      }
    } else {
      requestLogger.error({ err: error }, `Error inesperado procesando la solicitud HTTP`);
      responseError = new InternalServerError('Ha ocurrido un error inesperado');
    }

    // Construir la respuesta HTTP desde el responseError
    return {
      statusCode: responseError.statusCode,
      headers,
      body: JSON.stringify({
        message: responseError.message,
        ...(responseError.code && { code: responseError.code }),
        ...(process.env.NODE_ENV !== 'production' && { stack: responseError.stack }),
        requestId: context.awsRequestId,
      }),
    };
  }
}

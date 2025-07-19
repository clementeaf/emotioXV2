import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, validateTokenAndSetupAuth } from './controller.utils';

/**
 * Tipo para funciones que procesan eventos de API Gateway con un controlador
 */
export type ControllerFunction = (
  event: APIGatewayProxyEvent,
  userId: string
) => Promise<APIGatewayProxyResult>;

/**
 * Tipo para mapa de rutas con métodos HTTP y controladores
 */
export interface RouteMap {
  [path: string]: {
    [method: string]: ControllerFunction;
  };
}

/**
 * Opciones para el decorador de controlador
 */
export interface ControllerOptions {
  /** Rutas que no requieren autenticación */
  publicRoutes?: Array<{ path: string; method: string }>;
  /** Ruta base del controlador, ejemplo: '/research' */
  basePath: string;
}

/**
 * Crea un controlador API con manejo estándar de autenticación y CORS
 *
 * @param routeMap Mapa de rutas que relaciona paths y métodos con funciones controladoras
 * @param options Opciones de configuración
 * @returns Función handler para usar con API Gateway
 */
export function createController(
  routeMap: RouteMap,
  options: ControllerOptions
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {

  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Extraer método y ruta
      const method = event.httpMethod;
      const path = event.path;

      console.log(`CONTROLLER [${options.basePath}] - Solicitud recibida:`, {
        method,
        path,
        pathParameters: event.pathParameters
      });

      // Para solicitudes OPTIONS (preflight CORS), responder inmediatamente
      if (method === 'OPTIONS') {
        console.log(`CONTROLLER [${options.basePath}] - Respondiendo a solicitud CORS preflight`);
        return {
          statusCode: 200,
          headers: {
            // Permitir todos los orígenes
            'Access-Control-Allow-Origin': '*',
            // Métodos HTTP permitidos
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            // Permitir los headers requeridos
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Requested-With, Accept, Cache-Control, cache-control, Pragma, pragma, X-Amz-User-Agent',
            // Tiempo máximo de cache de la preflight en segundos
            'Access-Control-Max-Age': '600',
            // Tipo de contenido
            'Content-Type': 'application/json',
            'Content-Length': '0'
          },
          body: ''
        };
      }

      // Comprobar si es una ruta pública (sin autenticación)
      const isPublicRoute = options.publicRoutes?.some(route => {
        // Crear regex para el patrón de ruta pública
        const publicRouteRegex = new RegExp(
          `^${route.path.replace(/\/{([^\/]+)}/g, '/([^/]+)')}$`
        );
        return publicRouteRegex.test(path) && route.method === method;
      });

      let userId: string | null = null;

      // Si no es una ruta pública, validar autenticación
      if (!isPublicRoute) {
        const authResult = await validateTokenAndSetupAuth(event, path);

        // Si el resultado es una respuesta de error, retornarla
        if ('statusCode' in authResult) {
          return authResult;
        }

        // Si no hay error, extraer el userId
        userId = authResult.userId;
      }

      // Encontrar el controlador para la ruta
      let controller: ControllerFunction | undefined;
      let matchedPath: string | undefined;

      // Buscar coincidencia exacta primero
      if (routeMap[path] && routeMap[path][method]) {
        controller = routeMap[path][method];
        matchedPath = path;
      } else {
        // Buscar coincidencia por patrones (útil para rutas con parámetros)
        for (const routePath in routeMap) {
          // Construir la ruta completa combinando basePath y la clave relativa
          // Asegurarse de manejar barras dobles si basePath termina o routePath empieza con /
          const fullRoutePattern = `${options.basePath.replace(/\/$/, '')}/${routePath.replace(/^\//, '')}`;
          console.log(`CONTROLLER [${options.basePath}] - Probando patrón: ${fullRoutePattern}`); // Log para ver patrón
          const routeRegex = new RegExp(
            // Usar el patrón completo para la regex
            `^${fullRoutePattern.replace(/\/{([^\/]+)}/g, '/([^/]+)')}$`
          );
          console.log(`CONTROLLER [${options.basePath}] - Regex: ${routeRegex}`); // Log para ver regex

          if (routeRegex.test(path) && routeMap[routePath][method]) {
            controller = routeMap[routePath][method];
            matchedPath = routePath; // Mantener el path relativo original para logs?
            console.log(`CONTROLLER [${options.basePath}] - Coincidencia encontrada con patrón: ${fullRoutePattern}`);

            // Extraer parámetros de la URL usando la regex del patrón completo
            const paramNames = (fullRoutePattern.match(/\/{([^\/]+)}/g) || [])
              .map(p => p.substring(2, p.length - 1));
            const paramValues = path.match(routeRegex)?.slice(1);

            if (paramNames.length > 0 && paramValues) {
              event.pathParameters = event.pathParameters || {};
              paramNames.forEach((name, i) => {
                if (event.pathParameters && paramValues[i]) {
                  event.pathParameters[name] = paramValues[i];
                }
              });
            }

            break;
          }
        }
      }

      // Si encontramos un controlador, ejecutarlo
      if (controller && userId !== null) {
        console.log(`CONTROLLER [${options.basePath}] - Ejecutando controlador para ruta: ${matchedPath}, método: ${method}`);
        console.log(`CONTROLLER [${options.basePath}] - Pasando pathParameters:`, JSON.stringify(event.pathParameters || {}));
        return await controller(event, userId);
      } else if (controller && isPublicRoute) {
        console.log(`CONTROLLER [${options.basePath}] - Ejecutando controlador público para ruta: ${matchedPath}, método: ${method}`);
        console.log(`CONTROLLER [${options.basePath}] - Pasando pathParameters:`, JSON.stringify(event.pathParameters || {}));
        return await controller(event, '');
      }

      // Si no hay controlador para esta ruta/método
      console.log(`CONTROLLER [${options.basePath}] - Ruta no encontrada:`, { path, method });
      return createResponse(404, {
        error: 'Ruta no encontrada',
        path: event.path,
        method: event.httpMethod,
        details: `No se encontró controlador para ${method} ${path}`
      });

    } catch (error: any) {
      // Manejar errores generales
      console.error(`CONTROLLER [${options.basePath}] - Error no controlado:`, error);
      return createResponse(500, {
        error: 'Error interno del servidor',
        details: error.message || 'Error no especificado'
      });
    }
  };
}

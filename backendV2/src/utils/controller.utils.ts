import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders as getCorsHeadersFromMiddleware } from '../middlewares/cors';

/**
 * Obtiene los headers CORS estándar para todas las respuestas API
 * @deprecated Use getCorsHeaders from cors middleware with event parameter instead
 * @returns Objeto con los headers CORS configurados
 */
export const getCorsHeaders = (): { [key: string]: string } => {
  // Lee el origen permitido desde una variable de entorno
  // Usa 'http://localhost:4700' como fallback si no está definida (para desarrollo)
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:4700';

  return {
    // Configuración de CORS para permitir el origen configurado
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    // Permitir los headers comunes usados por la aplicación
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Requested-With, Accept, Cache-Control, cache-control, Pragma, pragma, X-Amz-User-Agent',
    // Métodos HTTP permitidos
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    // Definir el tipo de contenido por defecto
    'Content-Type': 'application/json'
  };
};

/**
 * Obtiene los headers CORS dinámicos basados en el evento
 * @param event Evento de API Gateway
 * @returns Objeto con los headers CORS configurados dinámicamente
 */
export const getDynamicCorsHeaders = (event: APIGatewayProxyEvent): { [key: string]: string | boolean } => {
  return getCorsHeadersFromMiddleware(event);
};

/**
 * Crea una respuesta HTTP estándar con los headers CORS apropiados
 * @param statusCode Código de estado HTTP
 * @param body Cuerpo de la respuesta (se convertirá a JSON)
 * @param event Evento de API Gateway para determinar CORS dinámicos
 * @returns Respuesta HTTP formateada
 */
export const createResponse = (statusCode: number, body: any, event?: APIGatewayProxyEvent): APIGatewayProxyResult => {
  const corsHeaders = event ? getDynamicCorsHeaders(event) : getCorsHeaders();
  
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
};

/**
 * Crea una respuesta HTTP estándar con los headers CORS dinámicos
 * @param statusCode Código de estado HTTP
 * @param body Cuerpo de la respuesta (se convertirá a JSON)
 * @param event Evento de API Gateway para determinar el origen
 * @returns Respuesta HTTP formateada con CORS dinámico
 */
export const createResponseWithDynamicCors = (statusCode: number, body: any, event: APIGatewayProxyEvent): APIGatewayProxyResult => {
  const corsHeaders = getDynamicCorsHeaders(event);
  
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
};

/**
 * Crea una respuesta de error estándar
 * @param message Mensaje de error
 * @param statusCode Código de estado HTTP
 * @returns Respuesta HTTP de error formateada
 */
export const errorResponse = (message: string, statusCode: number = 500, event?: APIGatewayProxyEvent): APIGatewayProxyResult => {
  return createResponse(statusCode, { message }, event);
};

/**
 * Valida un token de autenticación y configura el contexto de autorización
 * 
 * @param event Evento de API Gateway
 * @param path Ruta de la solicitud (para registro)
 * @returns Objeto con userId si la validación es exitosa, o respuesta de error si falla
 */
export const validateTokenAndSetupAuth = async (
  event: APIGatewayProxyEvent,
  path: string
): Promise<{ userId: string } | APIGatewayProxyResult> => {
  // Extraer token de autorización
  const authHeader = event.headers.Authorization || event.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  
  // Verificar si existe token
  if (!token) {
    console.log('Solicitud sin token de autorización');
    return createResponse(401, { 
      error: 'No autorizado: Token no proporcionado',
      details: 'Se requiere un token de autorización para acceder a este recurso'
    });
  }
  
  try {
    // Registrar información de autenticación para depuración
    console.log('Procesando autenticación para ruta:', path);
    console.log('Token recibido (primeros caracteres):', token.substring(0, 15) + '...');
    
    // Validar token y obtener información del usuario
    const authService = (await import('../services/auth.service')).authService;
    const payload = await authService.validateToken(token);
    
    // Verificar si tenemos un ID válido
    if (!payload || !payload.id) {
      console.error('Token válido pero sin ID de usuario:', payload);
      return createResponse(401, { 
        error: 'Token inválido: Sin identificación de usuario',
        details: 'El token es válido pero no contiene un ID de usuario (id o sub)' 
      });
    }
    
    console.log('Token validado correctamente. Usuario:', payload.id);
    const userId = payload.id;
    
    // Configurar el contexto de autorización para que los controladores puedan acceder
    if (!event.requestContext.authorizer) {
      event.requestContext.authorizer = {};
    }
    
    if (!event.requestContext.authorizer.claims) {
      event.requestContext.authorizer.claims = {};
    }
    
    // Añadir el ID del usuario al contexto
    event.requestContext.authorizer.claims.sub = userId;
    
    // Devolver el ID del usuario para uso en el controlador
    return { userId };
    
  } catch (error: any) {
    // Proporcionar mensajes de error más específicos y útiles
    console.error('Error al validar token:', error);
    
    let errorMessage = 'Token inválido o expirado';
    let errorDetails = error.message || 'Error de autenticación no especificado';
    
    if (error.message && error.message.includes('expirado')) {
      errorMessage = 'Token expirado';
      errorDetails = 'Su sesión ha caducado. Por favor, inicie sesión nuevamente';
    } else if (error.message && error.message.includes('firma')) {
      errorMessage = 'Token con firma inválida';
      errorDetails = 'El token de autenticación ha sido alterado o es inválido';
    }
    
    return createResponse(401, { 
      error: errorMessage,
      details: errorDetails
    });
  }
};

/**
 * Función auxiliar para extraer el ID de usuario del evento
 * 
 * @param event Evento de API Gateway
 * @returns ID del usuario o null si no está autenticado
 */
export const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  try {
    // Intentar obtener el ID del usuario del contexto de autorización
    if (event.requestContext.authorizer?.claims?.sub) {
      return event.requestContext.authorizer.claims.sub;
    }
    
    // No usar IDs simulados bajo ninguna circunstancia
    return null;
  } catch (error) {
    console.error('Error al obtener el ID del usuario:', error);
    return null;
  }
};

/**
 * Creates a controller with common error handling and CORS setup
 * @param controllerClass Class instance with methods to handle routes
 * @returns Handler function for API Gateway events
 */
export const createController = (controllerClass: any) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const method = event.httpMethod;
      const path = event.path;
      
      // Handle different HTTP methods and routes
      if (method === 'GET' && path === '/companies') {
        return await controllerClass.getAllCompanies(event);
      } else if (method === 'POST' && path === '/companies') {
        return await controllerClass.createCompany(event);
      } else if (method === 'PUT' && path.startsWith('/companies/')) {
        return await controllerClass.updateCompany(event);
      } else if (method === 'DELETE' && path.startsWith('/companies/')) {
        return await controllerClass.deleteCompany(event);
      }
      
      return createResponseWithDynamicCors(404, { message: 'Route not found' }, event);
    } catch (error: any) {
      console.error('Controller error:', error);
      return createResponseWithDynamicCors(500, { message: 'Internal server error', error: error.message }, event);
    }
  };
};

/**
 * Extracts authentication data from the API Gateway event
 * @param event API Gateway event
 * @returns Object with user authentication data
 */
export const extractAuthDataFromEvent = (event: APIGatewayProxyEvent) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  
  return {
    token,
    userId: event.requestContext.authorizer?.claims?.sub || null,
    isAuthenticated: !!token
  };
}; 
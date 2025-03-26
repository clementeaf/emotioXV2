import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Obtiene los headers CORS estándar para todas las respuestas API
 * @returns Objeto con los headers CORS configurados
 */
export const getCorsHeaders = (): { [key: string]: string } => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Requested-With,Accept,cache-control,pragma',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Expose-Headers': 'Authorization,X-Api-Key',
    'Content-Type': 'application/json'
  };
};

/**
 * Crea una respuesta HTTP estándar con los headers CORS apropiados
 * @param statusCode Código de estado HTTP
 * @param body Cuerpo de la respuesta (se convertirá a JSON)
 * @returns Respuesta HTTP formateada
 */
export const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify(body)
  };
};

/**
 * Crea una respuesta de error estándar
 * @param message Mensaje de error
 * @param statusCode Código de estado HTTP
 * @returns Respuesta HTTP de error formateada
 */
export const errorResponse = (message: string, statusCode: number): APIGatewayProxyResult => {
  return createResponse(statusCode, { error: message });
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
    
    // Si estamos en modo desarrollo, podemos usar un ID simulado
    if (process.env.USE_MOCK_DB === 'true' && process.env.NODE_ENV === 'dev') {
      console.log('Usando ID simulado en modo de desarrollo');
      return 'mock-user-id';
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener el ID del usuario:', error);
    return null;
  }
}; 
/**
 * Punto de entrada principal para la API de EmotioXV2
 * Implementa un router unificado para HTTP y WebSocket
 */

import { 
  APIGatewayProxyEvent, 
  APIGatewayProxyResult, 
  APIGatewayProxyWebsocketEventV2,
  Context
} from 'aws-lambda';

// Importar servicios y controladores mediante el índice centralizado
import { authService } from './services/auth.service';
import { 
  researchHandler, 
  welcomeScreenHandler, 
  thankYouScreenHandler,
  eyeTrackingHandler,
  authHandler
} from './controllers';

// Importar controladores específicos
import { smartVocFormHandler } from './controllers/smartVocForm.controller';
import { s3Handler } from './controllers/s3.controller';
import { participantHandler } from './controllers/participant.controller';
import { cognitiveTaskController } from './controllers/cognitiveTask.controller';
import { corsHeaders, createResponse, errorHandler } from './utils/responses';

/**
 * Tipo para identificar eventos de Lambda
 */
type LambdaEvent = APIGatewayProxyEvent | APIGatewayProxyWebsocketEventV2;

/**
 * Mapa de rutas para los controladores HTTP
 */
const httpRouteHandlers: Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> = {
  'auth': authHandler,
  'research': researchHandler,
  'welcome-screen': welcomeScreenHandler,
  'thank-you-screen': thankYouScreenHandler,
  'smart-voc': smartVocFormHandler,
  'cognitive-task': cognitiveTaskController,
  'eye-tracking': eyeTrackingHandler,
  's3': s3Handler,
  'participants': participantHandler
};

/**
 * Funciones simples para manejar WebSocket mientras se implementa la solución completa
 */
async function handleWebSocketConnection(event: APIGatewayProxyWebsocketEventV2, _context: Context): Promise<any> {
  console.log('Conexión WebSocket establecida:', event.requestContext.connectionId);
  return { statusCode: 200, body: 'Conexión establecida' };
}

async function handleWebSocketDisconnection(event: APIGatewayProxyWebsocketEventV2, _context: Context): Promise<any> {
  console.log('Conexión WebSocket cerrada:', event.requestContext.connectionId);
  return { statusCode: 200, body: 'Conexión cerrada' };
}

async function handleWebSocketDefault(event: APIGatewayProxyWebsocketEventV2, _context: Context): Promise<any> {
  console.log('Mensaje WebSocket por defecto:', event.body);
  return { statusCode: 200, body: 'Mensaje recibido' };
}

async function handleWebSocketMessage(event: APIGatewayProxyWebsocketEventV2, _context: Context): Promise<any> {
  console.log('Mensaje WebSocket específico:', event.body);
  return { statusCode: 200, body: 'Mensaje específico recibido' };
}

/**
 * Mapa de rutas para WebSocket
 */
const webSocketRouteHandlers: Record<string, (event: APIGatewayProxyWebsocketEventV2, context: Context) => Promise<any>> = {
  '$connect': handleWebSocketConnection,
  '$disconnect': handleWebSocketDisconnection,
  '$default': handleWebSocketDefault,
  'message': handleWebSocketMessage
};

/**
 * Manejador principal que detecta automáticamente el tipo de evento
 */
export const handler = async (
  event: LambdaEvent, 
  context: Context
): Promise<APIGatewayProxyResult | void> => {
  // Logging para depuración
  console.log('Evento recibido:', JSON.stringify({
    connectionType: process.env.CONNECTION_TYPE || 'unknown',
    eventType: 'routeKey' in event.requestContext ? 'WEBSOCKET' : 'HTTP',
    connectionId: 'connectionId' in event.requestContext ? event.requestContext.connectionId : undefined,
    route: 'routeKey' in event.requestContext ? event.requestContext.routeKey : undefined,
    httpMethod: 'httpMethod' in event ? event.httpMethod : undefined,
    path: 'path' in event ? event.path : undefined
  }, null, 2));

  try {
    // Usar la variable de entorno CONNECTION_TYPE para determinar el tipo de evento
    // Esto se configura en serverless.yml para cada función
    if (process.env.CONNECTION_TYPE === 'websocket' && 'routeKey' in event.requestContext) {
      return await handleWebSocketEvent(event as APIGatewayProxyWebsocketEventV2, context);
    } else if (process.env.CONNECTION_TYPE === 'http' && !('routeKey' in event.requestContext)) {
      return await handleHttpEvent(event as APIGatewayProxyEvent);
    } else {
      console.error('Tipo de evento no coincide con CONNECTION_TYPE:', 
        process.env.CONNECTION_TYPE, 
        ('routeKey' in event.requestContext ? 'WEBSOCKET' : 'HTTP'));
      
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Tipo de conexión incompatible: ${process.env.CONNECTION_TYPE}`,
          eventType: ('routeKey' in event.requestContext ? 'WEBSOCKET' : 'HTTP')
        })
      };
    }
  } catch (error) {
    console.error('Error en el manejador principal:', error);
    return errorHandler(error);
  }
};

/**
 * Manejador para eventos WebSocket
 */
async function handleWebSocketEvent(
  event: APIGatewayProxyWebsocketEventV2, 
  context: Context
): Promise<any> {
  const route = event.requestContext.routeKey;
  const handler = webSocketRouteHandlers[route];

  if (!handler) {
    console.error(`Manejador no encontrado para la ruta WebSocket: ${route}`);
    return { statusCode: 400, body: 'Ruta WebSocket no soportada' };
  }

  return await handler(event, context);
}

/**
 * Manejador para eventos HTTP
 */
async function handleHttpEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Manejar preflight CORS OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Extraer base path para routing simplificado
    const path = event.path;
    const segments = path.split('/').filter(Boolean);
    
    // Mostrar endpoints disponibles en la raíz
    if (segments.length === 0) {
      return createResponse(200, { 
        message: 'EmotioXV2 API',
        version: '2.0.0',
        endpoints: Object.keys(httpRouteHandlers).map(route => `/api/${route}`)
      });
    }
    
    // Determinar el controlador a usar basado en los segmentos de la ruta
    const controllerKey = segments[0] === 'api' && segments.length > 1 
      ? segments[1]  // Nueva estructura: /api/{controller}/...
      : segments[0]; // Compatibilidad con rutas antiguas
    
    // Buscar el controlador en el mapa de rutas
    const handler = httpRouteHandlers[controllerKey];
    
    // Si no se encuentra el controlador, devolver 404
    if (!handler) {
      return createResponse(404, {
        success: false,
        message: `Ruta ${path} no encontrada`
      });
    }
    
    // Si estamos usando el nuevo formato, ajustar el path para compatibilidad
    if (segments[0] === 'api' && segments.length > 1) {
      const modifiedEvent = {...event};
      modifiedEvent.path = '/' + segments.slice(1).join('/');
      return await handler(modifiedEvent);
    }
    
    // Usar el formato antiguo directamente
    return await handler(event);
    
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * Manejador específico para rutas de autenticación
 */
async function handleAuthRoutes(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path;
  
  // Mapa de acciones de autenticación
  const authActions: Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> = {
    'login': handleLogin,
    'register': handleRegister,
    'profile': handleProfile,
    'refreshToken': handleRefreshToken
  };
  
  // Obtener el segmento después de /auth/
  const segments = path.split('/').filter(Boolean);
  const action = segments.length > 1 ? segments[1] : '';
  
  // Buscar la acción en el mapa
  const actionHandler = authActions[action];
  
  // Si no se encuentra la acción, devolver 404
  if (!actionHandler) {
    return createResponse(404, {
      success: false,
      message: `Ruta de autenticación ${path} no encontrada`
    });
  }
  
  // Ejecutar la acción
  return await actionHandler(event);
}

/**
 * Manejador para el inicio de sesión
 */
async function handleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Solo permitir método POST
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, message: 'Método no permitido' });
  }
  
  try {
    if (!event.body) {
      return createResponse(400, {
        success: false,
        message: 'Se requieren credenciales para iniciar sesión'
      });
    }

    const credentials = JSON.parse(event.body);
    
    // Validar credenciales
    if (!credentials.email || !credentials.password) {
      return createResponse(400, {
        success: false,
        message: 'Se requiere email y contraseña'
      });
    }

    // Procesar login
    const authResult = await authService.login(credentials);
    
    return createResponse(200, {
      success: true,
      message: 'Login exitoso',
      token: authResult.token,
      user: authResult.user
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    return createResponse(401, {
      success: false,
      message: error instanceof Error ? error.message : 'Credenciales inválidas'
    });
  }
}

/**
 * Manejador para el registro de usuarios
 */
async function handleRegister(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Solo permitir método POST
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, message: 'Método no permitido' });
  }
  
  try {
    if (!event.body) {
      return createResponse(400, {
        success: false,
        message: 'Se requieren datos para el registro'
      });
    }

    const userData = JSON.parse(event.body);
    
    // Validar datos
    if (!userData.email || !userData.password || !userData.name) {
      return createResponse(400, {
        success: false,
        message: 'Se requiere email, contraseña y nombre'
      });
    }

    // Registrar usuario
    const user = await authService.registerUser(userData);
    
    return createResponse(201, {
      success: true,
      message: 'Usuario registrado exitosamente',
      user
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    return createResponse(400, {
      success: false,
      message: error instanceof Error ? error.message : 'Error al registrar usuario'
    });
  }
}

/**
 * Manejador para obtener el perfil de usuario
 */
async function handleProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Solo permitir método GET
  if (event.httpMethod !== 'GET') {
    return createResponse(405, { success: false, message: 'Método no permitido' });
  }
  
  try {
    // Obtener token de autorización
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return createResponse(401, {
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await authService.validateToken(token);
    const user = await authService.getUserById(payload.id);

    return createResponse(200, {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Error al obtener perfil:', error);
    return createResponse(401, {
      success: false,
      message: 'Error al obtener perfil de usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Manejador para renovar el token
 */
async function handleRefreshToken(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Solo permitir método POST
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, message: 'Método no permitido' });
  }
  
  try {
    // Obtener token del body
    const requestBody = JSON.parse(event.body || '{}');
    
    // Intentar obtener token del header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    let token = requestBody.token || requestBody.refreshToken;
    
    if (!token && authHeader) {
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return createResponse(400, {
        success: false,
        message: 'No se proporcionó el token'
      });
    }

    // Renovar token
    const result = await authService.renovateTokenIfNeeded(token);
    
    return createResponse(200, {
      success: true,
      message: result.renewed ? 'Token renovado correctamente' : 'Token aún válido',
      token: result.token,
      expiresAt: result.expiresAt,
      user: result.user
    });
  } catch (error: any) {
    console.error('Error al renovar token:', error);
    return createResponse(401, {
      success: false,
      message: 'Error al renovar token',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

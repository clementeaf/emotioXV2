import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AdminService } from '../services/admin.service';
import { authService } from '../services/auth.service';
import { getCorsHeaders } from '../middlewares/cors';

/**
 * Respuesta estándar para endpoints de admin
 */
interface AdminResponse {
  statusCode: number;
  body: string;
  headers: {
    [key: string]: string | boolean;
  };
}

/**
 * Crear respuesta HTTP estándar
 */
const createResponse = (statusCode: number, data: any, message?: string, event?: APIGatewayProxyEvent): AdminResponse => {
  const headers = event ? getCorsHeaders(event) : {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  return {
    statusCode,
    body: JSON.stringify({
      success: statusCode >= 200 && statusCode < 300,
      data,
      message,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
};

/**
 * Crear respuesta de error
 */
const createErrorResponse = (statusCode: number, error: string, event?: APIGatewayProxyEvent): AdminResponse => {
  const headers = event ? getCorsHeaders(event) : {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
};

// Ya tenemos authService importado

/**
 * Validar autenticación de admin
 */
const validateAdminAuth = async (event: APIGatewayProxyEvent): Promise<{ isValid: boolean; userId?: string; error?: string }> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: 'Token de autorización requerido' };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await authService.validateToken(token);
    
    if (!decoded || !decoded.id) {
      return { isValid: false, error: 'Token inválido' };
    }

    // Por ahora permitimos cualquier usuario autenticado
    // En producción deberías verificar que sea admin
    return { isValid: true, userId: decoded.id };

  } catch (error) {
    return { isValid: false, error: 'Error validando autenticación' };
  }
};

/**
 * Parsear y validar body JSON
 */
const parseRequestBody = (body: string | null): { isValid: boolean; data?: any; error?: string } => {
  if (!body) {
    return { isValid: false, error: 'Body requerido' };
  }

  try {
    const data = JSON.parse(body);
    return { isValid: true, data };
  } catch (error) {
    return { isValid: false, error: 'JSON inválido' };
  }
};

/**
 * Listar todos los usuarios
 */
export const getAllUsers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('📋 Obteniendo todos los usuarios');

    // Validar autenticación
    const authValidation = await validateAdminAuth(event);
    if (!authValidation.isValid) {
      return createErrorResponse(401, authValidation.error || 'No autorizado', event);
    }

    // Obtener usuarios
    const response = await AdminService.getAllUsers();
    
    if (!response.success) {
      return createErrorResponse(500, response.error || 'Error obteniendo usuarios', event);
    }

    return createResponse(200, response.data, response.message, event);

  } catch (error) {
    console.error('❌ Error en getAllUsers:', error);
    return createErrorResponse(500, 'Error interno del servidor');
  }
};

/**
 * Obtener usuario por ID
 */
export const getUserById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      return createErrorResponse(400, 'ID de usuario requerido');
    }

    console.log(`👤 Obteniendo usuario: ${userId}`);

    // Validar autenticación
    const authValidation = await validateAdminAuth(event);
    if (!authValidation.isValid) {
      return createErrorResponse(401, authValidation.error || 'No autorizado', event);
    }

    // Obtener usuario
    const response = await AdminService.getUserById(userId);
    
    if (!response.success) {
      return createErrorResponse(response.error === 'Usuario no encontrado' ? 404 : 500, response.error || 'Error obteniendo usuario');
    }

    // No devolver el hash de la contraseña
    const { hashedPassword: _hashedPassword, ...userWithoutPassword } = response.data!;
    
    return createResponse(200, userWithoutPassword, response.message);

  } catch (error) {
    console.error('❌ Error en getUserById:', error);
    return createErrorResponse(500, 'Error interno del servidor');
  }
};

/**
 * Crear nuevo usuario
 */
export const createUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('➕ Creando nuevo usuario');

    // Validar autenticación
    const authValidation = await validateAdminAuth(event);
    if (!authValidation.isValid) {
      return createErrorResponse(401, authValidation.error || 'No autorizado', event);
    }

    // Parsear body
    const bodyValidation = parseRequestBody(event.body);
    if (!bodyValidation.isValid) {
      return createErrorResponse(400, bodyValidation.error || 'Datos inválidos');
    }

    const userData = bodyValidation.data!;

    // Validar campos requeridos
    if (!userData.email || !userData.password) {
      return createErrorResponse(400, 'Email y contraseña son obligatorios');
    }

    // Crear usuario
    const response = await AdminService.createUser(userData);
    
    if (!response.success) {
      return createErrorResponse(400, response.error || 'Error creando usuario');
    }

    return createResponse(201, response.data, response.message);

  } catch (error) {
    console.error('❌ Error en createUser:', error);
    return createErrorResponse(500, 'Error interno del servidor');
  }
};

/**
 * Actualizar usuario existente
 */
export const updateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      return createErrorResponse(400, 'ID de usuario requerido');
    }

    console.log(`✏️ Actualizando usuario: ${userId}`);

    // Validar autenticación
    const authValidation = await validateAdminAuth(event);
    if (!authValidation.isValid) {
      return createErrorResponse(401, authValidation.error || 'No autorizado', event);
    }

    // Parsear body
    const bodyValidation = parseRequestBody(event.body);
    if (!bodyValidation.isValid) {
      return createErrorResponse(400, bodyValidation.error || 'Datos inválidos');
    }

    const updates = bodyValidation.data!;

    // Validar que al menos hay un campo para actualizar
    if (!updates.email && !updates.password && !updates.role && !updates.status) {
      return createErrorResponse(400, 'Al menos un campo debe ser proporcionado para actualizar');
    }

    // Actualizar usuario
    const response = await AdminService.updateUser(userId, updates);
    
    if (!response.success) {
      return createErrorResponse(
        response.error === 'Usuario no encontrado' ? 404 : 400, 
        response.error || 'Error actualizando usuario'
      );
    }

    return createResponse(200, response.data, response.message, event);

  } catch (error) {
    console.error('❌ Error en updateUser:', error);
    return createErrorResponse(500, 'Error interno del servidor');
  }
};

/**
 * Eliminar usuario
 */
export const deleteUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      return createErrorResponse(400, 'ID de usuario requerido');
    }

    console.log(`🗑️ Eliminando usuario: ${userId}`);

    // Validar autenticación
    const authValidation = await validateAdminAuth(event);
    if (!authValidation.isValid) {
      return createErrorResponse(401, authValidation.error || 'No autorizado', event);
    }

    // Eliminar usuario
    const response = await AdminService.deleteUser(userId);
    
    if (!response.success) {
      return createErrorResponse(
        response.error === 'Usuario no encontrado' ? 404 : 500, 
        response.error || 'Error eliminando usuario'
      );
    }

    return createResponse(200, null, response.message);

  } catch (error) {
    console.error('❌ Error en deleteUser:', error);
    return createErrorResponse(500, 'Error interno del servidor');
  }
};

/**
 * Obtener estadísticas de usuarios
 */
export const getUserStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('📊 Obteniendo estadísticas de usuarios');

    // Validar autenticación
    const authValidation = await validateAdminAuth(event);
    if (!authValidation.isValid) {
      return createErrorResponse(401, authValidation.error || 'No autorizado', event);
    }

    // Obtener estadísticas
    const response = await AdminService.getUserStats();
    
    if (!response.success) {
      return createErrorResponse(500, response.error || 'Error obteniendo estadísticas');
    }

    return createResponse(200, response.data, response.message, event);

  } catch (error) {
    console.error('❌ Error en getUserStats:', error);
    return createErrorResponse(500, 'Error interno del servidor');
  }
};

/**
 * Manejar OPTIONS para CORS
 */
export const handleOptions = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: ''
  };
};
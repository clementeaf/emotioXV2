/**
 * Controlador de autenticación
 * Maneja las operaciones de registro, inicio de sesión, cierre de sesión y gestión de usuarios
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    CreateUserDto,
    CreateUserSchema,
    LoginCredentialsDto,
    LoginCredentialsSchema,
    UpdateUserDto,
    UpdateUserSchema
} from '../models/user';
import { authService } from '../services/auth.service';

/**
 * Maneja las solicitudes de autenticación
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const subPath = path.split('/auth/')[1] || '';

    // Manejar solicitudes OPTIONS (preflight CORS)
    if (method === 'OPTIONS') {
      return createCorsResponse(200, {}, event);
    }

    // Extraer token de autorización para operaciones protegidas
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    // Determinar la operación según el método y la ruta
    if (method === 'POST') {
      if (subPath === 'register') {
        return await register(event);
      } else if (subPath === 'login') {
        return await login(event);
      } else if (subPath === 'logout') {
        return await logout(event, token);
      } else if (subPath === 'refreshToken') {
        return await refreshToken(event);
      }
    } else if (method === 'GET') {
      if (subPath === 'me') {
        return await getProfile(event, token);
      } else if (subPath.startsWith('user/')) {
        const userId = subPath.replace('user/', '');
        return await getUserById(event, token, userId);
      } else if (subPath === 'users') {
        return await listUsers(event, token);
      }
    } else if (method === 'PUT') {
      if (subPath === 'me') {
        return await updateProfile(event, token);
      } else if (subPath.startsWith('user/')) {
        const userId = subPath.replace('user/', '');
        return await updateUser(event, token, userId);
      }
    } else if (method === 'DELETE') {
      if (subPath.startsWith('user/')) {
        const userId = subPath.replace('user/', '');
        return await deleteUser(event, token, userId);
      }
    }

    // Si no coincide con ninguna ruta conocida
    return createResponse(404, { message: 'Ruta no encontrada' }, event);
  } catch (error: unknown) {
    console.error('Error en authHandler:', error);
    return createResponse(500, { message: 'Error interno del servidor', error: (error as Error).message }, event);
  }
};

/**
 * Registra un nuevo usuario
 */
const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' }, event);
    }

    const data = JSON.parse(event.body) as CreateUserDto;

    // Validar datos de entrada usando Zod
    const validation = CreateUserSchema.safeParse(data);
    if (!validation.success) {
      return createResponse(400, {
        message: 'Datos de registro inválidos',
        errors: validation.error.errors
      }, event);
    }

    // Crear usuario
    const user = await authService.createUser(data);

    return createResponse(201, { message: 'Usuario registrado exitosamente', user }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('ya está registrado')) {
      return createResponse(409, { message: (error as Error).message }, event);
    }
    console.error('Error en registro:', error);
    return createResponse(500, { message: 'Error al registrar usuario', error: (error as Error).message }, event);
  }
};

/**
 * Inicia sesión de usuario
 */
const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' }, event);
    }

    const credentials = JSON.parse(event.body) as LoginCredentialsDto;

    // Validar credenciales usando Zod
    const validation = LoginCredentialsSchema.safeParse(credentials);
    if (!validation.success) {
      return createResponse(400, {
        message: 'Credenciales inválidas',
        errors: validation.error.errors
      }, event);
    }

    // Realizar login
    const authResponse = await authService.login(credentials);

    return createResponse(200, authResponse, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Credenciales inválidas') ||
        (error as Error).message?.includes('Cuenta desactivada')) {
      return createResponse(401, { message: (error as Error).message }, event);
    }
    console.error('Error en login:', error);
    return createResponse(500, { message: 'Error al iniciar sesión', error: (error as Error).message }, event);
  }
};

/**
 * Cierra sesión de usuario
 */
const logout = async (event: APIGatewayProxyEvent, token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }

    // Validar token y obtener payload
    const payload = await authService.validateToken(token);

    // Invalidar token
    await authService.logout(payload.id, token);

    return createResponse(200, { message: 'Sesión cerrada exitosamente' }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }
    console.error('Error en logout:', error);
    return createResponse(500, { message: 'Error al cerrar sesión', error: (error as Error).message }, event);
  }
};

/**
 * Obtiene el perfil del usuario autenticado
 */
const getProfile = async (event: APIGatewayProxyEvent, token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }

    // Validar token y obtener payload
    const payload = await authService.validateToken(token);

    // Obtener datos del usuario
    const user = await authService.getUserById(payload.id);

    return createResponse(200, { user }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Token inválido') ||
        (error as Error).message?.includes('no encontrado')) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }
    console.error('Error al obtener perfil:', error);
    return createResponse(500, { message: 'Error al obtener perfil', error: (error as Error).message }, event);
  }
};

/**
 * Obtiene un usuario por su ID (requiere permisos de administrador)
 */
const getUserById = async (event: APIGatewayProxyEvent, token: string | null, userId: string): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }

    // Validar token y obtener payload
    const payload = await authService.validateToken(token);

    // Verificar permisos (solo administradores o el propio usuario)
    if (payload.role !== 'admin' && payload.id !== userId) {
      return createResponse(403, { message: 'Acceso denegado' }, event);
    }

    // Obtener datos del usuario
    const user = await authService.getUserById(userId);

    return createResponse(200, { user }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }
    if ((error as Error).message?.includes('no encontrado')) {
      return createResponse(404, { message: 'Usuario no encontrado' }, event);
    }
    console.error('Error al obtener usuario:', error);
    return createResponse(500, { message: 'Error al obtener usuario', error: (error as Error).message }, event);
  }
};

/**
 * Lista todos los usuarios (solo administradores)
 */
const listUsers = async (event: APIGatewayProxyEvent, token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }

    // Validar token y obtener payload
    const payload = await authService.validateToken(token);

    // Verificar permisos (solo administradores)
    if (payload.role !== 'admin') {
      return createResponse(403, { message: 'Acceso denegado' }, event);
    }

    // En una implementación real, aquí se listarían los usuarios desde DynamoDB
    // Por ahora, responderemos con un mensaje informativo
    return createResponse(200, {
      message: 'Función no implementada completamente',
      info: 'Esta función listará todos los usuarios registrados'
    }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }
    console.error('Error al listar usuarios:', error);
    return createResponse(500, { message: 'Error al listar usuarios', error: (error as Error).message }, event);
  }
};

/**
 * Actualiza el perfil del usuario autenticado
 */
const updateProfile = async (event: APIGatewayProxyEvent, token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }

    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' }, event);
    }

    // Validar token y obtener payload
    const payload = await authService.validateToken(token);

    const data = JSON.parse(event.body) as UpdateUserDto;

    // Validar datos de entrada usando Zod
    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) {
      return createResponse(400, {
        message: 'Datos de actualización inválidos',
        errors: validation.error.errors
      }, event);
    }

    // Actualizar usuario
    const user = await authService.updateUser(payload.id, data);

    return createResponse(200, { message: 'Perfil actualizado exitosamente', user }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }
    console.error('Error al actualizar perfil:', error);
    return createResponse(500, { message: 'Error al actualizar perfil', error: (error as Error).message }, event);
  }
};

/**
 * Actualiza un usuario por su ID (requiere permisos de administrador)
 */
const updateUser = async (event: APIGatewayProxyEvent, token: string | null, userId: string): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }

    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' }, event);
    }

    // Validar token y obtener payload
    const payload = await authService.validateToken(token);

    // Verificar permisos (solo administradores)
    if (payload.role !== 'admin') {
      return createResponse(403, { message: 'Acceso denegado' }, event);
    }

    const data = JSON.parse(event.body) as UpdateUserDto;

    // Validar datos de entrada usando Zod
    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) {
      return createResponse(400, {
        message: 'Datos de actualización inválidos',
        errors: validation.error.errors
      }, event);
    }

    // Actualizar usuario
    const user = await authService.updateUser(userId, data);

    return createResponse(200, { message: 'Usuario actualizado exitosamente', user }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }
    if ((error as Error).message?.includes('no encontrado')) {
      return createResponse(404, { message: 'Usuario no encontrado' }, event);
    }
    console.error('Error al actualizar usuario:', error);
    return createResponse(500, { message: 'Error al actualizar usuario', error: (error as Error).message }, event);
  }
};

/**
 * Elimina un usuario por su ID (requiere permisos de administrador)
 */
const deleteUser = async (event: APIGatewayProxyEvent, token: string | null, userId: string): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }

    // Validar token y obtener payload
    const payload = await authService.validateToken(token);

    // Verificar permisos (solo administradores o el propio usuario)
    if (payload.role !== 'admin' && payload.id !== userId) {
      return createResponse(403, { message: 'Acceso denegado' }, event);
    }

    // Eliminar usuario
    await authService.deleteUser(userId);

    return createResponse(200, { message: 'Usuario eliminado exitosamente' }, event);
  } catch (error: unknown) {
    if ((error as Error).message?.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' }, event);
    }
    if ((error as Error).message?.includes('no encontrado')) {
      return createResponse(404, { message: 'Usuario no encontrado' }, event);
    }
    console.error('Error al eliminar usuario:', error);
    return createResponse(500, { message: 'Error al eliminar usuario', error: (error as Error).message }, event);
  }
};

/**
 * Renueva el token si es necesario
 */
const refreshToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extraer el token del header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return createResponse(401, { message: 'Token de autorización no proporcionado' }, event);
    }

    const token = authHeader.replace('Bearer ', '');

    // Renovar el token si es necesario
    const { token: newToken, renewed, expiresAt } = await authService.renovateTokenIfNeeded(token);

    return createResponse(200, {
      message: renewed ? 'Token renovado exitosamente' : 'Token vigente, no requiere renovación',
      data: {
        token: newToken,
        renewed,
        expiresAt
      }
    }, event);
  } catch (error: unknown) {
    console.error('Error al renovar token:', error);
    return createResponse(401, { message: `Error al renovar token: ${(error as Error).message}` }, event);
  }
};

/**
 * Crea una respuesta HTTP estandarizada
 */
const getAllowedOrigin = (event: APIGatewayProxyEvent) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:4700').split(',').map(o => o.trim());
  const requestOrigin = (event.headers.origin || event.headers.Origin || '') as string;

  // Permitir cualquier dominio de public-tests
  const isPublicTests = /public-tests/.test(requestOrigin);

  if (isPublicTests) {
    return requestOrigin;
  }

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
};

const createResponse = (statusCode: number, body: unknown, event: APIGatewayProxyEvent): APIGatewayProxyResult => {
  const origin = getAllowedOrigin(event) || '';
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
};

/**
 * Crea una respuesta específica para solicitudes CORS preflight
 */
const createCorsResponse = (statusCode: number, body: unknown, event: APIGatewayProxyEvent): APIGatewayProxyResult => {
  const origin = getAllowedOrigin(event) || '';
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Cache-Control,Pragma',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    },
    body: JSON.stringify(body)
  };
};

// Export the handler for the dynamic loader
export const handler = mainHandler;

// Export por defecto para compatibilidad con dispatcher
export default {
  handler: mainHandler,
  mainHandler
};

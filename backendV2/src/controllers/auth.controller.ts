/**
 * Controlador de autenticación
 * Maneja las operaciones de registro, inicio de sesión, cierre de sesión y gestión de usuarios
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authService } from '../services/auth.service';
import { 
  CreateUserDto, 
  LoginCredentialsDto, 
  UpdateUserDto,
  CreateUserSchema,
  LoginCredentialsSchema,
  UpdateUserSchema
} from '../models/user';

/**
 * Maneja las solicitudes de autenticación
 */
export const authHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const subPath = path.split('/auth/')[1] || '';
    
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
        return await logout(token);
      } else if (subPath === 'refreshToken') {
        return await refreshToken(event);
      }
    } else if (method === 'GET') {
      if (subPath === 'me') {
        return await getProfile(token);
      } else if (subPath.startsWith('user/')) {
        const userId = subPath.replace('user/', '');
        return await getUserById(token, userId);
      } else if (subPath === 'users') {
        return await listUsers(token);
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
        return await deleteUser(token, userId);
      }
    }
    
    // Si no coincide con ninguna ruta conocida
    return createResponse(404, { message: 'Ruta no encontrada' });
  } catch (error: any) {
    console.error('Error en authHandler:', error);
    return createResponse(500, { message: 'Error interno del servidor', error: error.message });
  }
};

/**
 * Registra un nuevo usuario
 */
const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' });
    }
    
    const data = JSON.parse(event.body) as CreateUserDto;
    
    // Validar datos de entrada usando Zod
    const validation = CreateUserSchema.safeParse(data);
    if (!validation.success) {
      return createResponse(400, { 
        message: 'Datos de registro inválidos', 
        errors: validation.error.errors 
      });
    }
    
    // Crear usuario
    const user = await authService.createUser(data);
    
    return createResponse(201, { message: 'Usuario registrado exitosamente', user });
  } catch (error: any) {
    if (error.message.includes('ya está registrado')) {
      return createResponse(409, { message: error.message });
    }
    console.error('Error en registro:', error);
    return createResponse(500, { message: 'Error al registrar usuario', error: error.message });
  }
};

/**
 * Inicia sesión de usuario
 */
const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' });
    }
    
    const credentials = JSON.parse(event.body) as LoginCredentialsDto;
    
    // Validar credenciales usando Zod
    const validation = LoginCredentialsSchema.safeParse(credentials);
    if (!validation.success) {
      return createResponse(400, { 
        message: 'Credenciales inválidas', 
        errors: validation.error.errors 
      });
    }
    
    // Realizar login
    const authResponse = await authService.login(credentials);
    
    return createResponse(200, authResponse);
  } catch (error: any) {
    if (error.message.includes('Credenciales inválidas') || 
        error.message.includes('Cuenta desactivada')) {
      return createResponse(401, { message: error.message });
    }
    console.error('Error en login:', error);
    return createResponse(500, { message: 'Error al iniciar sesión', error: error.message });
  }
};

/**
 * Cierra sesión de usuario
 */
const logout = async (token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' });
    }
    
    // Validar token y obtener payload
    const payload = await authService.validateToken(token);
    
    // Invalidar token
    await authService.logout(payload.id, token);
    
    return createResponse(200, { message: 'Sesión cerrada exitosamente' });
  } catch (error: any) {
    if (error.message.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' });
    }
    console.error('Error en logout:', error);
    return createResponse(500, { message: 'Error al cerrar sesión', error: error.message });
  }
};

/**
 * Obtiene el perfil del usuario autenticado
 */
const getProfile = async (token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' });
    }
    
    // Validar token y obtener payload
    const payload = await authService.validateToken(token);
    
    // Obtener datos del usuario
    const user = await authService.getUserById(payload.id);
    
    return createResponse(200, { user });
  } catch (error: any) {
    if (error.message.includes('Token inválido') || 
        error.message.includes('no encontrado')) {
      return createResponse(401, { message: 'No autorizado' });
    }
    console.error('Error al obtener perfil:', error);
    return createResponse(500, { message: 'Error al obtener perfil', error: error.message });
  }
};

/**
 * Obtiene un usuario por su ID (requiere permisos de administrador)
 */
const getUserById = async (token: string | null, userId: string): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' });
    }
    
    // Validar token y obtener payload
    const payload = await authService.validateToken(token);
    
    // Verificar permisos (solo administradores o el propio usuario)
    if (payload.role !== 'admin' && payload.id !== userId) {
      return createResponse(403, { message: 'Acceso denegado' });
    }
    
    // Obtener datos del usuario
    const user = await authService.getUserById(userId);
    
    return createResponse(200, { user });
  } catch (error: any) {
    if (error.message.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' });
    }
    if (error.message.includes('no encontrado')) {
      return createResponse(404, { message: 'Usuario no encontrado' });
    }
    console.error('Error al obtener usuario:', error);
    return createResponse(500, { message: 'Error al obtener usuario', error: error.message });
  }
};

/**
 * Lista todos los usuarios (solo administradores)
 */
const listUsers = async (token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' });
    }
    
    // Validar token y obtener payload
    const payload = await authService.validateToken(token);
    
    // Verificar permisos (solo administradores)
    if (payload.role !== 'admin') {
      return createResponse(403, { message: 'Acceso denegado' });
    }
    
    // En una implementación real, aquí se listarían los usuarios desde DynamoDB
    // Por ahora, responderemos con un mensaje informativo
    return createResponse(200, { 
      message: 'Función no implementada completamente', 
      info: 'Esta función listará todos los usuarios registrados' 
    });
  } catch (error: any) {
    if (error.message.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' });
    }
    console.error('Error al listar usuarios:', error);
    return createResponse(500, { message: 'Error al listar usuarios', error: error.message });
  }
};

/**
 * Actualiza el perfil del usuario autenticado
 */
const updateProfile = async (event: APIGatewayProxyEvent, token: string | null): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' });
    }
    
    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' });
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
      });
    }
    
    // Actualizar usuario
    const user = await authService.updateUser(payload.id, data);
    
    return createResponse(200, { message: 'Perfil actualizado exitosamente', user });
  } catch (error: any) {
    if (error.message.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' });
    }
    console.error('Error al actualizar perfil:', error);
    return createResponse(500, { message: 'Error al actualizar perfil', error: error.message });
  }
};

/**
 * Actualiza un usuario por su ID (requiere permisos de administrador)
 */
const updateUser = async (event: APIGatewayProxyEvent, token: string | null, userId: string): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' });
    }
    
    if (!event.body) {
      return createResponse(400, { message: 'Cuerpo de la solicitud vacío' });
    }
    
    // Validar token y obtener payload
    const payload = await authService.validateToken(token);
    
    // Verificar permisos (solo administradores)
    if (payload.role !== 'admin') {
      return createResponse(403, { message: 'Acceso denegado' });
    }
    
    const data = JSON.parse(event.body) as UpdateUserDto;
    
    // Validar datos de entrada usando Zod
    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) {
      return createResponse(400, { 
        message: 'Datos de actualización inválidos', 
        errors: validation.error.errors 
      });
    }
    
    // Actualizar usuario
    const user = await authService.updateUser(userId, data);
    
    return createResponse(200, { message: 'Usuario actualizado exitosamente', user });
  } catch (error: any) {
    if (error.message.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' });
    }
    if (error.message.includes('no encontrado')) {
      return createResponse(404, { message: 'Usuario no encontrado' });
    }
    console.error('Error al actualizar usuario:', error);
    return createResponse(500, { message: 'Error al actualizar usuario', error: error.message });
  }
};

/**
 * Elimina un usuario por su ID (requiere permisos de administrador)
 */
const deleteUser = async (token: string | null, userId: string): Promise<APIGatewayProxyResult> => {
  try {
    if (!token) {
      return createResponse(401, { message: 'No autorizado' });
    }
    
    // Validar token y obtener payload
    const payload = await authService.validateToken(token);
    
    // Verificar permisos (solo administradores o el propio usuario)
    if (payload.role !== 'admin' && payload.id !== userId) {
      return createResponse(403, { message: 'Acceso denegado' });
    }
    
    // Eliminar usuario
    await authService.deleteUser(userId);
    
    return createResponse(200, { message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    if (error.message.includes('Token inválido')) {
      return createResponse(401, { message: 'No autorizado' });
    }
    if (error.message.includes('no encontrado')) {
      return createResponse(404, { message: 'Usuario no encontrado' });
    }
    console.error('Error al eliminar usuario:', error);
    return createResponse(500, { message: 'Error al eliminar usuario', error: error.message });
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
      return createResponse(401, { message: 'Token de autorización no proporcionado' });
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
    });
  } catch (error: any) {
    console.error('Error al renovar token:', error);
    return createResponse(401, { message: `Error al renovar token: ${error.message}` });
  }
};

/**
 * Crea una respuesta HTTP estandarizada
 */
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
}; 
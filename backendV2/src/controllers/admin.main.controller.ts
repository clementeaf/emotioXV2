import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as adminController from './admin.controller';
import { corsMiddleware, getCorsHeaders } from '../middlewares/cors';

/**
 * Controlador principal para rutas de administración
 * Maneja el enrutamiento interno para /admin/*
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path;
  const method = event.httpMethod;

  console.log(`🛡️ Admin route: ${method} ${path}`);

  // Aplicar middleware CORS
  const corsResponse = await corsMiddleware(event);
  if (corsResponse) {
    return corsResponse;
  }

  // Obtener headers CORS para todas las respuestas
  const headers = getCorsHeaders(event);

  try {
    // Rutas de usuarios
    if (path === '/admin/users' && method === 'GET') {
      console.log('🔍 Entrando a /admin/users GET');
      try {
        return await adminController.getAllUsers(event);
      } catch (error) {
        console.error('❌ Error en getAllUsers:', error);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify({
            success: false,
            error: 'Error en getAllUsers: ' + (error instanceof Error ? error.message : String(error)),
            timestamp: new Date().toISOString()
          })
        };
      }
    }
    
    if (path === '/admin/users' && method === 'POST') {
      return await adminController.createUser(event);
    }
    
    if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'GET') {
      return await adminController.getUserById(event);
    }
    
    if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'PUT') {
      return await adminController.updateUser(event);
    }
    
    if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'DELETE') {
      return await adminController.deleteUser(event);
    }
    
    // Estadísticas
    if (path === '/admin/users/stats' && method === 'GET') {
      return await adminController.getUserStats(event);
    }
    
    // Ruta no encontrada
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        success: false,
        error: `Ruta de admin no encontrada: ${method} ${path}`,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error en admin controller:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      })
    };
  }
};
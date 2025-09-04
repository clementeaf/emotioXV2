import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AdminService } from '../services/admin.service';
import { CreateUserRequest, UpdateUserRequest } from '../interfaces/admin.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';

/**
 * Controlador completo CRUD para administración de usuarios
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('🛡️ Admin Controller - Path:', event.path, 'Method:', event.httpMethod);
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // OPTIONS para CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Verificar autenticación (con bypass para localhost en desarrollo)
    const authResult = AuthMiddleware.developmentBypass(event);
    
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: authResult.error || 'No autorizado'
        })
      };
    }
    
    // Verificar que el usuario sea admin
    if (!AuthMiddleware.requireAdmin(authResult)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Acceso denegado: se requieren permisos de administrador'
        })
      };
    }
    
    console.log(`🔓 Usuario autenticado: ${authResult.user!.email} (${authResult.user!.role})`);
    
    const path = event.path;
    const method = event.httpMethod;
    
    // Extraer ID de usuario de la URL si existe
    const userIdMatch = path.match(/\/admin\/users\/([^/]+)$/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    
    // GET /admin/users - Listar todos los usuarios
    if (path === '/admin/users' && method === 'GET') {
      const result = await AdminService.getAllUsers();
      
      return {
        statusCode: result.success ? 200 : 500,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    // GET /admin/users/{id} - Obtener usuario específico
    if (userId && method === 'GET') {
      const result = await AdminService.getUserById(userId);
      
      if (!result.success) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify(result)
        };
      }
      
      // No devolver la contraseña hasheada
      const { hashedPassword, ...userWithoutPassword } = result.data!;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...result,
          data: userWithoutPassword
        })
      };
    }
    
    // POST /admin/users - Crear nuevo usuario
    if (path === '/admin/users' && method === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Cuerpo de la solicitud requerido'
          })
        };
      }
      
      const userData: CreateUserRequest = JSON.parse(event.body);
      const result = await AdminService.createUser(userData);
      
      return {
        statusCode: result.success ? 201 : 400,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    // PUT /admin/users/{id} - Actualizar usuario
    if (userId && method === 'PUT') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Cuerpo de la solicitud requerido'
          })
        };
      }
      
      const updateData: UpdateUserRequest = JSON.parse(event.body);
      const result = await AdminService.updateUser(userId, updateData);
      
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    // DELETE /admin/users/{id} - Eliminar usuario
    if (userId && method === 'DELETE') {
      const result = await AdminService.deleteUser(userId);
      
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    // GET /admin/stats - Estadísticas de usuarios
    if (path === '/admin/stats' && method === 'GET') {
      const result = await AdminService.getUserStats();
      
      return {
        statusCode: result.success ? 200 : 500,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    // GET /admin - Panel principal (información general)
    if (path === '/admin' && method === 'GET') {
      const [statsResult, hasAdminsResult] = await Promise.all([
        AdminService.getUserStats(),
        AdminService.hasAdminUsers()
      ]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            stats: statsResult.data,
            hasAdmins: hasAdminsResult.data,
            timestamp: new Date().toISOString()
          },
          message: 'Panel de administración cargado correctamente'
        })
      };
    }
    
    // Ruta no encontrada
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Admin route not found: ${method} ${path}`,
        availableRoutes: [
          'GET /admin - Panel principal',
          'GET /admin/users - Listar usuarios',
          'GET /admin/users/{id} - Obtener usuario',
          'POST /admin/users - Crear usuario',
          'PUT /admin/users/{id} - Actualizar usuario',
          'DELETE /admin/users/{id} - Eliminar usuario',
          'GET /admin/stats - Estadísticas'
        ]
      })
    };
    
  } catch (error) {
    console.error('❌ Error en Admin Controller:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  }
};
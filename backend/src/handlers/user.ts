import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserService } from '../services/user.service';
import { authenticate } from '../middlewares/auth.middleware';
import * as z from 'zod';

// Instancia del servicio
const userService = new UserService();

// Esquemas de validación
const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
});

// Función auxiliar para crear respuestas
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': process.env.STAGE === 'prod' 
        ? 'https://app.emotio-x.com' 
        : 'http://localhost:4700',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
};

/**
 * Controlador para obtener información del usuario autenticado
 */
export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verificar autenticación
    const authError = await authenticate(event);
    if (authError) return authError;

    // El middleware de autenticación ya agregó el usuario al evento
    const user = (event as any).user;
    
    // No devolver el campo password
    const { password, ...userWithoutPassword } = user;
    return createResponse(200, userWithoutPassword);
  } catch (error: any) {
    console.error('Error en getUser:', error);
    return createResponse(500, { error: 'Error al obtener usuario' });
  }
};

/**
 * Controlador para actualizar el nombre del usuario
 */
export const updateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verificar autenticación
    const authError = await authenticate(event);
    if (authError) return authError;

    if (!event.body) {
      return createResponse(400, { error: 'Cuerpo de la solicitud vacío' });
    }

    const body = JSON.parse(event.body);
    const result = updateUserSchema.safeParse(body);
    
    if (!result.success) {
      return createResponse(400, { 
        error: 'Datos de entrada inválidos',
        details: result.error.errors 
      });
    }

    // El middleware de autenticación ya agregó el usuario al evento
    const user = (event as any).user;
    const updatedUser = await userService.updateUserName(user.email, body.name);
    
    // No devolver el campo password
    const { password, ...userWithoutPassword } = updatedUser;
    return createResponse(200, userWithoutPassword);
  } catch (error) {
    console.error('Error en updateUser:', error);
    return createResponse(500, { error: 'Error al actualizar usuario' });
  }
};

/**
 * Controlador para eliminar el usuario
 */
export const deleteUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verificar autenticación
    const authError = await authenticate(event);
    if (authError) return authError;

    // El middleware de autenticación ya agregó el usuario al evento
    const user = (event as any).user;
    await userService.deleteUser(user.email);
    
    return createResponse(204, null);
  } catch (error) {
    console.error('Error en deleteUser:', error);
    return createResponse(500, { error: 'Error al eliminar usuario' });
  }
}; 
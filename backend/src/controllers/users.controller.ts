import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { usersService } from '../services/users.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ValidationError, NotFoundError, UnauthorizedError } from '../middlewares/error.middleware';
import { successResponse, noContentResponse } from '../middlewares/response.middleware';
import { errorHandler } from '../middlewares/error.middleware';

/**
 * Controlador para los usuarios
 */
export class UsersController {
  /**
   * Obtiene el usuario actual
   */
  async getUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener usuario
      const user = await usersService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Devolver respuesta exitosa
      return successResponse(user);
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Actualiza el usuario actual
   */
  async updateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Validar que el cuerpo de la solicitud existe
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      // Parsear el cuerpo de la solicitud
      const updateData = JSON.parse(event.body);

      // Validar que hay datos para actualizar
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('No data provided for update');
      }

      // Actualizar usuario
      const updatedUser = await usersService.updateUser(userId, updateData);

      // Devolver respuesta exitosa
      return successResponse(updatedUser, 'User updated successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Elimina el usuario actual
   */
  async deleteUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Eliminar usuario
      await usersService.deleteUser(userId);

      // Devolver respuesta exitosa
      return noContentResponse();
    } catch (error) {
      return errorHandler(error);
    }
  }
}

// Instancia del controlador para las funciones Lambda
const usersController = new UsersController();

// Exportar funciones para serverless
export const getUser = (event: APIGatewayProxyEvent) => usersController.getUser(event);
export const updateUser = (event: APIGatewayProxyEvent) => usersController.updateUser(event);
export const deleteUser = (event: APIGatewayProxyEvent) => usersController.deleteUser(event); 
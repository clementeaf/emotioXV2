import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authService } from '../services/auth.service';
import { ValidationError, UnauthorizedError } from '../middlewares/error.middleware';
import { successResponse, createdResponse } from '../middlewares/response.middleware';
import { errorHandler } from '../middlewares/error.middleware';

/**
 * Controlador para la autenticación
 */
export class AuthController {
  /**
   * Maneja la ruta de login
   */
  async login(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Validar que el cuerpo de la solicitud existe
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      // Parsear el cuerpo de la solicitud
      const { email, password } = JSON.parse(event.body);

      // Validar campos requeridos
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Autenticar usuario
      const result = await authService.login(email, password);

      // Devolver respuesta exitosa
      return successResponse(result, 'Login successful');
    } catch (error: any) {
      // Manejar errores específicos
      if (error.message === 'User not found' || error.message === 'Invalid credentials') {
        return errorHandler(new UnauthorizedError('Invalid email or password'));
      }

      // Manejar otros errores
      return errorHandler(error);
    }
  }

  /**
   * Maneja la ruta de registro
   */
  async register(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Validar que el cuerpo de la solicitud existe
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      // Parsear el cuerpo de la solicitud
      const { name, email, password } = JSON.parse(event.body);

      // Validar campos requeridos
      if (!name || !email || !password) {
        throw new ValidationError('Name, email and password are required');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }

      // Registrar usuario
      const result = await authService.register(name, email, password);

      // Devolver respuesta exitosa
      return createdResponse(result, 'Registration successful');
    } catch (error: any) {
      // Manejar errores específicos
      if (error.message === 'User already exists') {
        return errorHandler(new ValidationError('Email already registered'));
      }

      // Manejar otros errores
      return errorHandler(error);
    }
  }

  /**
   * Maneja la ruta de logout
   */
  async logout(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // En una implementación JWT simple, el logout se maneja en el cliente
      // eliminando el token. Aquí podríamos implementar una lista negra de tokens
      // si fuera necesario.

      return successResponse({}, 'Logout successful');
    } catch (error) {
      return errorHandler(error);
    }
  }
}

// Instancia del controlador para las funciones Lambda
const authController = new AuthController();

// Exportar funciones para serverless
export const login = (event: APIGatewayProxyEvent) => authController.login(event);
export const register = (event: APIGatewayProxyEvent) => authController.register(event);
export const logout = (event: APIGatewayProxyEvent) => authController.logout(event); 
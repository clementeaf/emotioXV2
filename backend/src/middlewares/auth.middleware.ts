import { APIGatewayProxyEvent } from 'aws-lambda';
import { authService } from '../services/auth.service';

/**
 * Middleware para verificar la autenticación en las solicitudes
 * Extrae el token de los headers y verifica su validez
 */
export const authMiddleware = (event: APIGatewayProxyEvent): string => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);
    const decoded = authService.verifyToken(token);
    return decoded.id;
  } catch (error) {
    throw new Error('Unauthorized');
  }
};

/**
 * Middleware para verificar la autenticación en las solicitudes WebSocket
 * Extrae el token de los query parameters y verifica su validez
 */
export const websocketAuthMiddleware = (event: any): string => {
  try {
    const token = event.queryStringParameters?.token;
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = authService.verifyToken(token);
    return decoded.id;
  } catch (error) {
    throw new Error('Unauthorized');
  }
}; 
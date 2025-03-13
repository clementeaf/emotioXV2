import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const userService = new UserService();

interface JWTPayload {
  id: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult | null> => {
  try {
    // Obtener el token del header Authorization
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No se proporcionó token de autenticación' })
      };
    }

    // Verificar el formato del token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Formato de token inválido' })
      };
    }

    const token = parts[1];

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Verificar que el usuario existe
    const user = await userService.getUserByEmail(decoded.email);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }

    // Agregar el usuario al evento para uso posterior
    (event as any).user = user;

    return null;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token expirado' })
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al verificar token' })
    };
  }
}; 
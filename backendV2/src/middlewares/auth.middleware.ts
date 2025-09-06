import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { 
  AuthenticatedUser, 
  AuthResult, 
  DecodedJwtPayload 
} from '../types/auth.types';

/**
 * Middleware de autenticación para verificar tokens JWT
 */
export class AuthMiddleware {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

  /**
   * Verificar token de autorización en el header
   */
  static verifyToken(event: APIGatewayProxyEvent): AuthResult {
    try {
      const authHeader = event.headers?.['Authorization'] || event.headers?.['authorization'];

      if (!authHeader) {
        return {
          success: false,
          error: 'Token de autorización requerido'
        };
      }

      // Verificar formato "Bearer <token>"
      const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
      if (!tokenMatch) {
        return {
          success: false,
          error: 'Formato de token inválido. Use: Bearer <token>'
        };
      }

      const token = tokenMatch[1];

      // Verificar y decodificar el token JWT
      const decoded = jwt.verify(token, this.JWT_SECRET) as DecodedJwtPayload;

      if (!decoded.id || !decoded.email) {
        return {
          success: false,
          error: 'Token JWT inválido: información de usuario faltante'
        };
      }

      return {
        success: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role || 'user'
        }
      };

    } catch (error) {
      console.error('❌ Error verificando token:', error);

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          error: 'Token JWT inválido'
        };
      }

      if (error instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          error: 'Token JWT expirado'
        };
      }

      return {
        success: false,
        error: 'Error verificando autenticación'
      };
    }
  }

  /**
   * Verificar que el usuario tenga rol de administrador
   */
  static requireAdmin(authResult: AuthResult): boolean {
    return authResult.success && authResult.user?.role === 'admin';
  }

  /**
   * Generar token JWT para un usuario (para testing)
   */
  static generateToken(user: AuthenticatedUser, expiresIn: string = '24h'): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn } as jwt.SignOptions
    );
  }

}

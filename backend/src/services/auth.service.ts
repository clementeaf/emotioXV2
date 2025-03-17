import * as jwt from 'jsonwebtoken';
import { userModel, User } from '../models/user.model';

export interface AuthTokenPayload {
  id: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly tokenExpiration: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_key_for_testing_only';
    this.tokenExpiration = '24h'; // Token válido por 24 horas
  }

  /**
   * Genera un token JWT para un usuario
   */
  generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiration });
  }

  /**
   * Verifica un token JWT y devuelve el payload si es válido
   */
  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Extrae el token de los headers de autorización
   */
  extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }

  /**
   * Autentica a un usuario con email y contraseña
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Buscar usuario por email
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Verificar contraseña
    if (!user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await userModel.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generar token
    const token = this.generateToken(user);

    // Devolver respuesta
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }

  /**
   * Registra un nuevo usuario
   */
  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    // Crear usuario
    const user = await userModel.create(name, email, password);

    // Generar token
    const token = this.generateToken(user);

    // Devolver respuesta
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }

  /**
   * Obtiene el ID de usuario a partir de un token
   */
  getUserIdFromToken(token: string): string {
    const decoded = this.verifyToken(token);
    return decoded.id;
  }
}

// Singleton para reutilizar en toda la aplicación
export const authService = new AuthService(); 
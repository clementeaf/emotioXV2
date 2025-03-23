import * as jwt from 'jsonwebtoken';
import { userRepository } from '../models/user.model';
import { AuthResponse, CreateUserDto, IUser, JwtPayload, LoginCredentialsDto } from '../types/user';
import { IAuthService } from '../types/service';

/**
 * Implementación del servicio de autenticación
 */
export class AuthService implements IAuthService {
  private readonly jwtSecret: string;
  private readonly tokenExpiration: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_key_for_testing_only';
    this.tokenExpiration = '24h'; // Token válido por 24 horas
  }

  /**
   * Genera un token JWT para un usuario
   */
  generateToken(user: IUser): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiration });
  }

  /**
   * Verifica un token JWT y devuelve el payload si es válido
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
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
  async login(credentials: LoginCredentialsDto): Promise<AuthResponse> {
    // Buscar usuario por email
    const user = await userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Verificar contraseña
    if (!user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await userRepository.comparePassword(credentials.password, user.password);
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
  async register(userData: CreateUserDto): Promise<AuthResponse> {
    // Crear usuario
    const user = await userRepository.create(userData);

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
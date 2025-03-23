import { AuthResponse, CreateUserDto, IUser, LoginCredentialsDto, UpdateUserDto } from './user';
import { PaginatedResult, PaginationOptions } from './common';

/**
 * Interfaz para el servicio de autenticación
 */
export interface IAuthService {
  login(credentials: LoginCredentialsDto): Promise<AuthResponse>;
  register(userData: CreateUserDto): Promise<AuthResponse>;
  generateToken(user: IUser): string;
  verifyToken(token: string): any;
  getUserIdFromToken(token: string): string;
  extractTokenFromHeader(authHeader: string | undefined): string;
}

/**
 * Interfaz para el servicio de usuarios
 */
export interface IUserService {
  getUser(id: string): Promise<IUser>;
  getAllUsers(options?: PaginationOptions): Promise<PaginatedResult<IUser>>;
  updateUser(id: string, userData: UpdateUserDto): Promise<IUser>;
  deleteUser(id: string): Promise<void>;
}

/**
 * Interfaz para el servicio de WebSocket
 */
export interface IWebSocketService {
  connect(connectionId: string, userId?: string): Promise<void>;
  disconnect(connectionId: string): Promise<void>;
  sendMessageToUser(userId: string, message: any): Promise<void>;
  broadcastMessage(message: any): Promise<void>;
} 
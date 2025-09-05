/**
 * Tipos específicos para autenticación y administración
 * Elimina todos los usos de 'any' y 'unknown' en los sistemas de login/admin
 */

/**
 * Usuario autenticado (información básica para JWT)
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
}

/**
 * Resultado de validación de autenticación
 */
export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Payload específico del token JWT decodificado
 */
export interface DecodedJwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
  iat?: number;
  exp?: number;
  sub?: string;
}

/**
 * Estructura de datos de usuario en DynamoDB
 */
export interface DynamoDBUserItem {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
  status: 'active' | 'inactive';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string | number;
  updatedAt: string | number;
  lastLogin?: number;
  loginCount: number;
  preferences?: UserPreferences;
  tokens?: TokenInfo[];
}

/**
 * Información de tokens activos
 */
export interface TokenInfo {
  token: string;
  expiresAt: number;
  device?: string;
  ip?: string;
}

/**
 * Preferencias de usuario
 */
export interface UserPreferences {
  language: string;
  notifications: boolean;
  theme: string;
}

/**
 * Respuesta de autenticación (login)
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
  refreshToken: string;
}

/**
 * Datos para actualización de usuario (tipos específicos)
 */
export interface UserUpdateData {
  email?: string;
  name?: string;
  password?: string;
  role?: 'admin' | 'researcher' | 'user' | 'participant';
  isActive?: boolean;
  isVerified?: boolean;
  preferences?: UserPreferences;
}

/**
 * Valores de atributos de expresión para DynamoDB (específicos)
 */
export interface DynamoDBUpdateAttributes {
  ':updatedAt': number;
  ':email'?: string;
  ':name'?: string;
  ':password'?: string;
  ':passwordHash'?: string;
  ':role'?: 'admin' | 'researcher' | 'user' | 'participant';
  ':isActive'?: boolean;
  ':isVerified'?: boolean;
  ':preferences'?: UserPreferences;
  ':status'?: 'active' | 'inactive';
}

/**
 * Respuesta genérica del servicio de administración
 */
export interface AdminServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Usuario para administración (sin contraseña)
 */
export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  loginCount: number;
}

/**
 * Usuario con contraseña para operaciones internas
 */
export interface AdminUserWithPassword extends AdminUser {
  hashedPassword: string;
}

/**
 * Parámetros para crear usuario
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  role?: 'admin' | 'researcher' | 'user' | 'participant';
}

/**
 * Parámetros para actualizar usuario
 */
export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'researcher' | 'user' | 'participant';
  status?: 'active' | 'inactive';
}

/**
 * Estadísticas de usuarios
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  users: number;
}

/**
 * Respuesta HTTP estándar para admin
 */
export interface AdminResponse {
  statusCode: number;
  body: string;
  headers: {
    [key: string]: string | boolean;
  };
}

/**
 * Token decodificado manualmente
 */
export interface ManuallyDecodedToken {
  id: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  sub?: string;
}

/**
 * Resultado de renovación de token
 */
export interface TokenRenewalResult {
  token: string;
  renewed: boolean;
  expiresAt: number;
  user: AuthenticatedUser;
}
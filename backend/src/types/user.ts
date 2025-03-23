import { BaseModel } from './common';

/**
 * Interfaz para el modelo de usuario
 */
export interface IUser extends BaseModel {
  name: string;
  email: string;
  password?: string;
}

/**
 * DTO para crear un usuario
 */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

/**
 * DTO para actualizar un usuario
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Interfaz para las credenciales de inicio de sesión
 */
export interface LoginCredentialsDto {
  email: string;
  password: string;
}

/**
 * Interfaz para la respuesta de autenticación
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Interfaz para el payload del token JWT
 */
export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
} 
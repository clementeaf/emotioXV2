/**
 * Tipos comunes utilizados en toda la aplicación
 */

/**
 * Interfaz base para todos los modelos
 */
export interface BaseModel {
  id: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Tipo para opciones de paginación
 */
export interface PaginationOptions {
  limit?: number;
  nextToken?: string;
}

/**
 * Tipo para resultados paginados
 */
export interface PaginatedResult<T> {
  items: T[];
  nextToken?: string;
  count: number;
}

/**
 * Código de error para APIs
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT'
}

/**
 * Tipos de servicio disponibles
 */
export enum ServiceType {
  AUTH = 'auth',
  USER = 'user',
  RESEARCH = 'research',
  FORM = 'form',
  WEBSOCKET = 'websocket'
} 
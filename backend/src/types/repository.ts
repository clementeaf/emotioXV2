import { BaseModel, PaginatedResult, PaginationOptions } from './common';

/**
 * Interfaz genérica para todos los repositorios
 */
export interface IRepository<T extends BaseModel> {
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<T>>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Interfaz para el repositorio de usuarios con métodos específicos
 */
export interface IUserRepository<T extends BaseModel> extends IRepository<T> {
  findByEmail(email: string): Promise<T | null>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

/**
 * Interfaz para el repositorio de conexiones de WebSocket
 */
export interface IConnectionRepository<T extends BaseModel> extends IRepository<T> {
  saveConnection(connectionId: string, userId?: string): Promise<T>;
  removeConnection(connectionId: string): Promise<void>;
  findByUserId(userId: string): Promise<T[]>;
} 
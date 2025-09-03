/**
 * Interfaces para administración de usuarios
 */

export interface AdminUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserWithPassword extends AdminUser {
  hashedPassword: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'inactive';
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  users: number;
}

export interface AdminServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
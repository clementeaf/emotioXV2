/**
 * Auth Domain API
 */

import { apiClient } from '@/api/config/axios';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ProfileResponse } from './auth.types';

export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  },

  /**
   * Get user profile
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
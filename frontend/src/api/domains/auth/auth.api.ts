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
    // Extract rememberMe since it's only for frontend use
    const { rememberMe, ...loginData } = credentials;
    const response = await apiClient.post<LoginResponse>('/auth/login', loginData);
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

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/refreshToken');
    return response.data;
  },
};
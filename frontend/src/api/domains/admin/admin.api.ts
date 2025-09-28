/**
 * Admin Domain API
 * Placeholder implementation for admin functionality
 */

import { apiClient } from '@/api/config/axios';

export const adminApi = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<any> => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  /**
   * Create user
   */
  createUser: async (data: any): Promise<any> => {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },

  /**
   * Update user
   */
  updateUser: async (id: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   */
  deleteUser: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },
};
/**
 * Welcome Screen Domain API Methods
 * All API calls for welcome screen functionality using Axios
 */

import { apiClient } from '@/api/config/axios';
import type {
  ApiResponse,
  WelcomeScreenRecord,
  CreateWelcomeScreenRequest,
  UpdateWelcomeScreenRequest,
  ValidationResponse
} from './welcome-screen.types';

/**
 * Welcome Screen API Methods
 */
export const welcomeScreenApi = {
  /**
   * Get welcome screen by research ID
   */
  getByResearchId: async (researchId: string): Promise<WelcomeScreenRecord | null> => {
    try {
      const response = await apiClient.get<ApiResponse<WelcomeScreenRecord>>(`/research/${researchId}/welcome-screen`);
      return response.data.data || response.data || null;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create welcome screen
   */
  create: async (data: CreateWelcomeScreenRequest): Promise<WelcomeScreenRecord> => {
    const response = await apiClient.post<ApiResponse<WelcomeScreenRecord>>(
      `/research/${data.researchId}/welcome-screen`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update welcome screen (backend uses POST for upsert)
   */
  update: async (researchId: string, data: UpdateWelcomeScreenRequest): Promise<WelcomeScreenRecord> => {
    const response = await apiClient.post<ApiResponse<WelcomeScreenRecord>>(
      `/research/${researchId}/welcome-screen`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete welcome screen
   */
  delete: async (researchId: string): Promise<void> => {
    await apiClient.delete(`/research/${researchId}/welcome-screen`);
  },

  /**
   * Validate welcome screen configuration
   */
  validate: async (researchId: string): Promise<ValidationResponse> => {
    const response = await apiClient.get<ApiResponse<ValidationResponse>>(
      `/research/${researchId}/welcome-screen/validate`
    );
    return response.data.data || response.data;
  }
};
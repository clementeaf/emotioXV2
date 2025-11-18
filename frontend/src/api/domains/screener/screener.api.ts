/**
 * Screener Domain API
 * API methods for screener functionality
 */

import { apiClient } from '@/api/config/axios';
import type {
  ScreenerModel,
  CreateScreenerRequest,
  UpdateScreenerRequest,
  ValidationResponse,
  ApiResponse
} from './screener.types';

/**
 * Screener API methods
 */
export const screenerApi = {
  /**
   * Get screener by research ID
   */
  getByResearchId: async (researchId: string): Promise<ScreenerModel | null> => {
    try {
      const response = await apiClient.get<ApiResponse<ScreenerModel>>(
        `/research/${researchId}/screener`
      );
      return response.data.data || response.data || null;
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create screener
   */
  create: async (data: CreateScreenerRequest): Promise<ScreenerModel> => {
    const response = await apiClient.post<ApiResponse<ScreenerModel>>(
      `/research/${data.researchId}/screener`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update screener
   */
  update: async (researchId: string, data: UpdateScreenerRequest): Promise<ScreenerModel> => {
    const response = await apiClient.put<ApiResponse<ScreenerModel>>(
      `/research/${researchId}/screener`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete screener
   */
  delete: async (researchId: string): Promise<void> => {
    await apiClient.delete(`/research/${researchId}/screener`);
  },

  /**
   * Validate screener configuration
   */
  validate: async (researchId: string): Promise<ValidationResponse> => {
    const response = await apiClient.get<ValidationResponse>(
      `/research/${researchId}/screener/validate`
    );
    return response.data;
  }
};


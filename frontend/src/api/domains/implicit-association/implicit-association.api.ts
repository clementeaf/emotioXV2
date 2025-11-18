/**
 * Implicit Association Domain API
 * API methods for implicit association functionality
 */

import { apiClient } from '@/api/config/axios';
import type {
  ImplicitAssociationModel,
  CreateImplicitAssociationRequest,
  UpdateImplicitAssociationRequest,
  ValidationResponse,
  ApiResponse
} from './implicit-association.types';

/**
 * Implicit Association API methods
 */
export const implicitAssociationApi = {
  /**
   * Get implicit association by research ID
   */
  getByResearchId: async (researchId: string): Promise<ImplicitAssociationModel | null> => {
    try {
      const response = await apiClient.get<ApiResponse<ImplicitAssociationModel>>(
        `/research/${researchId}/implicit-association`
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
   * Create implicit association
   */
  create: async (data: CreateImplicitAssociationRequest): Promise<ImplicitAssociationModel> => {
    const response = await apiClient.post<ApiResponse<ImplicitAssociationModel>>(
      `/research/${data.researchId}/implicit-association`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update implicit association
   */
  update: async (
    researchId: string,
    data: UpdateImplicitAssociationRequest
  ): Promise<ImplicitAssociationModel> => {
    const response = await apiClient.put<ApiResponse<ImplicitAssociationModel>>(
      `/research/${researchId}/implicit-association`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete implicit association
   */
  delete: async (researchId: string): Promise<void> => {
    await apiClient.delete(`/research/${researchId}/implicit-association`);
  },

  /**
   * Validate implicit association configuration
   */
  validate: async (researchId: string): Promise<ValidationResponse> => {
    const response = await apiClient.get<ValidationResponse>(
      `/research/${researchId}/implicit-association/validate`
    );
    return response.data;
  }
};


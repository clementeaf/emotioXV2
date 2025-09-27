/**
 * Research Domain API
 */

import { apiClient } from '@/api/config/axios';
import type {
  Research,
  CreateResearchRequest,
  UpdateResearchRequest,
  ResearchAPIResponse,
  ResearchListParams
} from './research.types';

export const researchApi = {
  /**
   * Get all research
   */
  getAll: async (params?: ResearchListParams): Promise<ResearchAPIResponse[]> => {
    const response = await apiClient.get<{ data: ResearchAPIResponse[] }>('/research', { params });
    return response.data.data || [];
  },

  /**
   * Get research by ID
   */
  getById: async (id: string): Promise<ResearchAPIResponse> => {
    const response = await apiClient.get<{ data: ResearchAPIResponse }>(`/research/${id}`);
    return response.data.data;
  },

  /**
   * Create new research
   */
  create: async (data: CreateResearchRequest): Promise<Research> => {
    const response = await apiClient.post<{ data: Research }>('/research', data);
    return response.data.data;
  },

  /**
   * Update research
   */
  update: async (id: string, data: UpdateResearchRequest): Promise<Research> => {
    const response = await apiClient.put<{ data: Research }>(`/research/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete research
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/research/${id}`);
  },

  /**
   * Get user research
   */
  getUserResearch: async (): Promise<ResearchAPIResponse[]> => {
    const response = await apiClient.get<{ data: ResearchAPIResponse[] }>('/research/user');
    return response.data.data || [];
  },

  /**
   * Update research status
   */
  updateStatus: async (id: string, status: string): Promise<Research> => {
    const response = await apiClient.patch<{ data: Research }>(`/research/${id}/status`, { status });
    return response.data.data;
  },
};
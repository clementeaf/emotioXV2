/**
 * Research Service - Axios Implementation
 * Métodos HTTP para gestionar research con Axios
 */

import { apiClient } from '@/api/config/axios';
import type {
  Research,
  ResearchListResponse,
  CreateResearchRequest,
  UpdateResearchRequest,
  ResearchAPIResponse
} from '../types/research';

export const researchService = {
  /**
   * Obtener todas las investigaciones
   */
  async getAll(): Promise<ResearchAPIResponse[]> {
    const response = await apiClient.get<{ data: ResearchAPIResponse[] }>('/research');
    return response.data.data || [];
  },

  /**
   * Obtener una investigación por ID
   */
  async getById(id: string): Promise<ResearchAPIResponse | null> {
    try {
      const response = await apiClient.get<{ data: ResearchAPIResponse }>(`/research/${id}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching research by ID:', error);
      return null;
    }
  },

  /**
   * Crear una nueva investigación
   */
  async create(data: CreateResearchRequest): Promise<Research> {
    const response = await apiClient.post<{ data: Research }>('/research', data);
    return response.data.data;
  },

  /**
   * Actualizar una investigación existente
   */
  async update(id: string, data: UpdateResearchRequest): Promise<Research> {
    const response = await apiClient.put<{ data: Research }>(`/research/${id}`, data);
    return response.data.data;
  },

  /**
   * Eliminar una investigación
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/research/${id}`);
  }
};

export default researchService;
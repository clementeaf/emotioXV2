import { apiClient } from '../config/api-client';
import { EyeTrackingFormData } from '../types';

/**
 * Interfaz que extiende los datos del formulario con campos adicionales del servidor
 */
export interface EyeTrackingRecord extends EyeTrackingFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio para manejar operaciones relacionadas con el seguimiento ocular
 */
export const eyeTrackingService = {
  /**
   * Obtiene la configuración de seguimiento ocular por su ID
   * @param id ID de la configuración
   * @returns Configuración solicitada
   */
  async getById(id: string): Promise<EyeTrackingRecord> {
    try {
      return await apiClient.get<EyeTrackingRecord, 'eyeTracking'>('eyeTracking', 'get', { id });
    } catch (error) {
      console.error(`Error al obtener configuración de seguimiento ocular ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la configuración de seguimiento ocular para una investigación específica
   * @param researchId ID de la investigación
   * @returns Configuración solicitada
   */
  async getByResearchId(researchId: string): Promise<EyeTrackingRecord> {
    try {
      return await apiClient.get<EyeTrackingRecord, 'eyeTracking'>('eyeTracking', 'getByResearch', { researchId });
    } catch (error) {
      console.error(`Error al obtener configuración de seguimiento ocular para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva configuración de seguimiento ocular
   * @param data Datos de la nueva configuración
   * @param researchId ID de la investigación (opcional)
   * @returns Configuración creada
   */
  async create(data: EyeTrackingFormData, researchId?: string): Promise<EyeTrackingRecord> {
    try {
      // Si se proporciona un ID de investigación, se usa para vincular la configuración
      const payload = researchId ? { ...data, researchId } : data;
      return await apiClient.post<EyeTrackingRecord, typeof payload, 'eyeTracking'>('eyeTracking', 'create', payload);
    } catch (error) {
      console.error('Error al crear configuración de seguimiento ocular:', error);
      throw error;
    }
  },

  /**
   * Actualiza una configuración de seguimiento ocular existente
   * @param id ID de la configuración
   * @param data Datos a actualizar
   * @returns Configuración actualizada
   */
  async update(id: string, data: Partial<EyeTrackingFormData>): Promise<EyeTrackingRecord> {
    try {
      return await apiClient.put<EyeTrackingRecord, Partial<EyeTrackingFormData>, 'eyeTracking'>('eyeTracking', 'update', data, { id });
    } catch (error) {
      console.error(`Error al actualizar configuración de seguimiento ocular ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza o crea una configuración de seguimiento ocular para una investigación específica
   * @param researchId ID de la investigación
   * @param data Datos completos de la configuración
   * @returns Configuración actualizada o creada
   */
  async updateByResearchId(researchId: string, data: EyeTrackingFormData): Promise<EyeTrackingRecord> {
    try {
      return await apiClient.put<EyeTrackingRecord, EyeTrackingFormData, 'eyeTracking'>('eyeTracking', 'updateByResearch', data, { researchId });
    } catch (error) {
      console.error(`Error al actualizar configuración de seguimiento ocular para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una configuración de seguimiento ocular
   * @param id ID de la configuración
   * @returns Confirmación de eliminación
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete<void, 'eyeTracking'>('eyeTracking', 'delete', { id });
    } catch (error) {
      console.error(`Error al eliminar configuración de seguimiento ocular ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la configuración de seguimiento ocular para participantes
   * @param researchId ID de la investigación
   * @returns Configuración para participantes
   */
  async getForParticipant(researchId: string): Promise<EyeTrackingRecord> {
    try {
      return await apiClient.get<EyeTrackingRecord, 'eyeTracking'>('eyeTracking', 'getParticipant', { researchId });
    } catch (error) {
      console.error(`Error al obtener configuración de seguimiento ocular para participantes de investigación ${researchId}:`, error);
      throw error;
    }
  }
};

export default eyeTrackingService; 
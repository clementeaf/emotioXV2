import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';
import type { EyeTrackingFormData } from 'shared/interfaces/eye-tracking.interface';

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
    const response = await eyeTrackingFixedAPI.getById(id).send();
    return response;
  },

  /**
   * Obtiene la configuración de seguimiento ocular para una investigación específica
   * @param researchId ID de la investigación
   * @returns Configuración solicitada
   */
  async getByResearchId(researchId: string): Promise<EyeTrackingFormData | null> {
    try {
      const response = await eyeTrackingFixedAPI.getByResearchId(researchId).send();
      return response;
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error && (error as any).statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Crea una nueva configuración de seguimiento ocular
   * @param researchId ID de la investigación
   * @param data Datos de la nueva configuración
   * @returns Configuración creada
   */
  async create(researchId: string, data: EyeTrackingFormData): Promise<EyeTrackingFormData> {
    const response = await eyeTrackingFixedAPI.create({ ...data, researchId }).send();
    return response;
  },

  /**
   * Actualiza una configuración de seguimiento ocular existente
   * @param researchId ID de la investigación
   * @param data Datos a actualizar
   * @returns Configuración actualizada
   */
  async update(researchId: string, data: Partial<EyeTrackingFormData>): Promise<EyeTrackingFormData> {
    const response = await eyeTrackingFixedAPI.update(researchId, data).send();
    return response;
  },

  /**
   * Actualiza o crea una configuración de seguimiento ocular para una investigación específica
   * @param researchId ID de la investigación
   * @param data Datos completos de la configuración
   * @returns Configuración actualizada o creada
   */
  async updateByResearchId(researchId: string, data: EyeTrackingFormData): Promise<EyeTrackingRecord> {
    const response = await eyeTrackingFixedAPI.update(researchId, data).send();
    return response;
  },

  /**
   * Elimina una configuración de seguimiento ocular
   * @param researchId ID de la investigación
   * @returns Confirmación de eliminación
   */
  async deleteByResearchId(researchId: string): Promise<void> {
    await eyeTrackingFixedAPI.delete(researchId).send();
  },

  /**
   * Obtiene la configuración de seguimiento ocular para participantes
   * @param researchId ID de la investigación
   * @returns Configuración para participantes
   */
  async getForParticipant(researchId: string): Promise<EyeTrackingRecord> {
    const response = await eyeTrackingFixedAPI.getByResearchId(researchId).send();
    return response;
  }
};

export default eyeTrackingService;

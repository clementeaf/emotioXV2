import { thankYouScreenHttpService } from '@/api/thankYouScreenHttpService';
import {
  ThankYouScreenFormData,
  ThankYouScreenModel
} from '../../../shared/interfaces/thank-you-screen.interface';

/**
 * Servicio para manejar operaciones relacionadas con pantallas de agradecimiento
 */
export const thankYouScreenService = {
  /**
   * Obtiene la pantalla de agradecimiento asociada a una investigación
   * @param researchId ID de la investigación
   * @returns Pantalla de agradecimiento
   */
  async getByResearchId(researchId: string): Promise<ThankYouScreenModel> {
    return await thankYouScreenHttpService.getByResearchId(researchId);
  },

  /**
   * Crea una nueva pantalla de agradecimiento
   * @param data Datos de la pantalla
   * @returns Pantalla creada
   */
  async create(data: ThankYouScreenFormData): Promise<ThankYouScreenModel> {
    return await thankYouScreenHttpService.create(data.researchId!, data);
  },

  /**
   * Actualiza una pantalla de agradecimiento existente
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @returns Pantalla actualizada
   */
  async update(id: string, data: Partial<ThankYouScreenFormData>): Promise<ThankYouScreenModel> {
    // Usamos el researchId que viene en data o lo obtenemos por ID
    const researchId = data.researchId || id; // Simplificación temporal
    return await thankYouScreenHttpService.update(researchId, data);
  },

  /**
   * Elimina una pantalla de agradecimiento
   * @param id ID de la pantalla
   * @param researchId ID de la investigación
   */
  async delete(id: string, researchId: string): Promise<void> {
    return await thankYouScreenHttpService.delete(researchId);
  },

  /**
   * Crea o actualiza la pantalla de agradecimiento para una investigación
   * @param researchId ID de la investigación
   * @param data Datos de la pantalla
   * @returns Pantalla creada o actualizada
   */
  async createOrUpdateForResearch(researchId: string, data: Omit<ThankYouScreenFormData, 'researchId'>): Promise<ThankYouScreenModel> {
    try {
      // El backend maneja upsert automáticamente
      return await thankYouScreenHttpService.create(researchId, {
        ...data,
        researchId
      } as ThankYouScreenFormData);
    } catch (error) {
      console.error(`Error al crear/actualizar pantalla de agradecimiento para investigación ${researchId}:`, error);
      throw error;
    }
  }
};

export default thankYouScreenService;

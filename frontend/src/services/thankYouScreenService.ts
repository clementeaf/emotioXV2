import { thankYouScreenAPI } from '@/lib/api';
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
  async getByResearchId(researchId: string): Promise<ThankYouScreenModel | null> {
    const response = await thankYouScreenAPI.getByResearch(researchId);
    return response as ThankYouScreenModel | null;
  },

  /**
   * Crea una nueva pantalla de agradecimiento
   * @param data Datos de la pantalla
   * @returns Pantalla creada
   */
  async create(data: ThankYouScreenFormData): Promise<ThankYouScreenModel> {
    const response = await thankYouScreenAPI.save(data.researchId!, data);
    return response as ThankYouScreenModel;
  },

  /**
   * Actualiza una pantalla de agradecimiento existente
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @returns Pantalla actualizada
   */
  async update(id: string, data: Partial<ThankYouScreenFormData>): Promise<ThankYouScreenModel> {
    const researchId = data.researchId || id;
    const response = await thankYouScreenAPI.save(researchId, data);
    return response as ThankYouScreenModel;
  },

  /**
   * Elimina una pantalla de agradecimiento
   * @param id ID de la pantalla
   * @param researchId ID de la investigación
   */
  async delete(id: string, researchId: string): Promise<void> {
    await thankYouScreenAPI.delete(researchId);
  },

  /**
   * Crea o actualiza la pantalla de agradecimiento para una investigación
   * @param researchId ID de la investigación
   * @param data Datos de la pantalla
   * @returns Pantalla creada o actualizada
   */
  async createOrUpdateForResearch(
    researchId: string,
    data: Omit<ThankYouScreenFormData, 'researchId'>
  ): Promise<ThankYouScreenModel> {
    try {
      const response = await thankYouScreenAPI.save(researchId, {
        ...data,
        researchId
      } as ThankYouScreenFormData);
      return response as ThankYouScreenModel;
    } catch (error) {
        `Error al crear/actualizar pantalla de agradecimiento para investigación ${researchId}:`,
        error
      );
      throw error;
    }
  }
};

export default thankYouScreenService;

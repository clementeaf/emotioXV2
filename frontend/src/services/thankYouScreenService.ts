import { thankYouScreenApi } from '@/api/domains/thank-you-screen';
import type {
  ThankYouScreenFormData,
  ThankYouScreenModel
} from '@/api/domains/thank-you-screen';

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
    return thankYouScreenApi.getByResearchId(researchId);
  },

  /**
   * Crea una nueva pantalla de agradecimiento
   * @param data Datos de la pantalla
   * @returns Pantalla creada
   */
  async create(data: ThankYouScreenFormData): Promise<ThankYouScreenModel> {
    if (!data.researchId) throw new Error('Research ID is required');
    return thankYouScreenApi.create({
      ...data,
      researchId: data.researchId
    });
  },

  /**
   * Actualiza una pantalla de agradecimiento existente
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @returns Pantalla actualizada
   */
  async update(id: string, data: Partial<ThankYouScreenFormData>): Promise<ThankYouScreenModel> {
    const researchId = data.researchId || id;
    return thankYouScreenApi.update(researchId, data);
  },

  /**
   * Elimina una pantalla de agradecimiento
   * @param id ID de la pantalla
   * @param researchId ID de la investigación
   */
  async delete(id: string, researchId: string): Promise<void> {
    await thankYouScreenApi.delete(researchId);
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
      return thankYouScreenApi.create({
        ...data,
        researchId
      });
    } catch (error) {
      throw error;
    }
  }
};

export default thankYouScreenService;

import { apiClient } from '../config/api-client';

/**
 * Interfaz para los datos de la pantalla de agradecimiento
 */
export interface ThankYouScreenData {
  title: string;
  subtitle?: string;
  message?: string;
  buttonText?: string;
  redirectUrl?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  showSocialShare?: boolean;
  researchId: string;
}

/**
 * Interfaz para la respuesta del servidor con la pantalla de agradecimiento
 */
export interface ThankYouScreenRecord extends ThankYouScreenData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio para manejar operaciones relacionadas con pantallas de agradecimiento
 */
export const thankYouScreenService = {
  /**
   * Obtiene una pantalla de agradecimiento por su ID
   * @param id ID de la pantalla
   * @returns Pantalla de agradecimiento
   */
  async getById(id: string): Promise<ThankYouScreenRecord> {
    try {
      return await apiClient.get<ThankYouScreenRecord, 'thankYouScreen'>('thankYouScreen', 'GET', { id });
    } catch (error) {
      console.error(`Error al obtener pantalla de agradecimiento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la pantalla de agradecimiento asociada a una investigación
   * @param researchId ID de la investigación
   * @returns Pantalla de agradecimiento
   */
  async getByResearchId(researchId: string): Promise<ThankYouScreenRecord> {
    try {
      return await apiClient.get<ThankYouScreenRecord, 'thankYouScreen'>('thankYouScreen', 'GET_BY_RESEARCH', { researchId });
    } catch (error) {
      console.error(`Error al obtener pantalla de agradecimiento para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva pantalla de agradecimiento
   * @param data Datos de la pantalla
   * @returns Pantalla creada
   */
  async create(data: ThankYouScreenData): Promise<ThankYouScreenRecord> {
    try {
      return await apiClient.post<ThankYouScreenRecord, ThankYouScreenData, 'thankYouScreen'>('thankYouScreen', 'CREATE', data);
    } catch (error) {
      console.error('Error al crear pantalla de agradecimiento:', error);
      throw error;
    }
  },

  /**
   * Actualiza una pantalla de agradecimiento existente
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @returns Pantalla actualizada
   */
  async update(id: string, data: Partial<ThankYouScreenData>): Promise<ThankYouScreenRecord> {
    try {
      return await apiClient.put<ThankYouScreenRecord, Partial<ThankYouScreenData>, 'thankYouScreen'>('thankYouScreen', 'UPDATE', data, { id });
    } catch (error) {
      console.error(`Error al actualizar pantalla de agradecimiento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una pantalla de agradecimiento
   * @param id ID de la pantalla
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete<void, 'thankYouScreen'>('thankYouScreen', 'DELETE', { id });
    } catch (error) {
      console.error(`Error al eliminar pantalla de agradecimiento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea o actualiza la pantalla de agradecimiento para una investigación
   * @param researchId ID de la investigación
   * @param data Datos de la pantalla
   * @returns Pantalla creada o actualizada
   */
  async createOrUpdateForResearch(researchId: string, data: Omit<ThankYouScreenData, 'researchId'>): Promise<ThankYouScreenRecord> {
    try {
      // Primero intentamos obtener la pantalla existente
      try {
        const existingScreen = await this.getByResearchId(researchId);
        // Si existe, la actualizamos
        return await this.update(existingScreen.id, data);
      } catch {
        // Si no existe, creamos una nueva
        return await this.create({
          ...data,
          researchId
        });
      }
    } catch (error) {
      console.error(`Error al crear/actualizar pantalla de agradecimiento para investigación ${researchId}:`, error);
      throw error;
    }
  }
};

export default thankYouScreenService; 
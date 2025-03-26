import { apiClient } from '../config/api-client';

/**
 * Interfaz para los datos de la pantalla de bienvenida
 */
export interface WelcomeScreenData {
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  researchId: string;
}

/**
 * Interfaz para la respuesta del servidor con la pantalla de bienvenida
 */
export interface WelcomeScreenRecord extends WelcomeScreenData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio para manejar operaciones relacionadas con pantallas de bienvenida
 */
export const welcomeScreenService = {
  /**
   * Obtiene una pantalla de bienvenida por su ID
   * @param id ID de la pantalla
   * @returns Pantalla de bienvenida
   */
  async getById(id: string): Promise<WelcomeScreenRecord> {
    try {
      return await apiClient.get<WelcomeScreenRecord, 'welcomeScreen'>('welcomeScreen', 'get', { id });
    } catch (error) {
      console.error(`Error al obtener pantalla de bienvenida ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación
   * @param researchId ID de la investigación
   * @returns Pantalla de bienvenida
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord> {
    try {
      return await apiClient.get<WelcomeScreenRecord, 'welcomeScreen'>('welcomeScreen', 'getByResearch', { researchId });
    } catch (error) {
      console.error(`Error al obtener pantalla de bienvenida para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva pantalla de bienvenida
   * @param data Datos de la pantalla
   * @returns Pantalla creada
   */
  async create(data: WelcomeScreenData): Promise<WelcomeScreenRecord> {
    try {
      return await apiClient.post<WelcomeScreenRecord, WelcomeScreenData, 'welcomeScreen'>('welcomeScreen', 'create', data);
    } catch (error) {
      console.error('Error al crear pantalla de bienvenida:', error);
      throw error;
    }
  },

  /**
   * Actualiza una pantalla de bienvenida existente
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @returns Pantalla actualizada
   */
  async update(id: string, data: Partial<WelcomeScreenData>): Promise<WelcomeScreenRecord> {
    try {
      return await apiClient.put<WelcomeScreenRecord, Partial<WelcomeScreenData>, 'welcomeScreen'>('welcomeScreen', 'update', data, { id });
    } catch (error) {
      console.error(`Error al actualizar pantalla de bienvenida ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una pantalla de bienvenida
   * @param id ID de la pantalla
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete<void, 'welcomeScreen'>('welcomeScreen', 'delete', { id });
    } catch (error) {
      console.error(`Error al eliminar pantalla de bienvenida ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea o actualiza la pantalla de bienvenida para una investigación
   * @param researchId ID de la investigación
   * @param data Datos de la pantalla
   * @returns Pantalla creada o actualizada
   */
  async createOrUpdateForResearch(researchId: string, data: Omit<WelcomeScreenData, 'researchId'>): Promise<WelcomeScreenRecord> {
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
      console.error(`Error al crear/actualizar pantalla de bienvenida para investigación ${researchId}:`, error);
      throw error;
    }
  }
};

export default welcomeScreenService; 
import { apiClient } from '../config/api-client';

/**
 * Interfaz que representa una investigación en el sistema
 */
export interface Research {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed';
  userId: string;
  // Otros campos relacionados con la investigación
}

/**
 * Interfaz para la creación de una nueva investigación
 */
export interface CreateResearchData {
  name: string;
  description?: string;
  // Otros campos necesarios para crear una investigación
}

/**
 * Servicio para manejar operaciones relacionadas con investigaciones
 */
export const researchService = {
  /**
   * Obtiene todas las investigaciones del usuario
   * @returns Lista de investigaciones
   */
  async getAll(): Promise<Research[]> {
    try {
      return await apiClient.get<Research[], 'research'>('research', 'getAllResearch');
    } catch (error) {
      console.error('Error al obtener investigaciones:', error);
      throw error;
    }
  },

  /**
   * Obtiene una investigación por su ID
   * @param id ID de la investigación
   * @returns Investigación solicitada
   */
  async getById(id: string): Promise<Research> {
    try {
      return await apiClient.get<Research, 'research'>('research', 'getResearch', { id });
    } catch (error) {
      console.error(`Error al obtener investigación ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva investigación
   * @param data Datos de la nueva investigación
   * @returns Investigación creada
   */
  async create(data: CreateResearchData): Promise<Research> {
    try {
      return await apiClient.post<Research, CreateResearchData, 'research'>('research', 'createResearch', data);
    } catch (error) {
      console.error('Error al crear investigación:', error);
      throw error;
    }
  },

  /**
   * Actualiza una investigación existente
   * @param id ID de la investigación
   * @param data Datos a actualizar
   * @returns Investigación actualizada
   */
  async update(id: string, data: Partial<CreateResearchData>): Promise<Research> {
    try {
      return await apiClient.put<Research, Partial<CreateResearchData>, 'research'>('research', 'updateResearch', data, { id });
    } catch (error) {
      console.error(`Error al actualizar investigación ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una investigación
   * @param id ID de la investigación
   * @returns Confirmación de eliminación
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete<void, 'research'>('research', 'deleteResearch', { id });
    } catch (error) {
      console.error(`Error al eliminar investigación ${id}:`, error);
      throw error;
    }
  }
};

export default researchService; 
import { apiClient } from '../config/api';

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
    return apiClient.get('research', 'getAll');
  },

  /**
   * Obtiene una investigación por su ID
   * @param id ID de la investigación
   * @returns Investigación solicitada
   */
  async getById(id: string): Promise<Research> {
    return apiClient.get('research', 'getById', { id });
  },

  /**
   * Crea una nueva investigación
   * @param data Datos de la nueva investigación
   * @returns Investigación creada
   */
  async create(data: CreateResearchData): Promise<Research> {
    return apiClient.post('research', 'create', data);
  },

  /**
   * Actualiza una investigación existente
   * @param id ID de la investigación
   * @param data Datos a actualizar
   * @returns Investigación actualizada
   */
  async update(id: string, data: Partial<CreateResearchData>): Promise<Research> {
    return apiClient.put('research', 'update', data, { id });
  },

  /**
   * Elimina una investigación
   * @param id ID de la investigación
   * @returns Confirmación de eliminación
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete('research', 'delete', { id });
  }
};

export default researchService;

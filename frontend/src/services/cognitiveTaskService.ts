import { cognitiveTaskAPI } from '@/lib/cognitive-task-api';
import type { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';

/**
 * Servicio para manejar operaciones relacionadas con las tareas cognitivas
 */
export const cognitiveTaskService = {
  /**
   * Obtiene la configuración de tarea cognitiva para una investigación específica
   * @param researchId ID de la investigación
   * @returns Configuración solicitada
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskFormData | null> {
    return cognitiveTaskAPI.getByResearchId(researchId);
  },

  /**
   * Crea una nueva configuración de tarea cognitiva
   * @param researchId ID de la investigación
   * @param data Datos de la nueva configuración
   * @returns Configuración creada
   */
  async create(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    return cognitiveTaskAPI.create(researchId, data);
  },

  /**
   * Actualiza una configuración de tarea cognitiva existente
   * @param researchId ID de la investigación
   * @param data Datos a actualizar
   * @returns Configuración actualizada
   */
  async update(researchId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskFormData> {
    return cognitiveTaskAPI.update(researchId, data);
  },

  /**
   * Actualiza o crea una configuración de tarea cognitiva para una investigación específica
   * @param researchId ID de la investigación
   * @param data Datos completos de la configuración
   * @returns Configuración actualizada o creada
   */
  async save(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    return cognitiveTaskAPI.save(researchId, data);
  },

  /**
   * Elimina una configuración de tarea cognitiva
   * @param researchId ID de la investigación
   * @returns Confirmación de eliminación
   */
  async deleteByResearchId(researchId: string): Promise<void> {
    return cognitiveTaskAPI.deleteByResearchId(researchId);
  }
};

export default cognitiveTaskService;

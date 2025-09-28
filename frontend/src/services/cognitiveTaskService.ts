import { cognitiveTaskApi } from '@/api/domains/cognitive-task';
import type { CognitiveTaskFormData } from '@/api/domains/cognitive-task';

/**
 * Servicio para manejar operaciones relacionadas con las tareas cognitivas
 * Migrated to use domain architecture while maintaining same interface
 */
export const cognitiveTaskService = {
  /**
   * Obtiene la configuración de tarea cognitiva para una investigación específica
   * @param researchId ID de la investigación
   * @returns Configuración solicitada
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskFormData | null> {
    return cognitiveTaskApi.getByResearchId(researchId);
  },

  /**
   * Crea una nueva configuración de tarea cognitiva
   * @param researchId ID de la investigación
   * @param data Datos de la nueva configuración
   * @returns Configuración creada
   */
  async create(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    return cognitiveTaskApi.create({
      ...data,
      researchId
    });
  },

  /**
   * Actualiza una configuración de tarea cognitiva existente
   * @param researchId ID de la investigación
   * @param data Datos a actualizar
   * @returns Configuración actualizada
   */
  async update(researchId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskFormData> {
    return cognitiveTaskApi.update(researchId, data);
  },

  /**
   * Actualiza o crea una configuración de tarea cognitiva para una investigación específica
   * @param researchId ID de la investigación
   * @param data Datos completos de la configuración
   * @returns Configuración actualizada o creada
   */
  async save(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    // Check if task exists to determine create or update
    const existing = await cognitiveTaskApi.getByResearchId(researchId).catch(() => null);
    if (existing) {
      return cognitiveTaskApi.update(researchId, data);
    } else {
      return cognitiveTaskApi.create({
        ...data,
        researchId
      });
    }
  },

  /**
   * Elimina una configuración de tarea cognitiva
   * @param researchId ID de la investigación
   * @returns Confirmación de eliminación
   */
  async deleteByResearchId(researchId: string): Promise<void> {
    return cognitiveTaskApi.delete(researchId);
  }
};

export default cognitiveTaskService;

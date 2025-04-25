/**
 * API para CognitiveTask (Refactorizada)
 */

import { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';
import API_CONFIG from '@/config/api.config';
import { ApiClient } from '@/lib/api-client';
import { ApiError } from '@/config/api-client'; // Importar ApiError si se necesita

// Quitado: getAuthHeaders
// Quitado: handleCognitiveTaskResponse
// Quitado: normalizeUrl

export class CognitiveTaskFixedAPI extends ApiClient {
  constructor() {
    super(`${API_CONFIG.baseURL}`);
  }

  /**
   * Obtiene la tarea cognitiva asociada a una investigación
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskFormData | null> {
    console.log(`[CognitiveTaskFixedAPI] Obteniendo tarea cognitiva por researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task`;
    try {
      const result = await this.get<CognitiveTaskFormData>(path);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        console.log(`[CognitiveTaskFixedAPI] No se encontró Tarea Cognitiva para researchId: ${researchId}, devolviendo null.`);
        return null;
      }
      console.error("[CognitiveTaskFixedAPI] Error en getByResearchId:", error);
      throw error;
    }
  }

  /**
   * Crea una nueva tarea cognitiva
   */
  async create(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    console.log(`[CognitiveTaskFixedAPI] Creando tarea cognitiva para researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task`;
    // Asegurarse que el payload incluya researchId si el backend lo necesita en el body
    const payload = { ...data, researchId }; 
    return this.post<CognitiveTaskFormData>(path, payload);
  }

  /**
   * Actualiza una tarea cognitiva existente
   * @param researchId ID de la investigación
   * @param taskId ID de la tarea cognitiva a actualizar
   * @param data Datos actualizados
   */
  async update(researchId: string, taskId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskFormData> {
    console.log(`[CognitiveTaskFixedAPI] Actualizando tarea cognitiva ${taskId} para researchId: ${researchId}`);
    // Construir ruta incluyendo taskId
    const path = `/research/${researchId}/cognitive-task/${taskId}`;
    return this.put<CognitiveTaskFormData>(path, data);
  }

  /**
   * Elimina una tarea cognitiva existente
   * Renombrado a deleteTask para evitar conflicto con ApiClient.delete
   * @param researchId ID de la investigación
   * @param taskId ID de la tarea cognitiva a eliminar
   */
  async deleteTask(researchId: string, taskId: string): Promise<void> {
    console.log(`[CognitiveTaskFixedAPI] Eliminando tarea cognitiva ${taskId} para researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task/${taskId}`;
    // Llamar al método delete de la clase base ApiClient
    await super.delete<void>(path);
  }
  
  // Mantener métodos relacionados con S3 si son necesarios y específicos
  // async getFileUploadUrl(...) { ... }
  // async getFileDownloadUrl(...) { ... }
  // async getFileDeleteUrl(...) { ... }
}

// Exportar instancia
export const cognitiveTaskFixedAPI = new CognitiveTaskFixedAPI(); 
import { ApiClient } from '../lib/api-client';
import {
  CreateModuleResponseDto,
  GroupedResponsesResponse,
  ParticipantResponsesDocument,
  UpdateModuleResponseDto
} from '../shared/interfaces/module-response.interface';

export class ModuleResponseService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Obtener respuestas de un participante específico
   */
  async getResponsesForParticipant(
    researchId: string,
    participantId: string
  ): Promise<ParticipantResponsesDocument | null> {
    try {
      const response = await this.apiClient.get(
        `/module-responses?researchId=${researchId}&participantId=${participantId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error al obtener respuestas: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en getResponsesForParticipant:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las respuestas de un research
   */
  async getResponsesByResearch(researchId: string): Promise<ParticipantResponsesDocument[]> {
    try {
      const response = await this.apiClient.get(`/module-responses/research/${researchId}`);

      if (!response.ok) {
        throw new Error(`Error al obtener respuestas del research: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en getResponsesByResearch:', error);
      throw error;
    }
  }

  /**
   * Obtener respuestas agrupadas por pregunta para análisis estadísticos
   * Esta estructura es más eficiente para análisis de múltiples participantes
   */
  async getResponsesGroupedByQuestion(researchId: string): Promise<GroupedResponsesResponse> {
    try {
      const response = await this.apiClient.get(`/module-responses/grouped-by-question/${researchId}`);

      if (!response.ok) {
        throw new Error(`Error al obtener respuestas agrupadas: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getResponsesGroupedByQuestion:', error);
      throw error;
    }
  }

  /**
   * Guardar una nueva respuesta
   */
  async saveResponse(data: CreateModuleResponseDto): Promise<ParticipantResponsesDocument> {
    try {
      const response = await this.apiClient.post('/module-responses', data);

      if (!response.ok) {
        throw new Error(`Error al guardar respuesta: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en saveResponse:', error);
      throw error;
    }
  }

  /**
   * Actualizar una respuesta existente
   */
  async updateResponse(id: string, data: UpdateModuleResponseDto): Promise<ParticipantResponsesDocument> {
    try {
      const response = await this.apiClient.put(`/module-responses/${id}`, data);

      if (!response.ok) {
        throw new Error(`Error al actualizar respuesta: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en updateResponse:', error);
      throw error;
    }
  }

  /**
   * Marcar respuestas como completadas
   */
  async markAsCompleted(researchId: string, participantId: string): Promise<ParticipantResponsesDocument | null> {
    try {
      const response = await this.apiClient.post('/module-responses/complete', {
        researchId,
        participantId
      });

      if (!response.ok) {
        throw new Error(`Error al marcar como completado: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en markAsCompleted:', error);
      throw error;
    }
  }

  /**
   * Eliminar todas las respuestas de un participante
   */
  async deleteAllResponses(researchId: string, participantId: string): Promise<void> {
    try {
      const response = await this.apiClient.delete('/module-responses', {
        researchId,
        participantId
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar respuestas: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error en deleteAllResponses:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const moduleResponseService = new ModuleResponseService();

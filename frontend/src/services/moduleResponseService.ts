import { ApiClient } from '../lib/api-client';
import {
  CreateModuleResponseDto,
  ParticipantResponsesDocument,
  UpdateModuleResponseDto
} from '../shared/interfaces/module-response.interface';

interface QuestionResponse {
  participantId: string;
  value: any;
  timestamp: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

interface QuestionWithResponses {
  questionKey: string;
  responses: QuestionResponse[];
}

interface GroupedResponsesResponse {
  data: QuestionWithResponses[];
  status: number;
}

export class ModuleResponseService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '');
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
      ) as Response;

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
      const response = await this.apiClient.get(`/module-responses/research/${researchId}`) as Response;

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
      console.log(`[ModuleResponseService] Iniciando request para researchId: ${researchId}`);

      // El ApiClient maneja la respuesta internamente y devuelve los datos parseados
      const data = await this.apiClient.get(`/module-responses/grouped-by-question/${researchId}`);
      console.log(`[ModuleResponseService] Datos recibidos del ApiClient para researchId: ${researchId}:`, data);

      // Si el ApiClient devuelve null (404), devolver respuesta vacía
      if (data === null) {
        console.warn(`[ModuleResponseService] Endpoint no encontrado (404) para researchId: ${researchId}`);
        return {
          data: [],
          status: 404
        };
      }

      // Si el ApiClient devuelve un objeto con error, manejarlo
      if (data && typeof data === 'object' && 'error' in data) {
        console.warn(`[ModuleResponseService] Error del ApiClient para researchId: ${researchId}:`, data);
        return {
          data: [],
          status: (data as any).status || 500
        };
      }

      // Validar que la respuesta tenga el formato esperado
      if (!data || typeof data !== 'object') {
        console.warn(`[ModuleResponseService] Respuesta inválida para researchId: ${researchId}:`, data);
        return {
          data: [],
          status: 200
        };
      }

      // Si la respuesta no tiene la estructura esperada, devolver datos vacíos
      if (!Array.isArray((data as any).data) && !(data as any).data) {
        console.warn(`[ModuleResponseService] Respuesta sin estructura de datos para researchId: ${researchId}:`, data);
        return {
          data: [],
          status: 200
        };
      }

      console.log(`[ModuleResponseService] Respuesta válida para researchId: ${researchId}:`, data);
      return data as GroupedResponsesResponse;
    } catch (error) {
      console.error('Error en getResponsesGroupedByQuestion:', error);

      // Si el error incluye "not found", "404", o cualquier error de red, devolver respuesta vacía
      if (error instanceof Error && (
        error.message.includes('not found') ||
        error.message.includes('404') ||
        error.message.includes('No se pudo obtener') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('fetch') ||
        error.message.includes('Unknown error') ||
        error.message.includes('200')
      )) {
        console.warn(`[ModuleResponseService] Error de red, endpoint no disponible o respuesta inválida, devolviendo datos vacíos para researchId: ${researchId}`);
        return {
          data: [],
          status: 404
        };
      }

      // Para cualquier otro error, también devolver datos vacíos en lugar de fallar
      console.warn(`[ModuleResponseService] Error inesperado, devolviendo datos vacíos para researchId: ${researchId}:`, error);
      return {
        data: [],
        status: 500
      };
    }
  }

  /**
   * Guardar una nueva respuesta
   */
  async saveResponse(data: CreateModuleResponseDto): Promise<ParticipantResponsesDocument> {
    try {
      const response = await this.apiClient.post('/module-responses', data) as Response;

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
      const response = await this.apiClient.put(`/module-responses/${id}`, data) as Response;

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
      }) as Response;

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
      const response = await this.apiClient.delete(`/module-responses?researchId=${researchId}&participantId=${participantId}`) as Response;

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

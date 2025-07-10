import { useParticipantStore } from '../stores/participantStore';
import {
    APIResponse,
    CognitiveTaskFormData,
    EyeTrackingFormData,
    ModuleResponse,
    SmartVOCFormData,
    Step,
    ThankYouScreenFormData,
    WelcomeScreenResponse
} from './types';

// Estados de respuesta de la API
export enum APIStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  NOT_FOUND = 'not_found',
  LOADING = 'loading',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
  UNAUTHORIZED = 'unauthorized',
  TOKEN_EXPIRED = 'token_expired'
}

// Constantes de configuración
const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

// Clase para manejar las peticiones a la API
export class ApiClient {
  constructor() {
    // El constructor ya no necesita cargar el token aquí.
  }

  private getHeaders(): Record<string, string> {
    const token = useParticipantStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private validateResearchId(researchId: string): boolean {
    if (!researchId || typeof researchId !== 'string' || researchId.trim() === '') {
      throw new Error('ID de investigación inválido');
    }
    return true;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    try {
      const requestHeaders = this.getHeaders();

      if (!requestHeaders['Authorization']) {
        console.warn(`[ApiClient] Llamada a ${endpoint} sin token (obtenido del store).`);
        return {
          data: null,
          error: true,
          apiStatus: APIStatus.UNAUTHORIZED,
          message: 'No hay token de participante para esta solicitud (desde store)'
        };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: requestHeaders,
      });

      let responseData: unknown = null;
      try {
        if (response.headers.get('content-length') !== '0') {
          responseData = await response.json();
        }
      } catch (e) {
        console.error(`[ApiClient] Error parseando JSON de ${endpoint}:`, e);
        if (!response.ok) {
          return {
            data: null,
            error: true,
            status: response.status,
            apiStatus: APIStatus.SERVER_ERROR,
            message: `Error del servidor: Respuesta inválida (status ${response.status})`
          };
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          return {
            data: null,
            error: true,
            status: response.status,
            apiStatus: APIStatus.TOKEN_EXPIRED,
            message: 'Sesión expirada o token inválido'
          };
        }

        let message = `Error HTTP: ${response.status}`;
        if (responseData && typeof responseData === 'object' && responseData !== null && 'message' in responseData) {
          message = (responseData as { message?: string }).message || message;
        }

        if (response.status === 404) {
          return {
            data: null,
            notFound: true,
            status: response.status,
            apiStatus: APIStatus.NOT_FOUND,
            message: message || 'Recurso no encontrado'
          };
        }

        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message
        };
      }

      return {
        data: responseData as T,
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          data: null,
          error: true,
          apiStatus: APIStatus.NETWORK_ERROR,
          message: 'Error de conexión: verifica tu conexión a internet'
        };
      }

      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Método para registrar un participante
  async registerParticipant(data: { name: string; email: string; researchId: string }): Promise<APIResponse<{ token: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/eye-tracking-recruit/public/participant/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: true,
          status: response.status,
          message: `Error ${response.status}: ${errorText}`,
          data: null
        };
      }

      const result = await response.json();
      return {
        data: result.data,
        status: response.status
      };
    } catch (error) {
      return {
        error: true,
        status: 500,
        message: error instanceof Error ? error.message : 'Error desconocido',
        data: null
      };
    }
  }

  async getWelcomeScreen(researchId: string): Promise<APIResponse<WelcomeScreenResponse>> {
    this.validateResearchId(researchId);
    const response = await this.request<{ data: WelcomeScreenResponse }>(`/research/${researchId}/welcome-screen`);
    return { ...response, data: response.data?.data || null };
  }

  async getSmartVOC(researchId: string): Promise<APIResponse<SmartVOCFormData>> {
    this.validateResearchId(researchId);
    const response = await this.request<{ data: SmartVOCFormData }>(`/research/${researchId}/smart-voc`);
    return { ...response, data: response.data?.data || null };
  }

  async getCognitiveTask(researchId: string): Promise<APIResponse<CognitiveTaskFormData>> {
    this.validateResearchId(researchId);
    const response = await this.request<{ data: CognitiveTaskFormData }>(`/research/${researchId}/cognitive-task`);
    return { ...response, data: response.data?.data || null };
  }

  async getThankYouScreen(researchId: string): Promise<APIResponse<ThankYouScreenFormData>> {
    this.validateResearchId(researchId);
    const response = await this.request<{ data: ThankYouScreenFormData }>(`/research/${researchId}/thank-you-screen`);
    return { ...response, data: response.data?.data || null };
  }

  /**
   * Obtiene la configuración de Eye Tracking para una investigación específica
   * @param researchId ID de la investigación
   * @returns Configuración de Eye Tracking
   */
  async getEyeTracking(researchId: string): Promise<APIResponse<EyeTrackingFormData>> {
    this.validateResearchId(researchId);

    // Usar el endpoint para obtener configuración de Eye Tracking
    const response = await this.request<{ data: EyeTrackingFormData }>(`/research/${researchId}/eye-tracking`);
    return { ...response, data: response.data?.data || null };
  }

  async getEyeTrackingRecruit(researchId: string): Promise<APIResponse<unknown>> {
    this.validateResearchId(researchId);

    // Usar el endpoint para obtener configuración de Eye Tracking Recruit
    const response = await this.request<unknown>(`/eye-tracking-recruit/research/${researchId}`);
    return response;
  }

  async getResearchFlow(researchId: string): Promise<APIResponse<Step[]>> {
    this.validateResearchId(researchId);

    // Obtener el flujo de la investigación (pasos)
    const response = await this.request<{ data: Step[] }>(`/research/${researchId}/forms`);
    return { ...response, data: response.data?.data || null };
  }

  /**
   * Obtiene las respuestas de un participante para una investigación
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @returns Respuestas del participante
   */
  async getModuleResponses(researchId: string, participantId: string): Promise<APIResponse<unknown>> {
    this.validateResearchId(researchId);
    if (!participantId) throw new Error('ID de participante inválido para getModuleResponses');
    // Endpoint de backendV2: GET /module-responses con query params
    return this.request<unknown>(`/module-responses?researchId=${researchId}&participantId=${participantId}`);
  }

  /**
   * Guarda una respuesta de módulo
   */
  async saveModuleResponse(data: {
    researchId: string;
    participantId: string;
    stepType: string;
    stepTitle: string;
    response: unknown;
    metadata?: unknown;
    questionKey?: string; // NUEVO: questionKey del diccionario global
  }): Promise<APIResponse<ModuleResponse>> {
    try {
      console.log(`[ApiClient.saveModuleResponse] 📤 Enviando respuesta:`, {
        stepType: data.stepType,
        stepTitle: data.stepTitle,
        questionKey: data.questionKey,
        hasQuestionKey: !!data.questionKey
      });

      const response = await fetch(`${API_BASE_URL}/module-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders()
        },
        body: JSON.stringify({
          researchId: data.researchId,
          participantId: data.participantId,
          stepType: data.stepType,
          stepTitle: data.stepTitle,
          questionKey: data.questionKey, // NUEVO: incluir questionKey en el payload
          response: data.response,
          metadata: data.metadata || {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ApiClient.saveModuleResponse] ❌ Error ${response.status}:`, errorText);
        return {
          error: true,
          status: response.status,
          message: `Error ${response.status}: ${errorText}`,
          data: null // NUEVO: agregar data: null para cumplir con APIResponse
        };
      }

      const result = await response.json();
      console.log(`[ApiClient.saveModuleResponse] ✅ Respuesta guardada exitosamente:`, {
        responseId: result.data?.id,
        questionKey: result.data?.questionKey
      });

      return {
        data: result.data,
        status: response.status
      };
    } catch (error) {
      console.error('[ApiClient.saveModuleResponse] 💥 Exception:', error);
      return {
        error: true,
        status: 500,
        message: error instanceof Error ? error.message : 'Error desconocido',
        data: null // NUEVO: agregar data: null para cumplir con APIResponse
      };
    }
  }

  /**
   * Actualiza una respuesta de módulo existente
   * @param responseId ID de la respuesta a actualizar
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @param payload Datos actualizados de la respuesta
   * @returns Respuesta actualizada
   */
  async updateModuleResponse(
    responseId: string,
    researchId: string,
    participantId: string,
    payload: {
      response: unknown,
      metadata?: unknown
    }
  ): Promise<APIResponse<unknown>> {
    if (!responseId || !researchId || !participantId || !payload) {
      console.error('[ApiClient] Faltan IDs o payload para updateModuleResponse');
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.VALIDATION_ERROR,
        message: 'Faltan IDs o payload para actualizar la respuesta.'
      };
    }

    // Construir el endpoint con researchId y participantId como query parameters
    const endpoint = `/module-responses/${encodeURIComponent(responseId)}?researchId=${encodeURIComponent(researchId)}&participantId=${encodeURIComponent(participantId)}`;

    const response = await this.request<unknown>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  }

  /**
   * Marca las respuestas como completadas
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @returns Confirmación de completado
   */
  async markResponsesAsCompleted(researchId: string, participantId: string): Promise<APIResponse<unknown>> {
    this.validateResearchId(researchId);
    if (!participantId) throw new Error('ID de participante inválido');

    return this.request<unknown>(`/module-responses/complete?researchId=${researchId}&participantId=${participantId}`, {
        method: 'POST',
    });
  }

  async deleteAllResponses(researchId: string, participantId: string): Promise<APIResponse<unknown>> {
    this.validateResearchId(researchId);
    if (!participantId) throw new Error('ID de participante inválido');

    return this.request<unknown>(`/module-responses?researchId=${researchId}&participantId=${participantId}`, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient();

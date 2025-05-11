import {
  APIResponse,
  WelcomeScreenResponse,
  SmartVOCFormData,
  CognitiveTaskFormData,
  ThankYouScreenFormData,
  EyeTrackingFormData,
} from './types';
import { useParticipantStore } from '../stores/participantStore';

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

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

// Interfaz para el registro de participante
interface ParticipantRegistration {
  name: string;
  email: string;
  researchId: string;
}

// Definir Step aquí localmente
interface Step {
  id: string;
  type: string;
  config?: any;
}

// Clase para manejar las peticiones a la API
export class ApiClient {
  constructor() {
    // El constructor ya no necesita cargar el token aquí.
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = useParticipantStore.getState().token;

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
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

      let responseData: any = null;
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

        if (response.status === 404) {
          return {
            data: null,
            notFound: true,
            status: response.status,
            apiStatus: APIStatus.NOT_FOUND,
            message: responseData?.message || 'Recurso no encontrado'
          };
        }

        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: responseData?.message || `Error HTTP: ${response.status}`
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
  async registerParticipant(data: ParticipantRegistration): Promise<APIResponse<{ token: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/participant/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: responseData.message || 'Error al registrar participante'
        };
      }

      return {
        data: { token: responseData.token },
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido'
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
  
  async getEyeTrackingRecruit(researchId: string): Promise<APIResponse<any>> {
    this.validateResearchId(researchId);
    
    // Usar el endpoint para obtener configuración de Eye Tracking Recruit
    const response = await this.request<any>(`/eye-tracking-recruit/research/${researchId}`);
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
  async getModuleResponses(researchId: string, participantId: string): Promise<APIResponse<any>> {
    this.validateResearchId(researchId);
    if (!participantId) throw new Error('ID de participante inválido para getModuleResponses');
    // Endpoint de backendV2: GET /module-responses con query params
    return this.request<any>(`/module-responses?researchId=${researchId}&participantId=${participantId}`);
  }

  /**
   * Guarda una nueva respuesta de módulo
   * @param payload Datos de la respuesta
   * @returns Respuesta guardada
   */
  async saveModuleResponse(payload: { researchId: string, participantId: string, stepType: string, stepTitle: string, response: any }): Promise<APIResponse<any>> {
    return this.request<any>('/module-responses', { 
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Actualiza una respuesta de módulo existente
   * @param responseId ID de la respuesta a actualizar
   * @param payload Datos actualizados de la respuesta
   * @returns Respuesta actualizada
   */
  async updateModuleResponse(
    responseId: string,
    payload: { response: any }
  ): Promise<APIResponse<any>> {
    return this.request<any>(`/module-responses/${responseId}`, { 
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Marca las respuestas como completadas
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @returns Confirmación de completado
   */
  async markResponsesAsCompleted(researchId: string, participantId: string): Promise<APIResponse<any>> {
    this.validateResearchId(researchId);
    if (!participantId) throw new Error('ID de participante inválido');
    
    return this.request<any>(`/module-responses/complete?researchId=${researchId}&participantId=${participantId}`, { 
        method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(); 
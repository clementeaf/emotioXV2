import {
  APIResponse,
  WelcomeScreenResponse,
  SmartVOCFormData,
  CognitiveTaskFormData,
  ThankYouScreenFormData,
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
  private token: string | null = null;

  constructor() {
    // Intentar recuperar el token almacenado al inicializar
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('participantToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('participantToken', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('participantToken');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      (headers as any)['Authorization'] = `Bearer ${this.token}`;
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
      // Cast headers to a record to safely access Authorization
      const headers = options.headers as Record<string, string> | undefined;
      if (!this.token && !headers?.['Authorization']) { // Check using the casted variable
        console.warn(`[ApiClient] Llamada a ${endpoint} sin token.`);
        return {
          data: null,
          error: true,
          apiStatus: APIStatus.UNAUTHORIZED,
          message: 'No hay token de participante para esta solicitud'
        };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
        ...options,
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
          this.clearToken();
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

      // Almacenar el token
      this.setToken(responseData.token);

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

  async getResearchFlow(researchId: string): Promise<APIResponse<Step[]>> {
    this.validateResearchId(researchId);
    const response = await this.request<{ data: Step[] }>(`/research/${researchId}/flow`);
    return { ...response, data: response.data?.data || null };
  }
}

// Exportar una instancia por defecto
export const api = new ApiClient(); 
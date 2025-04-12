import {
  APIResponse,
  WelcomeScreenResponse,
  SmartVOCFormData,
  CognitiveTaskFormData,
  ThankYouScreenFormData
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.emotio.cloud';

// Interfaz para el registro de participante
interface ParticipantRegistration {
  name: string;
  email: string;
  researchId: string;
}

// Clase para manejar las peticiones a la API
export class ApiClient {
  private token: string | null = null;

  constructor() {
    // Intentar recuperar el token almacenado al inicializar
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('participant_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('participant_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('participant_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private validateResearchId(researchId: string): boolean {
    if (!researchId || typeof researchId !== 'string' || researchId.trim() === '') {
      throw new Error('ID de investigación inválido');
    }
    return true;
  }

  private async request<T>(endpoint: string): Promise<APIResponse<T>> {
    try {
      if (!this.token) {
        return {
          data: null,
          error: true,
          apiStatus: APIStatus.UNAUTHORIZED,
          message: 'No hay token de participante'
        };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado o inválido
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
            message: 'Recurso no encontrado'
          };
        }

        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: `Error HTTP: ${response.status}`
        };
      }

      return {
        data: responseData,
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
    return this.request<WelcomeScreenResponse>(`/api/welcome-screen/research/${researchId}`);
  }

  async getSmartVOC(researchId: string): Promise<APIResponse<SmartVOCFormData>> {
    this.validateResearchId(researchId);
    return this.request<SmartVOCFormData>(`/api/smart-voc/research/${researchId}`);
  }

  async getCognitiveTask(researchId: string): Promise<APIResponse<CognitiveTaskFormData>> {
    this.validateResearchId(researchId);
    return this.request<CognitiveTaskFormData>(`/api/cognitive-task/research/${researchId}`);
  }

  async getThankYouScreen(researchId: string): Promise<APIResponse<ThankYouScreenFormData>> {
    this.validateResearchId(researchId);
    return this.request<ThankYouScreenFormData>(`/api/thank-you-screen/research/${researchId}`);
  }
}

// Exportar una instancia por defecto
export const api = new ApiClient(); 
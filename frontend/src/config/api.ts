/**
 * Configuración API Simplificada para EmotioXV2
 * Reemplaza toda la sobrecomplicación anterior con una solución limpia y directa
 */

// URLs base desde el archivo principal de endpoints
export const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
export const WS_BASE_URL = 'wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Configuración de endpoints simplificada
 */
export const API_ENDPOINTS = {
  // Autenticación
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refreshToken',
    profile: '/auth/profile',
  },

  // Investigaciones
  research: {
    create: '/research',
    getAll: '/research',
    getById: '/research/{id}',
    update: '/research/{id}',
    delete: '/research/{id}',
    updateStatus: '/research/{id}/status',
    updateStage: '/research/{id}/stage',
  },

  // Pantallas de bienvenida
  welcomeScreen: {
    getByResearch: '/research/{researchId}/welcome-screen',
    create: '/research/{researchId}/welcome-screen',
    update: '/research/{researchId}/welcome-screen/{screenId}',
    delete: '/research/{researchId}/welcome-screen/{screenId}',
  },

  // Pantallas de agradecimiento
  thankYouScreen: {
    getByResearch: '/research/{researchId}/thank-you-screen',
    create: '/research/{researchId}/thank-you-screen',
    update: '/research/{researchId}/thank-you-screen/{screenId}',
    delete: '/research/{researchId}/thank-you-screen/{screenId}',
  },

  // SmartVOC
  smartVoc: {
    getByResearch: '/research/{researchId}/smart-voc',
    create: '/research/{researchId}/smart-voc',
    update: '/research/{researchId}/smart-voc',
    delete: '/research/{researchId}/smart-voc',
  },

  // Eye Tracking
  eyeTracking: {
    getByResearch: '/research/{researchId}/eye-tracking',
    create: '/research/{researchId}/eye-tracking',
    update: '/research/{researchId}/eye-tracking',
    delete: '/research/{researchId}/eye-tracking',
  },

  // Eye Tracking Recruit
  eyeTrackingRecruit: {
    getConfigByResearch: '/eye-tracking-recruit/research/{researchId}/config',
    createConfig: '/eye-tracking-recruit/research/{researchId}/config',
    updateConfig: '/eye-tracking-recruit/research/{researchId}/config',
    createParticipant: '/eye-tracking-recruit/config/{configId}/participant',
    updateParticipantStatus: '/eye-tracking-recruit/participant/{participantId}/status',
    getParticipants: '/eye-tracking-recruit/config/{configId}/participants',
    getStats: '/eye-tracking-recruit/config/{configId}/stats',
    generateLink: '/eye-tracking-recruit/config/{configId}/link',
    getActiveLinks: '/eye-tracking-recruit/config/{configId}/links',
    deactivateLink: '/eye-tracking-recruit/link/{token}/deactivate',
    validateLink: '/eye-tracking-recruit/link/{token}/validate',
    getResearchSummary: '/eye-tracking-recruit/research/{researchId}/summary',
    registerPublicParticipant: '/eye-tracking-recruit/public/participant/start',
    updatePublicParticipantStatus: '/eye-tracking-recruit/public/participant/{participantId}/status',
  },

  // Tareas cognitivas
  cognitiveTask: {
    getByResearch: '/research/{researchId}/cognitive-task',
    create: '/research/{researchId}/cognitive-task',
    update: '/research/{researchId}/cognitive-task',
    delete: '/research/{researchId}/cognitive-task',
  },

  // S3
  s3: {
    upload: '/s3/upload',
    download: '/s3/download',
    deleteObject: '/s3/delete-object',
  },
} as const;

/**
 * Tipos TypeScript para los endpoints
 */
export type ApiCategory = keyof typeof API_ENDPOINTS;
export type ApiOperation<T extends ApiCategory> = keyof typeof API_ENDPOINTS[T];

/**
 * Cliente API simplificado
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Establece el token de autenticación
   */
  setAuthToken(token: string): void {
    console.log('🔑 [ApiClient] setAuthToken llamado con:', token.substring(0, 20) + '...');
    this.defaultHeaders.Authorization = `Bearer ${token}`;
    console.log('🔑 [ApiClient] Headers actualizados:', this.defaultHeaders);
  }

  /**
   * Limpia el token de autenticación
   */
  clearAuthToken(): void {
    delete this.defaultHeaders.Authorization;
  }

  /**
   * Construye una URL completa reemplazando parámetros
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    let url = endpoint;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value);
      });
    }

    // Verificar que no queden parámetros sin reemplazar
    if (/\{[^\/]+\}/.test(url)) {
      throw new Error(`Parámetros no reemplazados en URL: ${url}`);
    }

    return url.startsWith('/') ? `${this.baseUrl}${url}` : `${this.baseUrl}/${url}`;
  }

  /**
   * Obtiene el endpoint completo
   */
  getEndpoint(
    category: string,
    operation: string,
    params?: Record<string, string>
  ): string {
    const endpoint = (API_ENDPOINTS as any)[category][operation] as string;
    return this.buildUrl(endpoint, params);
  }

  /**
   * Realiza una petición GET
   */
  async get<T = any>(
    category: string,
    operation: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);
    const finalUrl = queryParams
      ? `${url}?${new URLSearchParams(queryParams)}`
      : url;

    console.log(`🔍 [ApiClient] GET ${finalUrl}`);
    console.log(`🔍 [ApiClient] Headers:`, this.defaultHeaders);
    console.log(`🔍 [ApiClient] Token presente:`, !!this.defaultHeaders.Authorization);

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: this.defaultHeaders,
    });

    console.log(`🔍 [ApiClient] Response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`🔍 [ApiClient] Error response:`, errorText);
    }

    return this.handleResponse<T>(response);
  }

  /**
   * Realiza una petición POST
   */
  async post<T = any>(
    category: string,
    operation: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Realiza una petición PUT
   */
  async put<T = any>(
    category: string,
    operation: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Realiza una petición DELETE
   */
  async delete<T = any>(
    category: string,
    operation: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Maneja la respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        // Si no se puede parsear como JSON, usar el texto de la respuesta
        const errorText = await response.text();
        errorData = { message: errorText };
      }

      throw new ApiError(
        `Error ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError(
        'Error al parsear respuesta JSON',
        500,
        { originalError: error }
      );
    }
  }
}

/**
 * Clase de error personalizada
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Instancia global del cliente API
 */
export const apiClient = new ApiClient();

/**
 * Función helper para obtener URL completa
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Función helper para obtener URL de WebSocket
 */
export function getWebsocketUrl(): string {
  return WS_BASE_URL;
}

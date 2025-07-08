/**
 * Configuración API Centralizada para EmotioXV2
 * ÚNICA FUENTE DE VERDAD para toda la configuración de API
 * SOLO AWS Lambda - NUNCA localhost o desarrollo local
 */

// URLs base - SOLO AWS Lambda
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || '';

// Validación de seguridad - BLOQUEAR localhost completamente
if (typeof window !== 'undefined' && (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1'))) {
  console.error('🚨 ERROR CRÍTICO: API_BASE_URL no puede ser localhost en producción!');
  console.error('🚨 URL actual:', API_BASE_URL);
  console.error('🚨 Usando URL de fallback segura de AWS Lambda...');
  throw new Error('Configuración de API inválida: No se permite localhost en producción');
}

// URL de fallback segura de AWS Lambda
const FALLBACK_API_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
export const SECURE_API_BASE_URL = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')
  ? FALLBACK_API_URL
  : API_BASE_URL;

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
    update: '/research/{researchId}/smart-voc/{formId}',
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
 * Cliente API simplificado y seguro
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = SECURE_API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1')) {
      console.error('🚨 ERROR CRÍTICO: ApiClient inicializado con localhost!');
      console.error('🚨 URL detectada:', this.baseUrl);
      console.error('🚨 Usando URL de fallback de AWS Lambda...');
      this.baseUrl = FALLBACK_API_URL;
    }

    // Verificar que la URL sea de AWS Lambda
    if (!this.baseUrl.includes('execute-api.us-east-1.amazonaws.com')) {
      console.warn('⚠️  ADVERTENCIA: URL no parece ser de AWS Lambda:', this.baseUrl);
    }
  }

  /**
   * Establece el token de autenticación
   */
  setAuthToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
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

    if (/\{[^\/]+\}/.test(url)) {
      throw new Error(`Parámetros no reemplazados en URL: ${url}`);
    }

    const fullUrl = url.startsWith('/') ? `${this.baseUrl}${url}` : `${this.baseUrl}/${url}`;

    if (fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1')) {
      console.error('🚨 ERROR CRÍTICO: URL construida apunta a localhost!');
      console.error('🚨 URL detectada:', fullUrl);
      throw new Error('URL de API no puede ser localhost - Solo AWS Lambda permitido');
    }

    if (!fullUrl.includes('execute-api.us-east-1.amazonaws.com')) {
      console.warn('⚠️  ADVERTENCIA: URL construida no parece ser de AWS Lambda:', fullUrl);
    }

    return fullUrl;
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

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
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
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'Error desconocido' };
      }

      throw new ApiError(
        errorData.message || `Error ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError(
        'Error al parsear respuesta JSON',
        response.status,
        null
      );
    }
  }
}

/**
 * Clase de error personalizada para la API
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
 * Función helper para obtener URL completa - SEGURA
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const fullUrl = `${SECURE_API_BASE_URL}/${cleanPath}`;

  if (fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1')) {
    console.error('🚨 ERROR CRÍTICO: getApiUrl generó URL localhost!');
    console.error('🚨 URL detectada:', fullUrl);
    return `${FALLBACK_API_URL}/${cleanPath}`;
  }

  if (!fullUrl.includes('execute-api.us-east-1.amazonaws.com')) {
    console.warn('⚠️  ADVERTENCIA: getApiUrl generó URL que no parece ser de AWS Lambda:', fullUrl);
  }

  return fullUrl;
}

/**
 * Función helper para obtener URL de WebSocket
 */
export function getWebsocketUrl(): string {
  if (WS_BASE_URL.includes('localhost') || WS_BASE_URL.includes('127.0.0.1')) {
    console.error('🚨 ERROR CRÍTICO: WebSocket URL apunta a localhost!');
    console.error('🚨 URL detectada:', WS_BASE_URL);
    return '';
  }

  return WS_BASE_URL;
}

/**
 * Función para validar que la configuración es segura
 */
export function validateApiConfiguration(): boolean {
  const isSecure = !SECURE_API_BASE_URL.includes('localhost') &&
                   !SECURE_API_BASE_URL.includes('127.0.0.1') &&
                   SECURE_API_BASE_URL.includes('execute-api.us-east-1.amazonaws.com');

  if (!isSecure) {
    console.error('🚨 ERROR CRÍTICO: Configuración API no es segura!');
    console.error('🚨 URL actual:', SECURE_API_BASE_URL);
    console.error('🚨 Debe apuntar a AWS Lambda');
    return false;
  }

  return isSecure;
}

if (typeof window !== 'undefined') {
  validateApiConfiguration();
}

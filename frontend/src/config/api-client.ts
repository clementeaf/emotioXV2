import endpointsJson from './endpoints.json';

/**
 * Tipo que representa la estructura del archivo endpoints.json
 */
export interface EndpointsConfig {
  apiUrl: string;
  websocketUrl: string;
  endpoints: Record<string, Record<string, string>>;
  _original?: any;
  _cors_enabled?: boolean;
}

/**
 * Categorías principales de endpoints
 */
export type ApiCategory = keyof typeof endpointsJson.endpoints;

/**
 * Clase para manejar los endpoints de la API dinámicamente
 */
export class ApiEndpointManager {
  private config: EndpointsConfig;
  
  constructor(config: EndpointsConfig) {
    this.config = config;
  }

  /**
   * Obtiene el endpoint completo para una categoría y operación específica
   * @param category Categoría del endpoint (auth, research, etc.)
   * @param operation Operación dentro de la categoría (get, create, etc.)
   * @param params Parámetros para reemplazar en la URL (id, researchId, etc.)
   * @returns URL completa del endpoint
   */
  public getEndpoint<T extends ApiCategory>(
    category: T, 
    operation: keyof typeof endpointsJson.endpoints[T], 
    params?: Record<string, string>
  ): string {
    // Obtener la URL base y el path específico
    const baseUrl = this.config.apiUrl;
    
    // Acceder de forma segura a los endpoints de la categoría
    const categoryEndpoints = this.config.endpoints[category as string] || {};
    const path = categoryEndpoints[operation as string];
    
    if (!path) {
      throw new Error(`Endpoint no encontrado: ${category}.${String(operation)}`);
    }
    
    // Si hay parámetros, reemplazarlos en la URL
    let endpoint = path;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(`{${key}}`, value);
      });
    }
    
    // Si el endpoint es una URL completa, usarla directamente
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Si el endpoint comienza con /, es relativo a la base
    return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  }
  
  /**
   * Obtiene todos los endpoints de una categoría
   * @param category Categoría del endpoint
   * @returns Objeto con todos los endpoints de la categoría
   */
  public getCategory<T extends ApiCategory>(category: T): Record<string, string> {
    return this.config.endpoints[category as string] || {};
  }
  
  /**
   * Obtiene la URL base de la API
   */
  public getBaseUrl(): string {
    return this.config.apiUrl;
  }
  
  /**
   * Obtiene la URL de WebSocket
   */
  public getWebSocketUrl(): string {
    return this.config.websocketUrl;
  }
}

/**
 * Cliente para realizar peticiones a la API
 */
export class ApiClient {
  private endpointManager: ApiEndpointManager;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  constructor(endpointManager: ApiEndpointManager) {
    this.endpointManager = endpointManager;
  }
  
  /**
   * Establece un token de autenticación para todas las peticiones
   * @param token Token de autenticación
   */
  public setAuthToken(token: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`
    };
  }
  
  /**
   * Limpia el token de autenticación
   */
  public clearAuthToken(): void {
    const headers = { ...this.defaultHeaders };
    delete headers['Authorization'];
    this.defaultHeaders = headers;
  }
  
  /**
   * Realiza una petición GET a un endpoint
   * @param category Categoría del endpoint
   * @param operation Operación dentro de la categoría
   * @param params Parámetros para reemplazar en la URL
   * @param queryParams Parámetros de consulta adicionales
   * @returns Respuesta de la petición
   */
  public async get<T, P extends ApiCategory>(
    category: P,
    operation: keyof typeof endpointsJson.endpoints[P],
    params?: Record<string, string>,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(
      this.endpointManager.getEndpoint(category, operation, params),
      queryParams
    );
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.defaultHeaders
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Realiza una petición POST a un endpoint
   * @param category Categoría del endpoint
   * @param operation Operación dentro de la categoría
   * @param data Datos a enviar en el cuerpo de la petición
   * @param params Parámetros para reemplazar en la URL
   * @returns Respuesta de la petición
   */
  public async post<T, D, P extends ApiCategory>(
    category: P,
    operation: keyof typeof endpointsJson.endpoints[P],
    data: D,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.endpointManager.getEndpoint(category, operation, params);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data)
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Realiza una petición PUT a un endpoint
   * @param category Categoría del endpoint
   * @param operation Operación dentro de la categoría
   * @param data Datos a enviar en el cuerpo de la petición
   * @param params Parámetros para reemplazar en la URL
   * @returns Respuesta de la petición
   */
  public async put<T, D, P extends ApiCategory>(
    category: P,
    operation: keyof typeof endpointsJson.endpoints[P],
    data: D,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.endpointManager.getEndpoint(category, operation, params);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.defaultHeaders,
      body: JSON.stringify(data)
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Realiza una petición DELETE a un endpoint
   * @param category Categoría del endpoint
   * @param operation Operación dentro de la categoría
   * @param params Parámetros para reemplazar en la URL
   * @returns Respuesta de la petición
   */
  public async delete<T, P extends ApiCategory>(
    category: P,
    operation: keyof typeof endpointsJson.endpoints[P],
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.endpointManager.getEndpoint(category, operation, params);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.defaultHeaders
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Construye una URL con parámetros de consulta
   * @param baseUrl URL base
   * @param params Parámetros de consulta
   * @returns URL completa
   */
  private buildUrl(baseUrl: string, params?: Record<string, string>): string {
    if (!params) return baseUrl;
    
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return url.toString();
  }
  
  /**
   * Maneja la respuesta de la petición
   * @param response Respuesta de fetch
   * @returns Datos parseados de la respuesta
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        response.statusText,
        response.status,
        errorData
      );
    }
    
    // Si la respuesta está vacía, devolver un objeto vacío
    if (response.status === 204) {
      return {} as T;
    }
    
    // Intentar parsear la respuesta como JSON
    try {
      return await response.json();
    } catch (error) {
      console.error('Error al parsear respuesta JSON:', error);
      throw new ApiError(
        'Error al parsear respuesta',
        response.status,
        null
      );
    }
  }
}

/**
 * Error personalizado para peticiones a la API
 */
export class ApiError extends Error {
  public statusCode: number;
  public data: any;
  
  constructor(message: string, statusCode: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Crear instancias singleton
export const apiEndpoints = new ApiEndpointManager(endpointsJson as EndpointsConfig);
export const apiClient = new ApiClient(apiEndpoints);

export default apiClient; 
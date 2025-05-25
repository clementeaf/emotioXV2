import { API_HTTP_ENDPOINT, API_WEBSOCKET_ENDPOINT } from '@/api/endpoints';
// Eliminar la importación de endpoints.json
// import endpointsJson from './endpoints.json';

// Importar API_CONFIG para acceder a la estructura de endpoints
import API_CONFIG from './api.config'; 

/**
 * Tipo que representa la estructura de configuración de endpoints (simplificado)
 */
// Ya no necesitamos EndpointsConfig basada en endpoints.json
// export interface EndpointsConfig { ... }

/**
 * Categorías principales de endpoints, ahora inferidas de API_CONFIG
 */
export type ApiCategory = keyof typeof API_CONFIG.endpoints;

/**
 * Mapeo de alias para endpoints que pueden tener diferentes nombres
 */
const endpointAliases: Record<string, string> = {
  'cognitiveTask.getByResearch': 'cognitiveTask.GET_BY_RESEARCH',
  'cognitiveTask.get': 'cognitiveTask.GET',
  'cognitiveTask.create': 'cognitiveTask.CREATE',
  'cognitiveTask.update': 'cognitiveTask.UPDATE',
  'cognitiveTask.delete': 'cognitiveTask.DELETE',
  // Mantener alias para welcomeScreen si se usan en el servicio
  'welcomeScreen.getByResearch': 'welcomeScreen.GET_BY_RESEARCH',
  'welcomeScreen.get': 'welcomeScreen.GET',
  'welcomeScreen.create': 'welcomeScreen.CREATE',
  'welcomeScreen.update': 'welcomeScreen.UPDATE',
  'welcomeScreen.delete': 'welcomeScreen.DELETE',
};

/**
 * Clase para manejar los endpoints de la API dinámicamente usando API_CONFIG
 */
export class ApiEndpointManager {
  // Ya no necesita el config de endpoints.json
  // private config: EndpointsConfig;
  
  // constructor(config: EndpointsConfig) {
  //   this.config = config;
  // }
  constructor() {}

  /**
   * Obtiene el endpoint completo para una categoría y operación específica
   * @param category Categoría del endpoint (auth, research, etc.)
   * @param operation Operación dentro de la categoría (get, create, etc.)
   * @param params Parámetros para reemplazar en la URL (id, researchId, etc.)
   * @returns URL completa del endpoint
   */
  public getEndpoint<T extends ApiCategory>(
    category: T, 
    operation: keyof typeof API_CONFIG.endpoints[T], 
    params?: Record<string, string>
  ): string {
    // Usar API_CONFIG directamente
    const baseUrl = API_HTTP_ENDPOINT; // Usar la URL correcta importada
    
    // Usar alias si existen
    const endpointKey = `${category}.${String(operation)}`;
    const aliasKey = endpointAliases[endpointKey];
    let actualCategory = category;
    let actualOperation = operation;
    if (aliasKey) {
      const [aliasCategory, aliasOp] = aliasKey.split('.');
      actualCategory = aliasCategory as T;
      actualOperation = aliasOp as any;
    }
    
    // Acceder al path desde API_CONFIG
    const categoryEndpoints = API_CONFIG.endpoints[actualCategory];
    let path = categoryEndpoints ? (categoryEndpoints as any)[actualOperation as string] : undefined;

    if (!path) {
      // Intentar construir dinámicamente si falta (mantener lógica si es útil)
      if (String(category) === 'cognitiveTask') { // Ejemplo
         // ... (lógica de construcción dinámica para cognitiveTask) ...
          if (String(operation) === 'getByResearch') {
            path = `/research/{researchId}/cognitive-task`;
          } else if (String(operation) === 'createOrUpdate') {
            path = `/research/{researchId}/cognitive-task`;
          } else {
             // Podrías tener una convención general, ej: /<category>/<operation>/{id}?
             // O simplemente lanzar el error:
            throw new Error(`Endpoint no encontrado y sin lógica dinámica: ${category}.${String(operation)}`);
          }
      } else {
        // Lanzar error si no se encuentra y no hay lógica dinámica
        throw new Error(`Endpoint no encontrado en API_CONFIG: ${category}.${String(operation)}`);
      }
    }
    
    // Reemplazar parámetros en el path
    let endpoint = path;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(`{${key}}`, String(value)); // Asegurar que value sea string
      });
    }
    
    // Comprobar si todavía hay parámetros sin reemplazar (error)
    if (/\{[^\/]+\}/.test(endpoint)) {
        console.error(`Error: Parámetros no reemplazados en la URL final: ${endpoint}. Params recibidos:`, params);
        throw new Error(`Error al construir la URL: Faltan parámetros para reemplazar en ${path}`);
    }

    // Devolver URL completa
    return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  }
  
  // ... (getCategory - podría necesitar ajuste si se usa) ...
  // public getCategory<T extends ApiCategory>(category: T): Record<string, string> {
  //   return API_CONFIG.endpoints[category as string] || {};
  // }
  
  /**
   * Obtiene la URL base de la API
   */
  public getBaseUrl(): string {
    return API_HTTP_ENDPOINT;
  }
  
  /**
   * Obtiene la URL de WebSocket
   */
  public getWebsocketUrl(): string {
    return API_WEBSOCKET_ENDPOINT;
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
  
  // El constructor ahora solo necesita crear una instancia de ApiEndpointManager
  constructor() {
    this.endpointManager = new ApiEndpointManager();
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
   * Asegura que el token esté establecido en las cabeceras
   * Esta función se llamará antes de cada petición
   */
  private ensureAuthToken(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    if (!this.defaultHeaders['Authorization']) {
      const storageType = localStorage.getItem('auth_storage_type') || 'local';
      const token = storageType === 'local'
        ? localStorage.getItem('token')
        : sessionStorage.getItem('token');
      
      if (token) {
        this.setAuthToken(token);
      } else {
        // Lanzar error si no hay token
        throw new Error('No autenticado: No se encontró token de autorización');
      }
    }
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
    operation: keyof typeof API_CONFIG.endpoints[P], // Usar API_CONFIG para el tipo
    params?: Record<string, string>,
    queryParams?: Record<string, string>
  ): Promise<T> {
    this.ensureAuthToken();
    const url = this.buildUrl(
      this.endpointManager.getEndpoint(category, operation, params),
      queryParams
    );
    console.log(`[API-CLIENT] GET ${url}`); // Log para depurar URL
    
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
    operation: keyof typeof API_CONFIG.endpoints[P], // Usar API_CONFIG para el tipo
    data: D,
    params?: Record<string, string>
  ): Promise<T> {
    this.ensureAuthToken();
    const url = this.endpointManager.getEndpoint(category, operation, params);
    console.log(`[API-CLIENT] POST ${url}`); // Log para depurar URL
    
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
    operation: keyof typeof API_CONFIG.endpoints[P], // Usar API_CONFIG para el tipo
    data: D,
    params?: Record<string, string>
  ): Promise<T> {
    this.ensureAuthToken();
    const url = this.endpointManager.getEndpoint(category, operation, params);
    console.log(`[API-CLIENT] PUT ${url}`); // Log para depurar URL
    
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
   * @returns Respuesta de la petición (puede ser void o T dependiendo del handleResponse)
   */
  public async delete<T, P extends ApiCategory>(
    category: P,
    operation: keyof typeof API_CONFIG.endpoints[P], // Usar API_CONFIG para el tipo
    params?: Record<string, string>
  ): Promise<T> {
    this.ensureAuthToken();
    const url = this.endpointManager.getEndpoint(category, operation, params);
    console.log(`[API-CLIENT] DELETE ${url}`); // Log para depurar URL
    
    // Preparar headers, eliminando Content-Type si no hay body
    const headers = { ...this.defaultHeaders };
    delete headers['Content-Type'];

    const response = await fetch(url, {
      method: 'DELETE',
      headers: headers
    });
    
    // DELETE exitoso a menudo retorna 204 No Content, handleResponse debe manejarlo
    return this.handleResponse<T>(response);
  }

  /**
   * Construye la URL completa incluyendo query parameters
   */
  private buildUrl(baseUrl: string, params?: Record<string, string>): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) { // Solo añadir si tiene valor
        url.searchParams.append(key, String(value));
      }
    });
    return url.toString();
  }
  
  /**
   * Maneja la respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) { // Manejar No Content para DELETE
      return undefined as T; // O null, o un objeto vacío según se necesite
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      // Si no es JSON válido, podría ser un error de texto plano
      const text = await response.text().catch(() => 'Respuesta no válida');
      if (!response.ok) {
        console.error(`[API-CLIENT] Error ${response.status}, Respuesta texto: ${text}`);
        throw new ApiError(text || `Error ${response.status}`, response.status, text);
      }
      // Si es OK pero no JSON (raro para API REST), devolver texto
      console.warn('[API-CLIENT] Respuesta OK pero no es JSON:', text);
      return text as unknown as T;
    }
    
    if (!response.ok) {
      console.error(`[API-CLIENT] Error ${response.status}, Respuesta JSON:`, data);
      // Usar mensaje de error del backend si existe
      const message = data?.message || data?.error || `Error ${response.status}`;
      throw new ApiError(message, response.status, data);
    }
    
    // Devolver siempre el objeto JSON completo recibido
    return data;
    // return data.data || data; // Eliminar la lógica que desenvuelve .data
  }
}

/**
 * Clase de Error personalizada para errores de API
 */
export class ApiError extends Error {
  public statusCode: number;
  public data: any;

  constructor(message: string, statusCode: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Crear una instancia única del EndpointManager y del ApiClient
// Ya no necesitamos pasarle el config de endpoints.json
export const apiClient = new ApiClient(); 
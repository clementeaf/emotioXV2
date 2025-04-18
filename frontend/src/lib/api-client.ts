import { getAuthHeaders } from './auth-headers';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers();
    
    // Agregar Content-Type por defecto
    headers.append('Content-Type', 'application/json');
    
    // Agregar headers de autenticación si existen
    const authHeaders = getAuthHeaders();
    
    if (authHeaders.Authorization) {
      headers.append('Authorization', authHeaders.Authorization);
      console.log('[ApiClient] Usando token de autenticación desde getAuthHeaders');
    } else {
      // Intentar recuperar el token directamente como último recurso
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
        console.log('[ApiClient] Usando token recuperado directamente del storage');
      } else {
        console.warn('[ApiClient] No se encontró token de autenticación para la petición a:', url);
      }
    }

    try {
      console.log(`[ApiClient] Enviando petición a ${url}`, {
        method: options.method || 'GET',
        headersPresent: Array.from(headers.keys()),
        hasAuthHeader: headers.has('Authorization')
      });
      
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        console.error(`[ApiClient] Error HTTP ${response.status} en petición a ${url}`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ApiClient] Error en petición API:', error);
      throw error;
    }
  }

  public get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  public post<T>(path: string, data: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public put<T>(path: string, data: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }
} 
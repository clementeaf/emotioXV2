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
    } else {
      // Intentar recuperar el token directamente como último recurso
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        // Manejo especial para 404
        if (response.status === 404) {
          // Intentar leer el cuerpo por si hay un mensaje, pero devolver null
          try {
            await response.json();
          } catch (jsonError) {
            // Ignorar si el cuerpo del 404 no es JSON válido
          }
          return null as T; // Devolver null para indicar que no se encontró
        }

        // Manejo especial para errores 500 de DELETE (problemas de backend)
        if (response.status === 500 && options.method === 'DELETE') {
          let errorBodyText = '';
          try {
            errorBodyText = await response.text();
          } catch (textError) { /* ignorar */ }

          // Para DELETE, asumimos que la operación "falló pero no es crítica"
          return { error: true, status: 500, message: errorBodyText } as T;
        }

        // Para otros errores (!response.ok y no 404), lanzar el error
        let errorBodyText = '';
        try {
          errorBodyText = await response.text();
        } catch (textError) { /* ignorar */ }
        throw new Error(`HTTP error! status: ${response.status}. Body: ${errorBodyText}`);
      }

      // Para respuestas 204 No Content (como DELETE), no intentar parsear JSON
      if (response.status === 204) {
        return undefined as T;
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

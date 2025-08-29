/**
 * Cliente API usando AlovaJS
 * Reemplaza el ApiClient basado en fetch con AlovaJS
 */

import { alovaInstance } from './alova.config';
import { API_ENDPOINTS } from './api';

/**
 * Cliente API simplificado usando Alova
 */
export class AlovaApiClient {
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
    
    return url;
  }
  
  /**
   * Obtiene el endpoint completo
   */
  getEndpoint(
    category: string,
    operation: string,
    params?: Record<string, string>
  ): string {
    const categoryEndpoints = (API_ENDPOINTS as any)[category];
    if (!categoryEndpoints) {
      throw new Error(`Categoría de API no encontrada: ${category}. Categorías disponibles: ${Object.keys(API_ENDPOINTS).join(', ')}`);
    }
    
    const endpoint = categoryEndpoints[operation] as string;
    if (!endpoint) {
      throw new Error(`Operación '${operation}' no encontrada en categoría '${category}'. Operaciones disponibles: ${Object.keys(categoryEndpoints).join(', ')}`);
    }
    
    return this.buildUrl(endpoint, params);
  }
  
  /**
   * Realiza una petición GET usando Alova
   */
  async get<T = any>(
    category: string,
    operation: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);
    
    const method = alovaInstance.Get<T>(url, {
      params: queryParams,
      cacheFor: 1000 * 60 * 5, // Cache por 5 minutos
    });
    
    return method.send();
  }
  
  /**
   * Realiza una petición POST usando Alova
   */
  async post<T = any>(
    category: string,
    operation: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);
    
    const method = alovaInstance.Post<T>(url, data, {
      cacheFor: 0, // No cachear POST
    });
    
    return method.send();
  }
  
  /**
   * Realiza una petición PUT usando Alova
   */
  async put<T = any>(
    category: string,
    operation: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);
    
    const method = alovaInstance.Put<T>(url, data, {
      cacheFor: 0, // No cachear PUT
    });
    
    return method.send();
  }
  
  /**
   * Realiza una petición DELETE usando Alova
   */
  async delete<T = any>(
    category: string,
    operation: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.getEndpoint(category, operation, params);
    
    const method = alovaInstance.Delete<T>(url, undefined, {
      cacheFor: 0, // No cachear DELETE
    });
    
    return method.send();
  }
  
  /**
   * Establece el token de autenticación
   */
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }
  
  /**
   * Limpia el token de autenticación
   */
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
}

/**
 * Instancia global del cliente API con Alova
 */
export const alovaApiClient = new AlovaApiClient();

/**
 * Función helper para invalidar caché de endpoints específicos
 */
export const invalidateApiCache = (category?: string, operation?: string) => {
  if (category && operation) {
    const endpoints = (API_ENDPOINTS as any)[category];
    if (endpoints && endpoints[operation]) {
      const endpoint = endpoints[operation];
      alovaInstance.snapshots.match(new RegExp(endpoint.replace(/\{[^}]+\}/g, '.*'))).forEach(method => {
        method.abort();
      });
    }
  } else if (category) {
    // Invalidar toda la categoría
    const endpoints = (API_ENDPOINTS as any)[category];
    if (endpoints) {
      Object.values(endpoints).forEach((endpoint: any) => {
        alovaInstance.snapshots.match(new RegExp(endpoint.replace(/\{[^}]+\}/g, '.*'))).forEach(method => {
          method.abort();
        });
      });
    }
  } else {
    // Invalidar toda la caché
    alovaInstance.snapshots.clear();
  }
};

export default alovaApiClient;
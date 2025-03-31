/**
 * Integración del debugger de API con la clase ApiClient
 */
import { apiClient } from '../../config/api-client';
import { debugFetch } from './apiDebugger';

// Función para parchear los métodos HTTP de apiClient
export const patchApiClientWithDebugger = () => {
  // Guardar las implementaciones originales
  const originalPost = apiClient.post.bind(apiClient);
  const originalPut = apiClient.put.bind(apiClient);
  const originalGet = apiClient.get.bind(apiClient);
  const originalDelete = apiClient.delete.bind(apiClient);
  
  // Sobreescribir el método POST
  apiClient.post = async function<T, D, P>(category: P, operation: any, data: D, params?: Record<string, string>): Promise<T> {
    console.log('🔍 [API-DEBUG] Interceptando POST a categoria:', category, 'operación:', operation);
    
    try {
      // Obtener la URL usando la implementación interna
      // @ts-ignore
      const url = this.endpointManager.getEndpoint(category, operation, params);
      
      // Opciones para fetch
      const options: RequestInit = {
        method: 'POST',
        // @ts-ignore
        headers: this.defaultHeaders,
        body: JSON.stringify(data)
      };
      
      // Usar nuestro debugFetch en lugar del fetch normal
      const response = await debugFetch(url, options);
      
      // Usar el método de manejo de respuesta original
      // @ts-ignore
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('🔍 [API-DEBUG] Error en POST interceptado:', error);
      throw error;
    }
  };
  
  // Sobreescribir el método PUT
  apiClient.put = async function<T, D, P>(category: P, operation: any, data: D, params?: Record<string, string>): Promise<T> {
    console.log('🔍 [API-DEBUG] Interceptando PUT a categoria:', category, 'operación:', operation);
    
    try {
      // @ts-ignore
      const url = this.endpointManager.getEndpoint(category, operation, params);
      
      const options: RequestInit = {
        method: 'PUT',
        // @ts-ignore
        headers: this.defaultHeaders,
        body: JSON.stringify(data)
      };
      
      const response = await debugFetch(url, options);
      
      // @ts-ignore
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('🔍 [API-DEBUG] Error en PUT interceptado:', error);
      throw error;
    }
  };
  
  // También podríamos parchear GET y DELETE de manera similar si es necesario
  
  // Devolver funciones para restaurar métodos originales si es necesario
  return {
    restoreOriginalMethods: () => {
      apiClient.post = originalPost;
      apiClient.put = originalPut;
      apiClient.get = originalGet;
      apiClient.delete = originalDelete;
    }
  };
}; 
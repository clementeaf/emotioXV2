/**
 * Integración del debugger de API con la clase ApiClient
 */
import { apiClient } from '../../config/api';

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
    console.log('🔍 [API-DEBUG] Datos:', data);

    try {
      // Usar la implementación original pero con logging adicional
      const result = await originalPost(category as string, operation, data, params);
      console.log('🔍 [API-DEBUG] POST exitoso:', result);
      return result;
    } catch (error) {
      console.error('🔍 [API-DEBUG] Error en POST interceptado:', error);
      throw error;
    }
  };

  // Sobreescribir el método PUT
  apiClient.put = async function<T, D, P>(category: P, operation: any, data: D, params?: Record<string, string>): Promise<T> {
    console.log('🔍 [API-DEBUG] Interceptando PUT a categoria:', category, 'operación:', operation);
    console.log('🔍 [API-DEBUG] Datos:', data);

    try {
      // Usar la implementación original pero con logging adicional
      const result = await originalPut(category as string, operation, data, params);
      console.log('🔍 [API-DEBUG] PUT exitoso:', result);
      return result;
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

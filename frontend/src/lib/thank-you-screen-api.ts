/**
 * API específica para ThankYouScreen
 * Implementación actualizada con manejo mejorado de errores y URL
 */

import API_CONFIG from '@/config/api.config';

// Función auxiliar para obtener el token correctamente desde localStorage o sessionStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    // Verificar el tipo de almacenamiento utilizado (localStorage o sessionStorage)
    const storageType = localStorage.getItem('auth_storage_type') || 'local';
    
    // Obtener token del almacenamiento correspondiente
    const token = storageType === 'local'
      ? localStorage.getItem('token') || ''
      : sessionStorage.getItem('token') || '';
    
    return token;
  }
  return '';
};

/**
 * Manejador de respuesta personalizado para ThankYouScreen
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleThankYouScreenResponse = async (response: Response) => {
  console.log(`[ThankYouScreenAPI] Respuesta recibida: ${response.status} ${response.statusText}`);
  
  // Ya no lanzamos error para 404 aquí, porque lo manejamos en getByResearchId
  // Intentar obtener el cuerpo como JSON
  try {
    const data = await response.json();
    if (!response.ok) {
      console.error(`[ThankYouScreenAPI] Error ${response.status}: `, data);
      throw new Error(data.message || data.error || `Error ${response.status}: ${response.statusText}`);
    }
    return data;
  } catch (error) {
    // Si no es JSON o hay otro error
    const text = await response.text().catch(() => 'No se pudo obtener el cuerpo de la respuesta');
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    return text;
  }
};

// Preparar los encabezados con el token de autenticación
const getAuthHeaders = () => {
  const token = getToken();
  // Log del token parcial para depuración (seguridad)
  const tokenSummary = token 
    ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}`
    : 'no hay token';
  
  console.log(`[ThankYouScreenAPI] Usando token: ${tokenSummary}`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * API mejorada para ThankYouScreen
 * Utiliza endpoints actualizados y manejo de errores mejorado
 */
export const thankYouScreenFixedAPI = {
  /**
   * Obtiene un ThankYouScreen por su ID
   * @param id ID del ThankYouScreen
   * @returns Objeto con método send
   */
  getById: (id: string) => {
    if (!id) {
      throw new Error('Se requiere un ID para obtener el ThankYouScreen');
    }
    
    const url = API_CONFIG.endpoints.thankYouScreen?.GET?.replace('{id}', id) || `/thank-you-screen/${id}`;
    console.log(`[ThankYouScreenAPI] Obteniendo ThankYouScreen con ID ${id}, URL: ${url}`);
    console.log(`[ThankYouScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'GET',
          headers
        });
        
        return handleThankYouScreenResponse(response);
      }
    };
  },
  
  /**
   * Obtiene el ThankYouScreen asociado a una investigación
   * @param researchId ID de la investigación
   * @returns Objeto con método send
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    
    // La ruta correcta según el controlador en el backend es:
    // /research/:researchId/thank-you-screen
    const url = `/thank-you-screen/research/${researchId}/thank-you-screen`;
    console.log(`[ThankYouScreenAPI] Obteniendo ThankYouScreen para investigación ${researchId}, URL: ${url}`);
    console.log(`[ThankYouScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        try {
          // Creamos una versión personalizada de fetch que no registra errores 404 en la consola
          const silentFetch = async (url: string, options: RequestInit) => {
            try {
              const controller = new AbortController();
              const { signal } = controller;
              
              // Primero intentamos una solicitud HEAD para verificar si el recurso existe
              const checkResponse = await fetch(url, { 
                method: 'HEAD', 
                headers: options.headers,
                signal 
              });
              
              // Si es 404, manejamos sin lanzar error
              if (checkResponse.status === 404) {
                console.log(`[ThankYouScreenAPI] Verificación previa: Recurso no encontrado (404) en ${url}`);
                console.log('[ThankYouScreenAPI] No se encontró configuración de ThankYouScreen para esta investigación - esto es normal para nuevas investigaciones');
                return { notFound: true, data: null };
              }
              
              // Si no es 404, procedemos con la solicitud original
              return fetch(url, options);
            } catch (error) {
              console.log('[ThankYouScreenAPI] Error en silentFetch:', error);
              throw error;
            }
          };
          
          const headers = getAuthHeaders();
          
          // Usar nuestro fetch personalizado
          const response = await silentFetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'GET',
            headers
          });
          
          // Si ya detectamos un 404 en silentFetch y obtuvimos un objeto con notFound: true
          if ('notFound' in response && response.notFound) {
            return response;
          }
          
          // Para respuestas reales de fetch, usar el manejador normal
          return handleThankYouScreenResponse(response as Response);
        } catch (error) {
          console.log('[ThankYouScreenAPI] Error al obtener ThankYouScreen por researchId:', error);
          throw error;
        }
      }
    };
  },
  
  /**
   * Crea un nuevo ThankYouScreen
   * @param data Datos del ThankYouScreen
   * @returns Objeto con método send
   */
  create: (data: any) => {
    if (!data || !data.researchId) {
      throw new Error('Se requieren datos y un ID de investigación para crear el ThankYouScreen');
    }
    
    const url = API_CONFIG.endpoints.thankYouScreen?.CREATE || '/thank-you-screen';
    console.log(`[ThankYouScreenAPI] Creando ThankYouScreen para investigación ${data.researchId}, URL: ${url}`);
    console.log(`[ThankYouScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('[ThankYouScreenAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...data,
            researchId: data.researchId.trim()
          })
        });
        
        return handleThankYouScreenResponse(response);
      }
    };
  },
  
  /**
   * Actualiza un ThankYouScreen existente
   * @param id ID del ThankYouScreen
   * @param data Datos actualizados
   * @returns Objeto con método send
   */
  update: (id: string, data: any) => {
    if (!id) {
      throw new Error('Se requiere un ID para actualizar el ThankYouScreen');
    }
    
    if (!data) {
      throw new Error('Se requieren datos para actualizar el ThankYouScreen');
    }
    
    const url = (API_CONFIG.endpoints.thankYouScreen?.UPDATE || '/thank-you-screen/{id}').replace('{id}', id);
    console.log(`[ThankYouScreenAPI] Actualizando ThankYouScreen con ID ${id}, URL: ${url}`);
    console.log(`[ThankYouScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('[ThankYouScreenAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        });
        
        return handleThankYouScreenResponse(response);
      }
    };
  },
  
  /**
   * Elimina un ThankYouScreen existente
   * @param id ID del ThankYouScreen
   * @returns Objeto con método send
   */
  delete: (id: string) => {
    if (!id) {
      throw new Error('Se requiere un ID para eliminar el ThankYouScreen');
    }
    
    const url = (API_CONFIG.endpoints.thankYouScreen?.DELETE || '/thank-you-screen/{id}').replace('{id}', id);
    console.log(`[ThankYouScreenAPI] Eliminando ThankYouScreen con ID ${id}, URL: ${url}`);
    console.log(`[ThankYouScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'DELETE',
          headers
        });
        
        return handleThankYouScreenResponse(response);
      }
    };
  }
}; 
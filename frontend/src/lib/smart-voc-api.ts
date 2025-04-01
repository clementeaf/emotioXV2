/**
 * API para SmartVOC
 * Manejar solicitudes de manera similar a las otras APIs que funcionan bien
 */

import API_CONFIG from '@/config/api.config';

// Preparar los encabezados con el token de autenticación
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (typeof window !== 'undefined') {
    const storageType = localStorage.getItem('auth_storage_type') || 'local';
    const token = storageType === 'local'
      ? localStorage.getItem('token') || ''
      : sessionStorage.getItem('token') || '';
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

/**
 * Manejador de respuesta personalizado para SmartVOC
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleSmartVOCResponse = async (response: Response) => {
  // Para respuestas 404 en getByResearchId, no lanzamos error sino que manejamos especialmente
  
  try {
    const data = await response.json();
    if (!response.ok) {
      console.warn(`[SmartVOCAPI] Respuesta no exitosa: ${response.status}`, data);
      
      // Caso especial para 404 - Simplemente retornar un objeto con notFound=true
      if (response.status === 404) {
        return { 
          notFound: true, 
          data: null,
          status: 404
        };
      }
      
      return { 
        error: true, 
        status: response.status, 
        message: data.message || data.error || response.statusText,
        data: null
      };
    }
    return data;
  } catch (error) {
    // Si no es JSON, intentar obtener como texto
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      console.warn(`[SmartVOCAPI] Error no-JSON: ${response.status}`);
      
      // Caso especial para 404 - Simplemente retornar un objeto con notFound=true
      if (response.status === 404) {
        return { 
          notFound: true, 
          data: null,
          status: 404
        };
      }
      
      return { 
        error: true, 
        status: response.status, 
        message: text || response.statusText,
        data: null
      };
    }
    return text || {};
  }
};

// Función simple para normalizar URLs
const normalizeUrl = (base: string, path: string): string => {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

// API Cliente - usando el enfoque de las APIs que funcionan correctamente
export const smartVocAPI = {
  /**
   * Obtiene un Smart VOC por ID
   * @param id ID del SmartVOC
   */
  getById: (id: string) => {
    if (!id) {
      console.warn('[SmartVOCAPI] Se requiere un ID para obtener el Smart VOC');
      return {
        send: async () => ({ error: true, message: 'ID no proporcionado', data: null })
      };
    }
    
    const url = API_CONFIG.endpoints.smartVoc?.GET?.replace('{id}', id) || `/${id}`;
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/smart-voc${url}`);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(fullUrl, { 
            method: 'GET', 
            headers 
          });
          
          return handleSmartVOCResponse(response);
        } catch (error) {
          // Capturar cualquier error de red sin mostrarlo como error
          console.warn('[SmartVOCAPI] Error de red controlado');
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Obtiene el Smart VOC asociado a una investigación
   * @param researchId ID de la investigación
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      console.warn('[SmartVOCAPI] Se requiere un ID de investigación');
      return {
        send: async () => ({ error: true, message: 'ID de investigación no proporcionado', data: null })
      };
    }
    
    // La URL correcta según la implementación del backend es /research/:researchId/smart-voc
    // Con nuestra solución adicional en index.ts, ahora esta ruta debería funcionar
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${researchId}/smart-voc`);
    console.log(`[SmartVOCAPI] Solicitando SmartVOC para investigación: ${researchId}`, { url: fullUrl });
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(fullUrl, { 
            method: 'GET', 
            headers 
          });
          
          return handleSmartVOCResponse(response);
        } catch (error) {
          // Capturar cualquier error de red sin mostrarlo como error
          console.warn('[SmartVOCAPI] Error de red controlado:', error);
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Crea un nuevo Smart VOC
   * @param data Datos del Smart VOC
   */
  create: (data: any) => {
    if (!data || !data.researchId) {
      console.warn('[SmartVOCAPI] Se requieren datos y un ID de investigación');
      return {
        send: async () => ({ 
          error: true, 
          message: 'Datos o ID de investigación no proporcionados', 
          data: null 
        })
      };
    }
    
    // La URL correcta según la implementación del backend es /research/:researchId/smart-voc
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${data.researchId}/smart-voc`);
    console.log(`[SmartVOCAPI] Creando SmartVOC para investigación: ${data.researchId}`, { url: fullUrl });
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(fullUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...data,
              researchId: data.researchId.trim()
            })
          });
          
          return handleSmartVOCResponse(response);
        } catch (error) {
          // Capturar cualquier error de red sin mostrarlo como error
          console.warn('[SmartVOCAPI] Error de red controlado');
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Actualiza un Smart VOC existente
   * @param id ID del Smart VOC
   * @param data Datos actualizados
   */
  update: (id: string, data: any) => {
    if (!id) {
      console.warn('[SmartVOCAPI] Se requiere un ID para actualizar');
      return {
        send: async () => ({ error: true, message: 'ID no proporcionado', data: null })
      };
    }
    
    if (!data || !data.researchId) {
      console.warn('[SmartVOCAPI] Se requieren datos y un ID de investigación para actualizar');
      return {
        send: async () => ({ error: true, message: 'Datos o ID de investigación no proporcionados', data: null })
      };
    }
    
    // La URL correcta según la implementación del backend es /research/:researchId/smart-voc
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${data.researchId}/smart-voc`);
    console.log(`[SmartVOCAPI] Actualizando SmartVOC para investigación: ${data.researchId}`, { url: fullUrl });
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(fullUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
          });
          
          return handleSmartVOCResponse(response);
        } catch (error) {
          // Capturar cualquier error de red sin mostrarlo como error
          console.warn('[SmartVOCAPI] Error de red controlado');
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Crea o actualiza automáticamente un Smart VOC para una investigación
   * @param researchId ID de la investigación
   * @param data Datos del formulario SmartVOC
   * @returns Resultado de la operación
   */
  createOrUpdateByResearchId: (researchId: string, data: any) => {
    if (!researchId) {
      console.warn('[SmartVOCAPI] Se requiere un ID de investigación');
      return {
        send: async () => ({ error: true, message: 'ID de investigación no proporcionado', data: null })
      };
    }
    
    if (!data) {
      console.warn('[SmartVOCAPI] Se requieren datos para crear o actualizar');
      return {
        send: async () => ({ error: true, message: 'Datos no proporcionados', data: null })
      };
    }
    
    // URL para operaciones con research ID
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${researchId}/smart-voc`);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          // Primero verificamos si existe un formulario para esta investigación
          console.log(`[SmartVOCAPI] Verificando existencia de SmartVOC para investigación: ${researchId}`);
          const checkResponse = await fetch(fullUrl, { 
            method: 'GET', 
            headers 
          });
          
          const checkResult = await handleSmartVOCResponse(checkResponse);
          
          // Determinar si debemos usar POST o PUT
          let method = 'POST';
          
          if (checkResult && !checkResult.notFound && !checkResult.error && checkResult.data) {
            // Si encontramos datos existentes, usamos PUT para actualizar
            method = 'PUT';
            console.log(`[SmartVOCAPI] Se encontró formulario existente, usando ${method} para actualizar`);
          } else {
            // Si no hay datos o hubo un error 404, usamos POST para crear nuevo
            console.log(`[SmartVOCAPI] No se encontró formulario existente, usando ${method} para crear nuevo`);
          }
          
          // Ahora realizamos la operación de crear o actualizar
          const response = await fetch(fullUrl, {
            method,
            headers,
            body: JSON.stringify({
              ...data,
              researchId
            })
          });
          
          const result = await handleSmartVOCResponse(response);
          console.log(`[SmartVOCAPI] Resultado de ${method} para SmartVOC:`, result);
          return result;
        } catch (error) {
          // Capturar cualquier error de red sin mostrarlo como error
          console.warn('[SmartVOCAPI] Error de red controlado en createOrUpdateByResearchId:', error);
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  }
};

// Mantener retrocompatibilidad con el nombre antiguo
export const smartVocFixedAPI = smartVocAPI;
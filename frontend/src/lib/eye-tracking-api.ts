/**
 * API específica para EyeTracking
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
 * Manejador de respuesta personalizado para EyeTracking
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleEyeTrackingResponse = async (response: Response) => {
  console.log(`[EyeTrackingAPI] Respuesta recibida: ${response.status} ${response.statusText}`);
  
  // Ya no lanzamos error para 404 aquí, porque lo manejamos en getByResearchId
  // Intentar obtener el cuerpo como JSON
  try {
    const data = await response.json();
    if (!response.ok) {
      console.error(`[EyeTrackingAPI] Error ${response.status}: `, data);
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
  
  console.log(`[EyeTrackingAPI] Usando token: ${tokenSummary}`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * API mejorada para EyeTracking
 * Utiliza endpoints actualizados y manejo de errores mejorado
 */
export const eyeTrackingFixedAPI = {
  /**
   * Obtiene un EyeTracking por su ID
   * @param id ID del EyeTracking
   * @returns Objeto con método send
   */
  getById: (id: string) => {
    if (!id) {
      throw new Error('Se requiere un ID para obtener el EyeTracking');
    }
    
    const url = API_CONFIG.endpoints.eyeTracking?.GET?.replace('{id}', id) || `/eye-tracking/${id}`;
    console.log(`[EyeTrackingAPI] Obteniendo EyeTracking con ID ${id}, URL: ${url}`);
    console.log(`[EyeTrackingAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'GET',
          headers
        });
        
        return handleEyeTrackingResponse(response);
      }
    };
  },
  
  /**
   * Obtiene la configuración de EyeTracking actual
   * @param researchId ID de la investigación
   * @returns Objeto con método send
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para obtener la configuración de EyeTracking');
    }
    
    const url = (API_CONFIG.endpoints.eyeTracking?.GET_BY_RESEARCH || '/eye-tracking/research/{researchId}')
      .replace('{researchId}', researchId);
    
    console.log(`[EyeTrackingAPI] Obteniendo config por researchId ${researchId}, URL: ${url}`);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'GET',
            headers
          });
          
          if (!response.ok) {
            console.log(`[EyeTrackingAPI] Error en respuesta: ${response.status} ${response.statusText}`);
            
            // Si no hay datos simplemente devolvemos objeto vacío
            if (response.status === 404) {
              console.log('[EyeTrackingAPI] No se encontraron datos (404)');
              throw { statusCode: 404, message: 'No se encontró configuración de EyeTracking' };
            }
            
            const errorText = await response.text();
            console.log(`[EyeTrackingAPI] Texto de error: ${errorText}`);
            
            let error;
            try {
              error = JSON.parse(errorText);
            } catch (e) {
              error = { message: errorText };
            }
            
            throw { 
              statusCode: response.status,
              message: error.message || 'Error desconocido',
              data: error
            };
          }
          
          const data = await response.json();
          console.log('[EyeTrackingAPI] Datos obtenidos:', data);
          return data;
        } catch (error) {
          console.log('[EyeTrackingAPI] Error en fetch:', error);
          throw error;
        }
      }
    };
  },
  
  /**
   * Crea un nuevo EyeTracking
   * @param data Datos del EyeTracking
   * @returns Objeto con método send
   */
  create: (data: any) => {
    if (!data || !data.researchId) {
      throw new Error('Se requieren datos y un ID de investigación para crear el EyeTracking');
    }
    
    const url = API_CONFIG.endpoints.eyeTracking?.CREATE || '/eye-tracking';
    console.log(`[EyeTrackingAPI] Creando EyeTracking para investigación ${data.researchId}, URL: ${url}`);
    console.log(`[EyeTrackingAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('[EyeTrackingAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...data,
              researchId: data.researchId.trim()
            })
          });
          
          // Verificar si la respuesta es exitosa
          if (!response.ok) {
            // Intentar obtener el mensaje de error
            let errorMessage = '';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`;
            } catch (e) {
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            // Clasificar y manejar los errores
            if (response.status === 404) {
              // URL inexistente - mostrar error
              console.error(`[EyeTrackingAPI] Error 404: URL no encontrada: ${url}`);
              throw new Error(`La URL de la API no existe: ${errorMessage}`);
            } else if (response.status === 400 || response.status === 422) {
              // Datos incompatibles - mostrar error
              console.error(`[EyeTrackingAPI] Error de datos incompatibles: ${errorMessage}`);
              throw new Error(`Datos incompatibles: ${errorMessage}`);
            } else {
              // Otros errores - registrar pero no mostrar detalles al usuario
              console.error(`[EyeTrackingAPI] Error al crear: ${errorMessage}`);
              throw new Error('No se pudo crear el EyeTracking. Por favor, inténtelo de nuevo.');
            }
          }
          
          // Procesar respuesta exitosa
          return handleEyeTrackingResponse(response);
        } catch (error) {
          console.error('[EyeTrackingAPI] Error en create:', error);
          throw error;
        }
      }
    };
  },
  
  /**
   * Actualiza un EyeTracking existente
   * @param id ID del EyeTracking
   * @param data Datos actualizados
   * @returns Objeto con método send
   */
  update: (id: string, data: any) => {
    if (!id) {
      throw new Error('Se requiere un ID para actualizar el EyeTracking');
    }
    
    if (!data) {
      throw new Error('Se requieren datos para actualizar el EyeTracking');
    }
    
    const url = (API_CONFIG.endpoints.eyeTracking?.UPDATE || '/eye-tracking/{id}').replace('{id}', id);
    console.log(`[EyeTrackingAPI] Actualizando EyeTracking con ID ${id}, URL: ${url}`);
    console.log(`[EyeTrackingAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('[EyeTrackingAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
          });
          
          // Verificar si la respuesta es exitosa
          if (!response.ok) {
            // Intentar obtener el mensaje de error
            let errorMessage = '';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`;
            } catch (e) {
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            // Clasificar y manejar los errores
            if (response.status === 404) {
              // URL inexistente o recurso no encontrado - mostrar error
              console.error(`[EyeTrackingAPI] Error 404: Recurso no encontrado con ID ${id}`);
              throw new Error(`No se encontró el EyeTracking con ID ${id}: ${errorMessage}`);
            } else if (response.status === 400 || response.status === 422) {
              // Datos incompatibles - mostrar error
              console.error(`[EyeTrackingAPI] Error de datos incompatibles: ${errorMessage}`);
              throw new Error(`Datos incompatibles: ${errorMessage}`);
            } else {
              // Otros errores - registrar pero no mostrar detalles al usuario
              console.error(`[EyeTrackingAPI] Error al actualizar: ${errorMessage}`);
              throw new Error('No se pudo actualizar el EyeTracking. Por favor, inténtelo de nuevo.');
            }
          }
          
          // Procesar respuesta exitosa
          return handleEyeTrackingResponse(response);
        } catch (error) {
          console.error('[EyeTrackingAPI] Error en update:', error);
          throw error;
        }
      }
    };
  },

  /**
   * Obtiene la configuración de reclutamiento para EyeTracking
   * @param researchId ID de la investigación
   * @returns Objeto con método send
   */
  getRecruitConfig: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para obtener la configuración de reclutamiento');
    }
    
    // Usar el controlador de eye-tracking normal
    const url = `/research/${researchId}/eye-tracking`;
    console.log(`[EyeTrackingAPI] Obteniendo config de reclutamiento para researchId ${researchId}, URL: ${url}`);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'GET',
            headers
          });
          
          if (!response.ok) {
            console.log(`[EyeTrackingAPI] Error en respuesta: ${response.status} ${response.statusText}`);
            
            // Si no hay datos simplemente devolvemos null
            if (response.status === 404) {
              console.log('[EyeTrackingAPI] No se encontraron datos de reclutamiento (404)');
              return null;
            }
            
            // Manejar caso donde no hay contenido (204)
            if (response.status === 204) {
              console.log('[EyeTrackingAPI] Sin contenido (204)');
              return null;
            }
            
            const errorText = await response.text();
            console.log(`[EyeTrackingAPI] Texto de error: ${errorText}`);
            
            let error;
            try {
              error = JSON.parse(errorText);
            } catch (e) {
              error = { message: errorText };
            }
            
            throw { 
              statusCode: response.status,
              message: error.message || 'Error desconocido',
              data: error
            };
          }
          
          // Manejar caso donde la respuesta está vacía
          if (response.headers.get('content-length') === '0') {
            console.log('[EyeTrackingAPI] Respuesta vacía pero exitosa');
            return null;
          }
          
          // Intentar parsear la respuesta JSON
          try {
            const data = await response.json();
            console.log('[EyeTrackingAPI] Datos de reclutamiento obtenidos:', data);
            return data; // Devolvemos directamente los datos, sin envolverlos en un objeto config
          } catch (e) {
            console.log('[EyeTrackingAPI] Error al parsear JSON:', e);
            return null;
          }
        } catch (error) {
          console.log('[EyeTrackingAPI] Error en fetch:', error);
          throw error;
        }
      }
    };
  },
  
  /**
   * Guarda la configuración de reclutamiento para EyeTracking
   * @param data Datos de la configuración de reclutamiento
   * @returns Objeto con método send
   */
  saveRecruitConfig: (data: any) => {
    if (!data || !data.researchId) {
      throw new Error('Se requieren datos y un ID de investigación para guardar la configuración de reclutamiento');
    }
    
    // Usar el controlador de eye-tracking normal
    const url = `/research/${data.researchId}/eye-tracking`;
    console.log(`[EyeTrackingAPI] Guardando config de reclutamiento para investigación ${data.researchId}, URL: ${url}`);
    console.log('[EyeTrackingAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'PUT', // Cambiamos a PUT siguiendo el patrón de otros endpoints
            headers,
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            // Intentar obtener mensaje de error
            let errorMessage = '';
            
            // Manejar caso específico de 404
            if (response.status === 404) {
              console.error(`[EyeTrackingAPI] Ruta no encontrada: ${url}`);
              errorMessage = `Ruta no encontrada: ${url}`;
              throw new Error(errorMessage);
            }
            
            // Manejar caso de 204 No Content (aunque es técnicamente un éxito)
            if (response.status === 204) {
              console.log('[EyeTrackingAPI] Guardado exitoso (sin contenido)');
              return { success: true };
            }
            
            // Para otros errores, intentar obtener detalles
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`;
            } catch (e) {
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            console.error(`[EyeTrackingAPI] Error al guardar config de reclutamiento: ${errorMessage}`);
            throw new Error(`No se pudo guardar la configuración: ${errorMessage}`);
          }
          
          // Manejar respuesta exitosa pero vacía
          if (response.headers.get('content-length') === '0') {
            console.log('[EyeTrackingAPI] Guardado exitoso (respuesta vacía)');
            return { success: true };
          }
          
          // Intentar procesar respuesta JSON
          try {
            const result = await response.json();
            console.log('[EyeTrackingAPI] Guardado exitoso:', result);
            return result;
          } catch (e) {
            // Si no hay JSON pero la respuesta fue exitosa
            console.log('[EyeTrackingAPI] Guardado exitoso (sin JSON)');
            return { success: true };
          }
        } catch (error) {
          console.error('[EyeTrackingAPI] Error en saveRecruitConfig:', error);
          throw error;
        }
      }
    };
  }
}; 
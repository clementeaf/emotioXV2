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
   * Guarda la configuración de reclutamiento de Eye Tracking
   * @param data Datos de la configuración de reclutamiento
   * @returns Respuesta de la API
   */
  saveRecruitConfig: async (data: any) => {
    if (!data || !data.researchId) {
      throw new Error('Se requieren datos y un ID de investigación para guardar la configuración de reclutamiento');
    }
    
    console.log('[EyeTrackingAPI] Guardando configuración de reclutamiento:', data);
    
    try {
      // SOLUCIÓN ALTERNATIVA: Volvemos a la ruta original de eye-tracking que sabemos que funciona
      // Ya que parece que la ruta eye-tracking-recruit no está disponible en el API desplegado
      
      const method = 'POST';
      // Usar la ruta /eye-tracking directamente
      const url = `/eye-tracking`;
      
      console.log(`[EyeTrackingAPI] Cambiando a ruta: ${API_CONFIG.baseURL}${url}`);
      
      // Formatear los datos para incluir la información de ruteo
      const formattedData = {
        ...data,
        // Para indicar que es una operación de recruit
        operation: 'recruit', 
        action: 'createConfig',
        researchId: data.researchId,
        demographicQuestions: data.demographicQuestions,
        linkConfig: {
          allowMobileDevices: data.linkConfig.allowMobileDevices || false,
          trackLocation: data.linkConfig.trackLocation || false,
          multipleAttempts: data.linkConfig.multipleAttempts || false,
          limitParticipants: data.linkConfig.limitParticipants || false,
        },
        participantLimit: {
          enabled: data.linkConfig.limitParticipants || false,
          limit: data.linkConfig.participantLimit || 50
        },
        backlinks: data.backlinks,
        researchUrl: data.researchUrl,
        parameterOptions: data.parameterOptions
      };
      
      console.log('[EyeTrackingAPI] Método: ', method);
      console.log('[EyeTrackingAPI] Datos formateados:', formattedData);
      
      const headers = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
        method,
        headers,
        body: JSON.stringify(formattedData)
      });
      
      // Capturar el texto de respuesta para análisis, incluso si hay error
      const responseText = await response.text();
      console.log(`[EyeTrackingAPI] Respuesta (${response.status}): `, responseText);
      
      // Intentar parsear como JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log('[EyeTrackingAPI] Respuesta no es JSON válido');
        responseData = { message: responseText };
      }
      
      if (!response.ok) {
        console.log(`[EyeTrackingAPI] Error en respuesta: ${response.status} ${response.statusText}`);
        
        const error = { 
          statusCode: response.status,
          message: responseData.message || 'Error desconocido al guardar configuración de reclutamiento',
          data: responseData
        };
        
        throw error;
      }
      
      // Si llegamos aquí, la petición fue exitosa
      console.log('[EyeTrackingAPI] Configuración guardada correctamente:', responseData);
      return responseData;
    } catch (error: any) {
      console.error('[EyeTrackingAPI] Error al guardar:', error);
      throw error;
    }
  },

  /**
   * Obtiene la configuración de reclutamiento de Eye Tracking
   * @param researchId ID de la investigación
   * @returns Respuesta de la API
   */
  getRecruitConfig: async (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para obtener la configuración de reclutamiento');
    }
    
    // Usar la URL con formato correcto (con guión)
    const url = (API_CONFIG.endpoints.eyeTracking?.RECRUIT_GET_ALT || '/eye-tracking-recruit/research/{researchId}/config')
      .replace('{researchId}', researchId);
    
    console.log('[EyeTrackingAPI] Obteniendo configuración usando URL:', `${API_CONFIG.baseURL}${url}`);
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[EyeTrackingAPI] No se encontró configuración de reclutamiento (404)');
          throw { statusCode: 404, message: 'No se encontró configuración de reclutamiento' };
        }
        
        const errorText = await response.text();
        console.log(`[EyeTrackingAPI] Error texto: ${errorText}`);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { message: errorText };
        }
        
        throw { 
          statusCode: response.status,
          message: error.message || 'Error desconocido al obtener configuración de reclutamiento',
          data: error
        };
      }
      
      const data = await response.json();
      console.log('[EyeTrackingAPI] Configuración de reclutamiento obtenida:', data);
      return data;
    } catch (error) {
      console.log('[EyeTrackingAPI] Error al obtener configuración de reclutamiento:', error);
      throw error;
    }
  }
}; 
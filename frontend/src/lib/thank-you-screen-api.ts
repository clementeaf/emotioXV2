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
          // ======== SOLUCIÓN ULTRA SILENCIOSA PARA EVITAR ERRORES 404 EN LA CONSOLA ========
          
          // Generamos una clave única para este recurso
          const cacheKey = `thank_you_screen_resource_${researchId}`;
          
          // Si ya intentamos acceder a este recurso antes y no existía, devolvemos directamente
          // una respuesta simulada sin hacer ninguna solicitud HTTP
          const isKnownNonExistent = localStorage.getItem(cacheKey) === 'nonexistent';
          
          if (isKnownNonExistent) {
            console.log(`[ThankYouScreenAPI] Usando respuesta en caché para ${researchId} - sabemos que no existe`);
            return { 
              notFound: true, 
              data: null,
              ok: false,
              status: 404,
              statusText: 'Not Found',
              json: () => Promise.resolve({ data: null }),
              text: () => Promise.resolve('')
            };
          }
          
          // Si no sabemos si existe, hacemos la solicitud GET directamente y manejamos el 404 si ocurre
          const headers = getAuthHeaders();
          
          // Usamos el método fetch con catch para capturar errores 404
          try {
            const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
              method: 'GET',
              headers
            });
            
            // Si la respuesta es exitosa, guardamos que el recurso existe y procesamos normalmente
            if (response.ok) {
              localStorage.removeItem(cacheKey); // Ya no es "nonexistent"
              return handleThankYouScreenResponse(response);
            }
            
            // Si es 404, guardamos que el recurso no existe para evitar solicitudes futuras
            if (response.status === 404) {
              console.log('[ThankYouScreenAPI] No se encontró configuración de ThankYouScreen para esta investigación - esto es normal para nuevas investigaciones');
              localStorage.setItem(cacheKey, 'nonexistent');
              
              return { 
                notFound: true, 
                data: null,
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: () => Promise.resolve({ data: null }),
                text: () => Promise.resolve('')
              };
            }
            
            // Para otros errores, procesamos normalmente
            return handleThankYouScreenResponse(response);
          } catch (fetchError) {
            // En caso de error de red, asumimos que es un problema temporal
            console.log('[ThankYouScreenAPI] Error de red:', fetchError);
            throw fetchError;
          }
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
              console.error(`[ThankYouScreenAPI] Error 404: URL no encontrada: ${url}`);
              throw new Error(`La URL de la API no existe: ${errorMessage}`);
            } else if (response.status === 400 || response.status === 422) {
              // Datos incompatibles - mostrar error
              console.error(`[ThankYouScreenAPI] Error de datos incompatibles: ${errorMessage}`);
              throw new Error(`Datos incompatibles: ${errorMessage}`);
            } else {
              // Otros errores - registrar pero no mostrar detalles al usuario
              console.error(`[ThankYouScreenAPI] Error al crear: ${errorMessage}`);
              throw new Error('No se pudo crear la pantalla de agradecimiento. Por favor, inténtelo de nuevo.');
            }
          }
          
          // Procesar respuesta exitosa
          return handleThankYouScreenResponse(response);
        } catch (error) {
          console.error('[ThankYouScreenAPI] Error en create:', error);
          throw error;
        }
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
              console.error(`[ThankYouScreenAPI] Error 404: Recurso no encontrado con ID ${id}`);
              throw new Error(`No se encontró la pantalla de agradecimiento con ID ${id}: ${errorMessage}`);
            } else if (response.status === 400 || response.status === 422) {
              // Datos incompatibles - mostrar error
              console.error(`[ThankYouScreenAPI] Error de datos incompatibles: ${errorMessage}`);
              throw new Error(`Datos incompatibles: ${errorMessage}`);
            } else {
              // Otros errores - registrar pero no mostrar detalles al usuario
              console.error(`[ThankYouScreenAPI] Error al actualizar: ${errorMessage}`);
              throw new Error('No se pudo actualizar la pantalla de agradecimiento. Por favor, inténtelo de nuevo.');
            }
          }
          
          // Procesar respuesta exitosa
          return handleThankYouScreenResponse(response);
        } catch (error) {
          console.error('[ThankYouScreenAPI] Error en update:', error);
          throw error;
        }
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
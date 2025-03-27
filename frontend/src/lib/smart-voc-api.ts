/**
 * API específica para SmartVOC
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
 * Manejador de respuesta personalizado para Smart VOC
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleSmartVOCResponse = async (response: Response) => {
  console.log(`[SmartVOCAPI] Respuesta recibida: ${response.status} ${response.statusText}`);
  
  // Si es 404, lanzar un error específico pero controlado
  if (response.status === 404) {
    const text = await response.text();
    console.log(`[SmartVOCAPI] No se encontraron datos: ${text}`);
    throw new Error(`404 - Recurso no encontrado: ${text}`);
  }
  
  // Intentar obtener el cuerpo como JSON
  try {
    const data = await response.json();
    if (!response.ok) {
      console.error(`[SmartVOCAPI] Error ${response.status}: `, data);
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
  
  console.log(`[SmartVOCAPI] Usando token: ${tokenSummary}`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * API mejorada para Smart VOC
 * Utiliza endpoints actualizados y manejo de errores mejorado
 */
export const smartVocFixedAPI = {
  /**
   * Obtiene un Smart VOC por su ID
   * @param id ID del Smart VOC
   * @returns Objeto con método send
   */
  getById: (id: string) => {
    if (!id) {
      throw new Error('Se requiere un ID para obtener el Smart VOC');
    }
    
    const url = API_CONFIG.endpoints.smartVoc?.GET?.replace('{id}', id) || `/smart-voc/${id}`;
    console.log(`[SmartVOCAPI] Obteniendo Smart VOC con ID ${id}, URL: ${url}`);
    console.log(`[SmartVOCAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'GET',
          headers
        });
        
        return handleSmartVOCResponse(response);
      }
    };
  },
  
  /**
   * Obtiene el Smart VOC asociado a una investigación
   * @param researchId ID de la investigación
   * @returns Objeto con método send
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    
    // Esta es la URL problemática que vamos a arreglar
    // Antes era: /smart-voc/research/{researchId}/smart-voc
    // Cambiamos a: /smart-voc/research/{researchId}
    const url = `/smart-voc/research/${researchId}`;
    console.log(`[SmartVOCAPI] Obteniendo Smart VOC para investigación ${researchId}, URL: ${url}`);
    console.log(`[SmartVOCAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'GET',
            headers
          });
          
          return handleSmartVOCResponse(response);
        } catch (error) {
          console.log('[SmartVOCAPI] Error al obtener Smart VOC por researchId:', error);
          // Si es un error 404, lo manejamos como un caso normal - simplemente no hay datos aún
          if (error instanceof Error && error.message.includes('404')) {
            console.log('[SmartVOCAPI] No se encontró configuración de Smart VOC para esta investigación');
            return { data: null };
          }
          throw error;
        }
      }
    };
  },
  
  /**
   * Crea un nuevo Smart VOC
   * @param data Datos del Smart VOC
   * @returns Objeto con método send
   */
  create: (data: any) => {
    if (!data || !data.researchId) {
      throw new Error('Se requieren datos y un ID de investigación para crear el Smart VOC');
    }
    
    const url = API_CONFIG.endpoints.smartVoc?.CREATE || '/smart-voc';
    console.log(`[SmartVOCAPI] Creando Smart VOC para investigación ${data.researchId}, URL: ${url}`);
    console.log(`[SmartVOCAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('[SmartVOCAPI] Datos a enviar:', data);
    
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
        
        return handleSmartVOCResponse(response);
      }
    };
  },
  
  /**
   * Actualiza un Smart VOC existente
   * @param id ID del Smart VOC
   * @param data Datos actualizados
   * @returns Objeto con método send
   */
  update: (id: string, data: any) => {
    if (!id) {
      throw new Error('Se requiere un ID para actualizar el Smart VOC');
    }
    
    if (!data) {
      throw new Error('Se requieren datos para actualizar el Smart VOC');
    }
    
    const url = (API_CONFIG.endpoints.smartVoc?.UPDATE || '/smart-voc/{id}').replace('{id}', id);
    console.log(`[SmartVOCAPI] Actualizando Smart VOC con ID ${id}, URL: ${url}`);
    console.log(`[SmartVOCAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('[SmartVOCAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        });
        
        return handleSmartVOCResponse(response);
      }
    };
  }
}; 
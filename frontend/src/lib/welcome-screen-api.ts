/**
 * API específica para pantallas de bienvenida (Welcome Screen)
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
 * Manejador de respuesta personalizado para pantallas de bienvenida
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleWelcomeScreenResponse = async (response: Response) => {
  console.log(`[WelcomeScreenAPI] Respuesta recibida: ${response.status} ${response.statusText}`);
  
  // Si es 404, lanzar un error específico
  if (response.status === 404) {
    const text = await response.text();
    console.error(`[WelcomeScreenAPI] Error 404: ${text}`);
    throw new Error(`404 - Recurso no encontrado: ${text}`);
  }
  
  // Intentar obtener el cuerpo como JSON
  try {
    const data = await response.json();
    if (!response.ok) {
      console.error(`[WelcomeScreenAPI] Error ${response.status}: `, data);
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
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
  
  console.log(`[WelcomeScreenAPI] Usando token: ${tokenSummary}`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * API mejorada para pantallas de bienvenida
 * Utiliza endpoints actualizados y manejo de errores mejorado
 */
export const welcomeScreenFixedAPI = {
  /**
   * Obtiene una pantalla de bienvenida por su ID
   * @param id ID de la pantalla de bienvenida
   * @returns Objeto con método send
   */
  getById: (id: string) => {
    if (!id) {
      throw new Error('Se requiere un ID para obtener la pantalla de bienvenida');
    }
    
    const url = API_CONFIG.endpoints.welcomeScreen.GET.replace('{id}', id);
    console.log(`[WelcomeScreenAPI] Obteniendo pantalla con ID ${id}, URL: ${url}`);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'GET',
          headers
        });
        
        return handleWelcomeScreenResponse(response);
      }
    };
  },
  
  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación
   * @param researchId ID de la investigación
   * @returns Objeto con método send
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    
    const url = API_CONFIG.endpoints.welcomeScreen.GET_BY_RESEARCH.replace('{researchId}', researchId);
    console.log(`[WelcomeScreenAPI] Obteniendo pantalla para investigación ${researchId}, URL: ${url}`);
    console.log(`[WelcomeScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'GET',
          headers
        });
        
        return handleWelcomeScreenResponse(response);
      }
    };
  },
  
  /**
   * Crea una nueva pantalla de bienvenida
   * @param data Datos de la pantalla de bienvenida
   * @returns Objeto con método send
   */
  create: (data: any) => {
    if (!data || !data.researchId) {
      throw new Error('Se requieren datos y un ID de investigación para crear la pantalla');
    }
    
    const url = API_CONFIG.endpoints.welcomeScreen.CREATE;
    console.log(`[WelcomeScreenAPI] Creando pantalla para investigación ${data.researchId}, URL: ${url}`);
    console.log(`[WelcomeScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('Datos a enviar:', data);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        
        return handleWelcomeScreenResponse(response);
      }
    };
  },
  
  /**
   * Actualiza una pantalla de bienvenida existente
   * @param id ID de la pantalla de bienvenida
   * @param data Datos actualizados
   * @returns Objeto con método send
   */
  update: (id: string, data: any) => {
    if (!id) {
      throw new Error('Se requiere un ID para actualizar la pantalla');
    }
    
    if (!data) {
      throw new Error('Se requieren datos para actualizar la pantalla');
    }
    
    const url = API_CONFIG.endpoints.welcomeScreen.UPDATE.replace('{id}', id);
    console.log(`[WelcomeScreenAPI] Actualizando pantalla con ID ${id}, URL: ${url}`);
    console.log(`[WelcomeScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    console.log('Datos a enviar:', data);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        });
        
        return handleWelcomeScreenResponse(response);
      }
    };
  },
  
  /**
   * Elimina una pantalla de bienvenida
   * @param id ID de la pantalla de bienvenida
   * @returns Objeto con método send
   */
  delete: (id: string) => {
    if (!id) {
      throw new Error('Se requiere un ID para eliminar la pantalla');
    }
    
    const url = API_CONFIG.endpoints.welcomeScreen.DELETE.replace('{id}', id);
    console.log(`[WelcomeScreenAPI] Eliminando pantalla con ID ${id}, URL: ${url}`);
    console.log(`[WelcomeScreenAPI] URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
          method: 'DELETE',
          headers
        });
        
        return handleWelcomeScreenResponse(response);
      }
    };
  }
}; 
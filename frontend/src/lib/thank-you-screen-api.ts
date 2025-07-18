/**
 * API específica para ThankYouScreen
 * Implementación actualizada con manejo mejorado de errores y URL
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

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
  // console.log(`[ThankYouScreenAPI] Respuesta recibida: ${response.status} ${response.statusText}`);

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

  // console.log(`[ThankYouScreenAPI] Usando token: ${tokenSummary}`);

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

    const url = API_ENDPOINTS.thankYouScreen?.getByResearch?.replace('{id}', id) || `/thank-you-screen/${id}`;
    // console.log(`[ThankYouScreenAPI] Obteniendo ThankYouScreen con ID ${id}, URL: ${url}`);
    // console.log(`[ThankYouScreenAPI] URL completa: ${API_BASE_URL}${url}`);

    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${url}`, {
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

    const url = API_ENDPOINTS.thankYouScreen?.getByResearch?.replace('{researchId}', researchId) || `/thank-you-screen/research/${researchId}`;
    // console.log(`[ThankYouScreenAPI] Obteniendo ThankYouScreen para investigación ${researchId}, URL: ${url}`);
    // console.log(`[ThankYouScreenAPI] URL completa: ${API_BASE_URL}${url}`);

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'GET',
            headers
          });

          if (response.status === 404) {
            // console.log('[ThankYouScreenAPI] No se encontró configuración de ThankYouScreen para esta investigación');
            return {
              notFound: true,
              data: null,
              ok: false,
              status: 404,
              statusText: 'Not Found'
            };
          }

          // Si la respuesta no es exitosa, manejar el error
          if (!response.ok) {
            try {
              const errorData = await response.json();
              throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`);
            } catch (parseError) {
              // Si no se puede parsear como JSON, usar el texto
              const errorText = await response.text().catch(() => 'No se pudo obtener el cuerpo de la respuesta');
              throw new Error(`Error ${response.status}: ${errorText}`);
            }
          }

          return handleThankYouScreenResponse(response);
        } catch (error) {
          // Si el error incluye "not found" o "404", devolver objeto notFound
          if (error instanceof Error && (
            error.message.includes('not found') ||
            error.message.includes('THANK_YOU_SCREEN_NOT_FOUND') ||
            error.message.includes('No se pudo obtener el cuerpo de la respuesta')
          )) {
            return {
              notFound: true,
              data: null,
              ok: false,
              status: 404,
              statusText: 'Not Found'
            };
          }
          // console.log('[ThankYouScreenAPI] Error al obtener ThankYouScreen por researchId:', error);
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

    // Obtener la plantilla URL
    const urlTemplate = API_ENDPOINTS.thankYouScreen.create;
    // Reemplazar el placeholder con el researchId real
    const url = urlTemplate.replace('{researchId}', data.researchId.trim());

    // console.log(`[ThankYouScreenAPI] Creando ThankYouScreen para investigación ${data.researchId}, URL plantilla: ${urlTemplate}, URL final: ${url}`);
    // console.log(`[ThankYouScreenAPI] URL completa: ${API_BASE_URL}${url}`);
    // console.log('[ThankYouScreenAPI] Datos a enviar:', data);

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          // Usar la URL corregida
          const response = await fetch(`${API_BASE_URL}${url}`, {
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
              // console.log(`[ThankYouScreenAPI] Error 404: URL no encontrada: ${url}`);
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
   * @param screenId ID del ThankYouScreen
   * @param data Datos actualizados, debe incluir researchId
   * @returns Objeto con método send
   */
  update: (screenId: string, data: any) => {
    if (!screenId) {
      throw new Error('Se requiere un ID para actualizar el ThankYouScreen');
    }

    if (!data || !data.researchId) {
      throw new Error('Se requieren datos completos incluyendo researchId para actualizar el ThankYouScreen');
    }

    // Obtener la plantilla de URL y reemplazar ambos parámetros
    const urlTemplate = API_ENDPOINTS.thankYouScreen.update;
    const url = urlTemplate
      .replace('{researchId}', data.researchId)
      .replace('{screenId}', screenId);

    // console.log(`[ThankYouScreenAPI] Actualizando ThankYouScreen con ID ${screenId} para investigación ${data.researchId}`);
    // console.log(`[ThankYouScreenAPI] URL plantilla: ${urlTemplate}, URL final: ${url}`);
    // console.log(`[ThankYouScreenAPI] URL completa: ${API_BASE_URL}${url}`);
    // console.log('[ThankYouScreenAPI] Datos a enviar:', data);

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}${url}`, {
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
              // console.log(`[ThankYouScreenAPI] Error 404: Recurso no encontrado con ID ${screenId}`);
              throw new Error(`No se encontró la pantalla de agradecimiento con ID ${screenId}: ${errorMessage}`);
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
   * @param researchId ID de la investigación (requerido para la ruta)
   * @returns Objeto con método send
   */
  delete: (id: string, researchId: string) => {
    if (!id) {
      throw new Error('Se requiere un ID para eliminar el ThankYouScreen');
    }

    if (!researchId) {
      throw new Error('Se requiere un researchId para eliminar el ThankYouScreen');
    }

    const url = API_ENDPOINTS.thankYouScreen?.delete
      ?.replace('{researchId}', researchId)
      ?.replace('{screenId}', id) || `/research/${researchId}/thank-you-screen/${id}`;

    // console.log(`[ThankYouScreenAPI] Eliminando ThankYouScreen con ID ${id} para researchId ${researchId}, URL: ${url}`);
    // console.log(`[ThankYouScreenAPI] URL completa: ${API_BASE_URL}${url}`);

    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'DELETE',
          headers
        });

        return handleThankYouScreenResponse(response);
      }
    };
  }
};

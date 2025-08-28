import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
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

  // Ya no lanzamos error para 404 aquí, porque lo manejamos en getByResearchId
  // Intentar obtener el cuerpo como JSON
  try {
    const data = await response.json();
    if (!response.ok) {
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

    const url = API_ENDPOINTS.eyeTracking?.getByResearch?.replace('{id}', id) || `/eye-tracking/${id}`;

    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${url}`, {
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

    const url = API_ENDPOINTS.eyeTracking?.getByResearch?.replace('{researchId}', researchId) || `/eye-tracking/research/${researchId}`;


    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'GET',
            headers
          });

          if (!response.ok) {

            // Si no hay datos simplemente devolvemos objeto vacío
            if (response.status === 404) {
              throw { statusCode: 404, message: 'No se encontró configuración de EyeTracking' };
            }

            const errorText = await response.text();

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
          return data;
        } catch (error) {
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

    const url = API_ENDPOINTS.eyeTracking?.create || '/eye-tracking';

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
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
              throw new Error(`La URL de la API no existe: ${errorMessage}`);
            } else if (response.status === 400 || response.status === 422) {
              // Datos incompatibles - mostrar error
              throw new Error(`Datos incompatibles: ${errorMessage}`);
            } else {
              // Otros errores - registrar pero no mostrar detalles al usuario
              throw new Error('No se pudo crear el EyeTracking. Por favor, inténtelo de nuevo.');
            }
          }

          // Procesar respuesta exitosa
          return handleEyeTrackingResponse(response);
        } catch (error) {
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

    const url = (API_ENDPOINTS.eyeTracking?.update || '/eye-tracking/{id}').replace('{id}', id);

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
              throw new Error(`No se encontró el EyeTracking con ID ${id}: ${errorMessage}`);
            } else if (response.status === 400 || response.status === 422) {
              // Datos incompatibles - mostrar error
              throw new Error(`Datos incompatibles: ${errorMessage}`);
            } else {
              // Otros errores - registrar pero no mostrar detalles al usuario
              throw new Error('No se pudo actualizar el EyeTracking. Por favor, inténtelo de nuevo.');
            }
          }

          // Procesar respuesta exitosa
          return handleEyeTrackingResponse(response);
        } catch (error) {
          throw error;
        }
      }
    };
  },

  /**
   * Elimina la configuración de EyeTracking por researchId
   * @param researchId ID de la investigación
   * @returns Objeto con método send
   */
  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la configuración de EyeTracking');
    }
    const url = API_ENDPOINTS.eyeTracking?.delete?.replace('{researchId}', researchId) || `/research/${researchId}/eye-tracking`;
    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'DELETE',
          headers
        });
        if (!response.ok && response.status !== 204) {
          throw new Error(`Error al eliminar configuración: ${response.statusText}`);
        }
        return;
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

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'GET',
            headers
          });

          if (!response.ok) {

            // Si no hay datos simplemente devolvemos null
            if (response.status === 404) {
              return null;
            }

            // Manejar caso donde no hay contenido (204)
            if (response.status === 204) {
              return null;
            }

            const errorText = await response.text();

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
            return null;
          }

          // Intentar parsear la respuesta JSON
          try {
            const data = await response.json();
            return data; // Devolvemos directamente los datos, sin envolverlos en un objeto config
          } catch (e) {
            return null;
          }
        } catch (error) {
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

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT', // Cambiamos a PUT siguiendo el patrón de otros endpoints
            headers,
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            // Intentar obtener mensaje de error
            let errorMessage = '';

            // Manejar caso específico de 404
            if (response.status === 404) {
              errorMessage = `Ruta no encontrada: ${url}`;
              throw new Error(errorMessage);
            }

            // Manejar caso de 204 No Content (aunque es técnicamente un éxito)
            if (response.status === 204) {
              return { success: true };
            }

            // Para otros errores, intentar obtener detalles
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`;
            } catch (e) {
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }

            throw new Error(`No se pudo guardar la configuración: ${errorMessage}`);
          }

          // Manejar respuesta exitosa pero vacía
          if (response.headers.get('content-length') === '0') {
            return { success: true };
          }

          // Intentar procesar respuesta JSON
          try {
            const result = await response.json();
            return result;
          } catch (e) {
            // Si no hay JSON pero la respuesta fue exitosa
            return { success: true };
          }
        } catch (error) {
          throw error;
        }
      }
    };
  }
};

export const eyeTrackingRecruitAPI = {
  async getConfigByResearchId(researchId: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.getConfigByResearch.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'GET', headers });
    if (!response.ok) return null;
    return response.json();
  },
  async createConfig(researchId: string, data: any) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.createConfig.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al crear configuración');
    return response.json();
  },
  async updateConfig(researchId: string, data: any) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.updateConfig.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al actualizar configuración');
    return response.json();
  },
  async completeConfig(researchId: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.updateConfig.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'PUT', headers, body: JSON.stringify({ status: 'completed' }) });
    if (!response.ok) throw new Error('Error al completar configuración');
    return response.json();
  },
  async deleteConfig(researchId: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.updateConfig.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'DELETE', headers });
    if (!response.ok) throw new Error('Error al eliminar configuración');
    return;
  },
  async createParticipant(configId: string, data: any) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.createParticipant.replace('{configId}', configId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al crear participante');
    return response.json();
  },
  async updateParticipantStatus(participantId: string, status: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.updateParticipantStatus.replace('{participantId}', participantId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    if (!response.ok) throw new Error('Error al actualizar estado del participante');
    return response.json();
  },
  async getParticipantsByConfigId(configId: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.getParticipants.replace('{configId}', configId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Error al obtener participantes');
    return response.json();
  },
  async getStatsByConfigId(configId: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.getStats.replace('{configId}', configId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },
  async generateRecruitmentLink(configId: string, type: string, expirationDays?: number) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.generateLink.replace('{configId}', configId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'POST', headers, body: JSON.stringify({ type, expirationDays }) });
    if (!response.ok) throw new Error('Error al generar enlace de reclutamiento');
    return response.json();
  },
  async getActiveLinks(configId: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.getActiveLinks.replace('{configId}', configId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Error al obtener enlaces activos');
    return response.json();
  },
  async deactivateLink(token: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.deactivateLink.replace('{token}', token);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'PUT', headers });
    if (!response.ok) throw new Error('Error al desactivar enlace');
    return response.json();
  },
  async validateRecruitmentLink(token: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.validateLink.replace('{token}', token);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Error al validar enlace');
    return response.json();
  },
  async getResearchSummary(researchId: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.getResearchSummary.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Error al obtener resumen de investigación');
    return response.json();
  },
  async registerPublicParticipant(data: any) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.registerPublicParticipant;
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al registrar participante público');
    return response.json();
  },
  async updatePublicParticipantStatus(participantId: string, status: string) {
    const url = API_ENDPOINTS.eyeTrackingRecruit.updatePublicParticipantStatus.replace('{participantId}', participantId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    if (!response.ok) throw new Error('Error al actualizar estado del participante público');
    return response.json();
  }
};

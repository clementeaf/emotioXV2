/**
 * API específica para pantallas de bienvenida (Welcome Screen)
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
 * Manejador de respuesta personalizado para pantallas de bienvenida
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleWelcomeScreenResponse = async (response: Response) => {
  // // console.log(`[WelcomeScreenAPI] Respuesta recibida: ${response.status} ${response.statusText}`);

  // Ya no lanzamos error para 404 aquí, porque lo manejamos en getByResearchId

  // Intentar obtener el cuerpo como JSON
  try {
    const data = await response.json();
    if (!response.ok) {
      // Solo mostrar error en consola si NO es 404
      if (response.status !== 404) {
        console.error(`[WelcomeScreenAPI] Error ${response.status}: `, data);
      }
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data;
  } catch (error) {
    // Si no es JSON o hay otro error
    const text = await response.text().catch(() => 'No se pudo obtener el cuerpo de la respuesta');
    if (!response.ok) {
      if (response.status !== 404) {
        console.error(`[WelcomeScreenAPI] Error ${response.status}: ${text}`);
      }
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

  // // console.log(`[WelcomeScreenAPI] Usando token: ${tokenSummary}`);

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

    const url = API_ENDPOINTS['welcome-screen'].getByResearch.replace('{id}', id);
    // // console.log(`[WelcomeScreenAPI] Obteniendo pantalla con ID ${id}, URL: ${url}`);

    return {
      send: async () => {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${url}`, {
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

    const url = API_ENDPOINTS['welcome-screen']?.getByResearch?.replace('{researchId}', researchId) || `/welcome-screen/research/${researchId}`;
    // // console.log(`[WelcomeScreenAPI] Obteniendo pantalla para investigación ${researchId}, URL: ${url}`);
    // // console.log(`[WelcomeScreenAPI] URL completa: ${API_BASE_URL}${url}`);

    return {
      send: async () => {
        try {
          // ======== SOLUCIÓN ULTRA SILENCIOSA PARA EVITAR ERRORES 404 EN LA CONSOLA ========

          // Generamos una clave única para este recurso
          const cacheKey = `welcome_screen_resource_${researchId}`;

          // Si ya intentamos acceder a este recurso antes y no existía, devolvemos directamente
          // una respuesta simulada sin hacer ninguna solicitud HTTP
          const isKnownNonExistent = localStorage.getItem(cacheKey) === 'nonexistent';

          if (isKnownNonExistent) {
            // // console.log(`[WelcomeScreenAPI] Usando respuesta en caché para ${researchId} - sabemos que no existe`);
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

          // Usamos Image() como un hack para evitar errores en la consola
          // Las imágenes fallidas no muestran errores en la red en la consola de Chrome
          if (false && typeof window !== 'undefined') {
            try {
              const dummyImage = new Image();
              dummyImage.style.display = 'none';
              const timestamp = Date.now();

              // Creamos una promesa que se resolverá cuando la imagen se cargue o falle
              const checkPromise = new Promise((resolve) => {
                dummyImage.onload = () => resolve(true);
                dummyImage.onerror = () => resolve(false);

                // Establecemos un timeout para asegurarnos de que no se quede esperando para siempre
                setTimeout(() => resolve(false), 3000);
              });

              // Intentamos cargar la imagen (esto fallará con 404, pero no mostrará error en la consola)
              document.body.appendChild(dummyImage);
              dummyImage.src = `${API_BASE_URL}${url}?timestamp=${timestamp}`;

              // Esperamos a que la imagen se cargue o falle
              const exists = await checkPromise;

              // Limpiamos
              if (document.body.contains(dummyImage)) {
                document.body.removeChild(dummyImage);
              }

              // Si la imagen falló, entonces el recurso no existe
              if (!exists) {
                // // console.log('[WelcomeScreenAPI] No se encontró la pantalla de bienvenida en la verificación con imagen');
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
            } catch (e) {
              // // console.log('[WelcomeScreenAPI] Error en la verificación con imagen:', e);
              // Si hay un error, continuamos con el enfoque normal
            }
          }

          try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
              method: 'GET',
              headers
            });

            if (response.ok) {
              localStorage.removeItem(cacheKey);
              return handleWelcomeScreenResponse(response);
            }

            if (response.status === 404) {
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
            return handleWelcomeScreenResponse(response);
          } catch (fetchError) {
            // En caso de error de red, asumimos que es un problema temporal
            // // console.log('[WelcomeScreenAPI] Error de red:', fetchError);
            throw fetchError;
          }
        } catch (error) {
          // // console.log('[WelcomeScreenAPI] Error al obtener pantalla de bienvenida por researchId:', error);
          throw error;
        }
      }
    };
  },

  /**
   * Crea una nueva pantalla de bienvenida
   * @param researchId ID de la investigación
   * @param data Datos de la pantalla de bienvenida
   * @returns Objeto con método send
   */
  create: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la pantalla');
    }
    if (!data) {
      throw new Error('Se requieren datos para crear la pantalla');
    }

    // <<< Usar el endpoint CREATE >>>
    const url = API_ENDPOINTS['welcome-screen'].create.replace('{researchId}', researchId);
    // console.log(`[WelcomeScreenAPI] Creando (POST) pantalla para investigación ${researchId}, URL: ${url}`);
    // console.log('[WelcomeScreenAPI] Datos a enviar:', data);

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
          });
          return handleWelcomeScreenResponse(response);
        } catch (error) {
          console.error('[WelcomeScreenAPI] Error en create:', error);
          throw error;
        }
      }
    };
  },

  /**
   * Actualiza una pantalla de bienvenida existente
   * @param researchId ID de la investigación
   * @param screenId ID específico de la pantalla de bienvenida a actualizar
   * @param data Datos actualizados de la pantalla de bienvenida
   * @returns Objeto con método send
   */
  update: (researchId: string, screenId: string, data: any) => {
    if (!researchId || !screenId) {
      throw new Error('Se requieren researchId y screenId para actualizar la pantalla');
    }
    if (!data) {
      throw new Error('Se requieren datos para actualizar la pantalla');
    }

    // <<< Usar el endpoint UPDATE y reemplazar ambos parámetros >>>
    const url = API_ENDPOINTS['welcome-screen'].update
      .replace('{researchId}', researchId)
      .replace('{screenId}', screenId);

    // console.log(`[WelcomeScreenAPI] Actualizando (PUT) pantalla ${screenId} para investigación ${researchId}, URL: ${url}`);
    // console.log('[WelcomeScreenAPI] Datos a enviar:', data);

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
          });
          return handleWelcomeScreenResponse(response);
        } catch (error) {
          console.error('[WelcomeScreenAPI] Error en update:', error);
          throw error;
        }
      }
    };
  },

  /**
   * Elimina la pantalla de bienvenida asociada a una investigación
   * @param researchId ID de la investigación
   * @param screenId ID específico de la pantalla a eliminar
   * @returns Objeto con método send
   */
  delete: (researchId: string, screenId: string) => {
    if (!researchId || !screenId) {
      throw new Error('Se requieren researchId y screenId para eliminar la pantalla');
    }

    // <<< Usar el endpoint DELETE y reemplazar ambos parámetros >>>
    const url = API_ENDPOINTS['welcome-screen'].delete
      .replace('{researchId}', researchId)
      .replace('{screenId}', screenId);
    // console.log(`[WelcomeScreenAPI] Eliminando (DELETE) pantalla ${screenId} para investigación ${researchId}, URL: ${url}`);

    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          headers['Content-Type'] = undefined as any;
          const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: headers as HeadersInit
          });
          if (response.status === 204) {
            return { success: true, data: null, status: 204 };
          }
          return handleWelcomeScreenResponse(response);
        } catch (error) {
          console.error('[WelcomeScreenAPI] Error en delete:', error);
          throw error;
        }
      }
    };
  }
};

// Exportar la API para ser usada por los servicios
export const welcomeScreenAPI = welcomeScreenFixedAPI;

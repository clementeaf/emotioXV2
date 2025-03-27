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
  
  // Ya no lanzamos error para 404 aquí, porque lo manejamos en getByResearchId
  
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
        try {
          // ======== SOLUCIÓN ULTRA SILENCIOSA PARA EVITAR ERRORES 404 EN LA CONSOLA ========
          
          // Generamos una clave única para este recurso
          const cacheKey = `welcome_screen_resource_${researchId}`;
          
          // Si ya intentamos acceder a este recurso antes y no existía, devolvemos directamente
          // una respuesta simulada sin hacer ninguna solicitud HTTP
          const isKnownNonExistent = localStorage.getItem(cacheKey) === 'nonexistent';
          
          if (isKnownNonExistent) {
            console.log(`[WelcomeScreenAPI] Usando respuesta en caché para ${researchId} - sabemos que no existe`);
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
              dummyImage.src = `${API_CONFIG.baseURL}${url}?timestamp=${timestamp}`;
              
              // Esperamos a que la imagen se cargue o falle
              const exists = await checkPromise;
              
              // Limpiamos
              if (document.body.contains(dummyImage)) {
                document.body.removeChild(dummyImage);
              }
              
              // Si la imagen falló, entonces el recurso no existe
              if (!exists) {
                console.log('[WelcomeScreenAPI] No se encontró la pantalla de bienvenida en la verificación con imagen');
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
              console.log('[WelcomeScreenAPI] Error en la verificación con imagen:', e);
              // Si hay un error, continuamos con el enfoque normal
            }
          }
          
          // Usamos el método fetch con catch para capturar errores 404
          try {
            const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
              method: 'GET',
              headers
            });
            
            // Si la respuesta es exitosa, guardamos que el recurso existe y procesamos normalmente
            if (response.ok) {
              localStorage.removeItem(cacheKey); // Ya no es "nonexistent"
              return handleWelcomeScreenResponse(response);
            }
            
            // Si es 404, guardamos que el recurso no existe para evitar solicitudes futuras
            if (response.status === 404) {
              console.log('[WelcomeScreenAPI] No se encontró configuración de pantalla de bienvenida para esta investigación - esto es normal para nuevas investigaciones');
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
            console.log('[WelcomeScreenAPI] Error de red:', fetchError);
            throw fetchError;
          }
        } catch (error) {
          console.log('[WelcomeScreenAPI] Error al obtener pantalla de bienvenida por researchId:', error);
          throw error;
        }
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
    console.log('[WelcomeScreenAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          // Usamos nuestra implementación mejorada para POST también
          const truelyQuietFetch = async (url: string, options: RequestInit) => {
            const headers: Record<string, string> = {};
            
            // Convertir headers del RequestInit a Record<string, string>
            if (options.headers) {
              if (options.headers instanceof Headers) {
                options.headers.forEach((value, key) => {
                  headers[key] = value;
                });
              } else if (typeof options.headers === 'object') {
                Object.keys(options.headers).forEach(key => {
                  const value = (options.headers as Record<string, string>)[key];
                  if (value) headers[key] = value;
                });
              }
            }
            
            // Para PUT/POST, extraer el body
            let body: string | null = null;
            if (options.body && typeof options.body === 'string') {
              body = options.body;
            }
            
            try {
              return new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.onreadystatechange = function() {
                  if (xhr.readyState !== 4) return;
                  
                  if (xhr.status === 404) {
                    // Para creación, 404 significa que el endpoint no existe - es un error real
                    console.log(`[WelcomeScreenAPI] Endpoint no encontrado (404) al crear en ${url}`);
                    console.log('[WelcomeScreenAPI] Esto puede indicar un problema con la URL de la API');
                    
                    let errorData;
                    try {
                      errorData = JSON.parse(xhr.responseText);
                    } catch (e) {
                      errorData = xhr.responseText;
                    }
                    
                    // Notificar el problema pero de manera controlada
                    reject({
                      status: 404,
                      statusText: 'Not Found',
                      data: errorData,
                      message: 'El endpoint para crear la pantalla de bienvenida no existe'
                    });
                  } else if (xhr.status >= 200 && xhr.status < 300) {
                    // Respuesta exitosa
                    let responseData;
                    try {
                      responseData = JSON.parse(xhr.responseText);
                    } catch (e) {
                      responseData = xhr.responseText;
                    }
                    resolve({ 
                      ok: true,
                      status: xhr.status,
                      statusText: xhr.statusText,
                      json: () => Promise.resolve(responseData),
                      text: () => Promise.resolve(xhr.responseText)
                    });
                  } else {
                    // Otros errores
                    let errorData;
                    try {
                      errorData = JSON.parse(xhr.responseText);
                    } catch (e) {
                      errorData = xhr.responseText;
                    }
                    
                    reject({
                      status: xhr.status,
                      statusText: xhr.statusText,
                      data: errorData,
                      message: `Error ${xhr.status}: ${xhr.statusText}`
                    });
                  }
                };
                
                xhr.open(options.method || 'GET', url);
                
                // Añadir headers
                Object.keys(headers).forEach(key => {
                  xhr.setRequestHeader(key, headers[key]);
                });
                
                // Enviar con body si existe
                xhr.send(body);
              });
            } catch (error) {
              console.log('[WelcomeScreenAPI] Error en truelyQuietFetch para creación:', error);
              throw error;
            }
          };
          
          // Usar nuestra función personalizada
          const response: any = await truelyQuietFetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
          });
          
          return response;
        } catch (error: any) {
          // Personalizar mensajes de error para el usuario
          if (error.status === 404) {
            console.error('[WelcomeScreenAPI] Error 404 en creación:', error.message);
            throw new Error('No se pudo encontrar el endpoint para crear la pantalla de bienvenida. Por favor, contacta al soporte técnico.');
          } else if (error.status === 400) {
            console.error('[WelcomeScreenAPI] Error 400 en creación:', error.data);
            throw new Error('Datos incorrectos: ' + (error.data?.message || 'Revisa los datos enviados'));
          } else {
            console.error('[WelcomeScreenAPI] Error en create:', error);
            throw new Error('No se pudo crear la pantalla de bienvenida. Por favor, inténtalo de nuevo más tarde.');
          }
        }
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
    console.log('[WelcomeScreenAPI] Datos a enviar:', data);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          // Primero verificamos si el recurso existe para evitar errores 404 ruidosos
          const truelyQuietFetch = async (url: string, options: RequestInit) => {
            const headers: Record<string, string> = {};
            
            // Convertir headers del RequestInit a Record<string, string>
            if (options.headers) {
              if (options.headers instanceof Headers) {
                options.headers.forEach((value, key) => {
                  headers[key] = value;
                });
              } else if (typeof options.headers === 'object') {
                Object.keys(options.headers).forEach(key => {
                  const value = (options.headers as Record<string, string>)[key];
                  if (value) headers[key] = value;
                });
              }
            }
            
            // Para PUT/POST, extraer el body
            let body: string | null = null;
            if (options.body && typeof options.body === 'string') {
              body = options.body;
            }
            
            try {
              return new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.onreadystatechange = function() {
                  if (xhr.readyState !== 4) return;
                  
                  if (xhr.status === 404) {
                    // Para el caso de actualización, un 404 es un error que debemos manejar de forma especial
                    console.log(`[WelcomeScreenAPI] Recurso no encontrado (404) al actualizar en ${url}`);
                    console.log('[WelcomeScreenAPI] Este error es esperado si el ID de pantalla de bienvenida ya no existe');
                    // Retornamos un objeto específico para este caso
                    resolve({ 
                      notFoundError: true, 
                      errorData: {
                        message: "La pantalla de bienvenida que intentas actualizar no existe. Puede que haya sido eliminada."
                      }
                    });
                  } else if (xhr.status >= 200 && xhr.status < 300) {
                    // Respuesta exitosa
                    let responseData;
                    try {
                      responseData = JSON.parse(xhr.responseText);
                    } catch (e) {
                      responseData = xhr.responseText;
                    }
                    resolve({ 
                      ok: true,
                      status: xhr.status,
                      statusText: xhr.statusText,
                      json: () => Promise.resolve(responseData),
                      text: () => Promise.resolve(xhr.responseText)
                    });
                  } else {
                    // Otros errores
                    let errorData;
                    try {
                      errorData = JSON.parse(xhr.responseText);
                    } catch (e) {
                      errorData = xhr.responseText;
                    }
                    
                    reject({
                      status: xhr.status,
                      statusText: xhr.statusText,
                      data: errorData,
                      message: `Error ${xhr.status}: ${xhr.statusText}`
                    });
                  }
                };
                
                xhr.open(options.method || 'GET', url);
                
                // Añadir headers
                Object.keys(headers).forEach(key => {
                  xhr.setRequestHeader(key, headers[key]);
                });
                
                // Enviar con body si existe
                xhr.send(body);
              });
            } catch (error) {
              console.log('[WelcomeScreenAPI] Error en truelyQuietFetch para actualización:', error);
              throw error;
            }
          };
          
          // Usar nuestra función personalizada
          const response: any = await truelyQuietFetch(`${API_CONFIG.baseURL}${url}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
          });
          
          // Manejar caso específico de recurso no encontrado
          if (response && response.notFoundError) {
            // Lanzar un error amigable para que el componente lo muestre adecuadamente
            console.error('[WelcomeScreenAPI] Error 404 al actualizar:', response.errorData.message);
            throw new Error(response.errorData.message);
          }
          
          return response;
        } catch (error) {
          console.error('[WelcomeScreenAPI] Error en update:', error);
          throw error;
        }
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
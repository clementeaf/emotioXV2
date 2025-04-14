import { createAlova } from 'alova';
import { Method } from 'alova';
import ReactHook from 'alova/react';

import API_CONFIG from '@/config/api.config';
import tokenService from '@/services/tokenService';

import { ResearchBasicData, Research } from '../../../shared/interfaces/research.model';


// Tipos para las respuestas de la API
interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

// Interfaces para autenticación
export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

// Adaptador personalizado para fetch
const customFetchAdapter = () => {
  return (config: any) => {
    const controller = new AbortController();
    const { signal } = controller;

    // Usar el tipo explícito directamente de la configuración o el valor predeterminado
    const methodType = config.type || config.method || 'GET';
    
    // Solo enviar body si el método no es GET o HEAD
    const isGetOrHead = methodType === 'GET' || methodType === 'HEAD';
    
    // Depuración - mostramos información detallada de la solicitud
    console.log('Request details:', {
      url: config.url,
      methodType,
      hasData: !!config.data,
      willSendBody: !!config.data && !isGetOrHead,
      data: config.data, // Mostrar los datos que se están enviando
      headers: config.headers
    });
    
    // Si la URL contiene {id} sin reemplazar, es un error
    if (config.url.includes('{id}')) {
      console.error('URL contiene placeholder {id} sin reemplazar:', config.url);
    }
    
    console.log(`Enviando solicitud ${methodType} a ${config.url}`);
    
    // Asegurarse de que config.url no sea una URL ya completa
    let requestUrl = config.url;
    
    console.log(`URL final a la que se envía la solicitud: ${requestUrl}`);
    
    // Verificar que los datos se envían correctamente para solicitudes POST
    let bodyData = undefined;
    if (config.data && !isGetOrHead) {
      // Si config.data ya es un string, usarlo directamente
      if (typeof config.data === 'string') {
        bodyData = config.data;
      } else {
        // De lo contrario, convertirlo a JSON
        try {
          bodyData = JSON.stringify(config.data);
          console.log('DEBUG - Datos del body (convertidos a string):', bodyData);
        } catch (error) {
          console.error('ERROR - No se pudo convertir los datos a JSON:', error);
        }
      }
    }
    
    const fetchPromise = fetch(requestUrl, {
      method: methodType, // Usar el método correcto
      headers: config.headers,
      body: bodyData, // Usar la variable bodyData en lugar de la conversión inline
      signal,
      mode: 'cors',
      // No enviar credenciales automáticamente para evitar problemas CORS
      credentials: 'omit'
    });

    return {
      response: () => fetchPromise.then(async response => {
        // Extraer headers de forma manual para evitar problemas de compatibilidad
        const headersObj: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        
        // Registrar información sobre la respuesta
        console.log(`API Response (${config.url}):`, {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          headers: headersObj
        });
        
        if (!response.ok) {
          // Comprobar si es un error 404 para una petición GET de investigación
          const is404 = response.status === 404;
          const isResearchGet = config.url.includes('/research/') && 
                              (methodType === 'GET' || config.method === 'GET') &&
                              !config.url.includes('/smart-voc') &&
                              !config.url.includes('/eye-tracking') &&
                              !config.url.includes('/welcome-screen') &&
                              !config.url.includes('/thank-you-screen');
          
          // Intentar obtener más detalles del error para depuración
          try {
            const errorText = await response.text();
            
            // Solo mostrar errores en consola si NO es un 404 de investigación
            if (!(is404 && isResearchGet)) {
              console.error('Respuesta de error completa:', errorText);
            }
            
            let errorDetail = errorText;
            try {
              // Intentar parsear el error como JSON
              const errorJson = JSON.parse(errorText);
              errorDetail = errorJson.message || errorJson.error || JSON.stringify(errorJson);
            } catch (parseError) {
              // Si no es JSON, usar el texto tal cual
            }
            
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}${errorDetail ? ' - ' + errorDetail : ''}`);
          } catch (textError) {
            if (textError instanceof Error && textError.message.includes('Error en la solicitud')) {
              throw textError;
            }
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
          }
        }
        
        // Clonar la respuesta para no consumirla
        return response.clone();
      }).catch(error => {
        // Comprobar si es un error 404 para una petición GET de investigación
        const is404Error = error.message && error.message.includes('404');
        const isResearchGet = config.url.includes('/research/') && 
                           (config.method === 'GET' || config.type === 'GET') &&
                           !config.url.includes('/smart-voc') &&
                           !config.url.includes('/eye-tracking') &&
                           !config.url.includes('/welcome-screen') &&
                           !config.url.includes('/thank-you-screen');
            
        // Solo mostrar errores en consola si NO es un 404 de investigación
        if (!(is404Error && isResearchGet)) {
          // Mejorar los mensajes de error de red
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error(`Error de red al intentar conectar con ${config.url}`, error);
            const detailedError = new Error(`Error de conexión: No se pudo contactar con el servidor ${config.url}. Compruebe su conexión a internet y que el servidor esté disponible.`);
            detailedError.name = 'NetworkError';
            throw detailedError;
          }
          
          // Registrar errores de CORS
          if (error.name === 'TypeError' && (
            error.message.includes('has been blocked by CORS policy') ||
            error.message.includes('NetworkError when attempting to fetch resource'))
          ) {
            console.error(`Error de CORS al intentar conectar con ${config.url}`, error);
            
            const detailedError = new Error(`Error de permisos CORS: El servidor no permite solicitudes desde esta dirección (${window.location.origin}). Este es probablemente un problema de configuración del servidor o un firewall bloqueando las solicitudes cross-origin.`);
            detailedError.name = 'CORSError';
            throw detailedError;
          }
          
          // Registrar errores de red o fetch
          console.error(`API Fetch Error (${config.url}):`, error);
        }
        
        throw error;
      }),
      headers: () => fetchPromise.then(response => response.headers),
      abort: () => controller.abort(),
      onDownload: undefined,
      onUpload: undefined,
    };
  };
};

// Crear instancia de Alova
const alovaInstance = createAlova({
  // Usar el baseURL de API_CONFIG para todas las solicitudes
  baseURL: API_CONFIG.baseURL,
  statesHook: ReactHook,
  requestAdapter: customFetchAdapter(),
  timeout: 15000, // Aumentar timeout a 15 segundos para dar más margen
  beforeRequest(method: Method) {
    // Imprimir la URL antes de enviar la solicitud para depuración
    console.log(`Preparando solicitud a: ${method.url}`);
    console.log(`Método explícito: ${method.type}`);
    
    // CONFIGURACIÓN CORS: Asegurar que las peticiones directas a AWS funcionan
    if (method.url.includes('execute-api.us-east-1.amazonaws.com')) {
      method.config.credentials = 'omit'; // Cambiar a 'omit' para compatibilidad con origen '*'
      method.config.mode = 'cors'; // Asegurar que el modo es 'cors'
      console.log('Configurada petición para NO incluir credenciales en CORS (compatible con wildcard origin)');
    }
    
    // Asegurarse de que el método se está pasando correctamente
    if (!method.config.method) {
      method.config.method = method.type;
      console.log(`Asignando método explícitamente: ${method.config.method}`);
    }
    
    // Asegurar que el metodType también está definido (para nuestro adaptador personalizado)
    method.config.methodType = method.type;
    console.log(`Asignando methodType explícitamente: ${method.config.methodType}`);
    
    // Configuración por defecto
    method.config.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*', // Aceptar más tipos de contenido
      'X-Requested-With': 'XMLHttpRequest', // Agregar para identificar solicitudes AJAX
      ...method.config.headers,
    };
    
    // Agregar headers de cache-control excepto para las rutas que tienen problemas CORS
    if (!method.url.includes('/welcome-screens') && !method.url.includes('/research')) {
      method.config.headers['Cache-Control'] = 'no-cache';
      method.config.headers['Pragma'] = 'no-cache';
    } else {
      console.log('Omitiendo headers cache-control para rutas con problemas CORS:', method.url);
    }

    // Verificar el tipo de almacenamiento para obtener el token correspondiente
    const storageType = localStorage.getItem('auth_storage_type') || 'local';
    console.log('Tipo de almacenamiento detectado:', storageType);
    
    // Obtener token según el tipo de almacenamiento
    const token = storageType === 'local' 
      ? localStorage.getItem('token') 
      : sessionStorage.getItem('token');
      
    if (token) {
      // Asegurarse de que el token se envía con el prefijo Bearer y espacio
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Log del token (truncado por seguridad)
      const tokenDisplay = authToken.substring(0, 15) + '...';
      console.log('Token de autenticación:', tokenDisplay);
      
      method.config.headers = {
        ...method.config.headers,
        Authorization: authToken,
      };
    } else {
      console.warn('No se encontró token de autenticación');
    }
    
    // Verificar y mostrar los headers para depuración
    console.log('Headers de la solicitud:', {
      ...method.config.headers,
      Authorization: method.config.headers.Authorization ? 
        method.config.headers.Authorization.substring(0, 15) + '...' : 
        'No definido'
    });
  },
  responded: {
    onSuccess: async (response: any) => {
      try {
        // Obtener una copia de la respuesta para no consumirla
        const responseCopy = response.clone();
        
        // Obtener metadatos de la respuesta
        const contentType = response.headers.get('content-type') || '';
        
        // Obtener el contenido para depuración
        const responseText = await response.text();
        console.log('Respuesta exitosa (texto bruto):', responseText);
        console.log('Content-Type de la respuesta:', contentType);
        
        // Si la respuesta está vacía, devolver un objeto vacío
        if (!responseText || responseText.trim() === '') {
          console.warn('La respuesta del servidor está vacía');
          return { success: true, data: {} };
        }
        
        // Intentar parsear según el tipo de contenido
        if (contentType.includes('application/json')) {
          try {
            const data = JSON.parse(responseText);
            console.log('Datos JSON parseados:', data);
            
            // Normalizar la respuesta a un formato consistente
            if (data.success === undefined) {
              return {
                success: true,
                data: data
              };
            }
            
            return data;
          } catch (parseError) {
            console.error('Error al parsear respuesta JSON a pesar de Content-Type:', parseError);
            console.log('Texto de respuesta que no se pudo parsear:', responseText);
          }
        } else {
          // Para respuestas no-JSON, intentamos parsear de todas formas
          try {
            const data = JSON.parse(responseText);
            console.log('Respuesta parseada como JSON a pesar del Content-Type:', data);
            return data;
          } catch (parseError) {
            console.log('Respuesta no es JSON, se procesará como texto plano');
          }
        }
        
        // Si llegamos aquí, no pudimos parsear como JSON
        return {
          success: true,
          data: { 
            _rawContent: responseText,
            _contentType: contentType,
            _status: responseCopy.status,
            _statusText: responseCopy.statusText
          },
          message: 'Respuesta no JSON procesada como texto'
        };
      } catch (error) {
        console.error('Error al procesar la respuesta del servidor:', error);
        throw new Error(`Error al procesar la respuesta del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    },
    onError: async (error: Error, method: Method) => {
      // Si el error es por token inválido o ausente, no mostrar en consola
      if (error.message === 'NO_TOKEN_AVAILABLE' || error.message === 'INVALID_TOKEN_FORMAT') {
        return;
      }

      // Si es error en refreshToken, manejar silenciosamente
      if (method.url.includes('/auth/refreshToken')) {
        tokenService.stopAutoRefresh();
        return;
      }

      // Verificar si es un error 401 (Unauthorized)
      if (error.message.includes('401')) {
        // Si estamos en una ruta que requiere autenticación pero no es refreshToken
        if (!method.url.includes('/auth/refreshToken')) {
          try {
            const renewed = await tokenService.refreshTokenIfNeeded();
            if (renewed) {
              throw new Error('TOKEN_REFRESHED');
            }
          } catch (refreshError) {
            // Si falla la renovación, limpiar todo silenciosamente
            tokenService.removeToken();
            localStorage.removeItem('auth_storage_type');
            return;
          }
        }
      }

      // Para otros tipos de errores, mantener el comportamiento actual
      throw error;
    },
  },
});

// Endpoints de autenticación
export const authAPI = {
  login: (data: LoginRequest) =>
    alovaInstance.Post<APIResponse<AuthResponse>>(
      API_CONFIG.endpoints.auth?.LOGIN || '/auth/login',
      data
    ),
  logout: () =>
    alovaInstance.Post<APIResponse>(
      API_CONFIG.endpoints.auth?.LOGOUT || '/auth/logout'
    ),
  refreshToken: () => {
    const currentToken = tokenService.getToken();
    if (!currentToken) {
      console.warn('No hay token disponible para renovar - refreshToken');
      return Promise.reject(new Error('NO_TOKEN_AVAILABLE'));
    }

    // Validar formato del token antes de enviarlo
    const cleanToken = currentToken.replace('Bearer ', '').trim();
    if (!cleanToken || cleanToken.split('.').length !== 3) {
      console.warn('Token con formato inválido detectado - refreshToken');
      tokenService.removeToken(); // Limpiar token inválido
      return Promise.reject(new Error('INVALID_TOKEN_FORMAT'));
    }

    return alovaInstance.Post<APIResponse<{token: string, renewed: boolean, expiresAt: number, user: any}>>(
      API_CONFIG.endpoints.auth?.REFRESH_TOKEN || `${API_CONFIG.baseURL}/auth/refreshToken`,
      { token: cleanToken }
    ).catch(error => {
      // Si hay error 401, limpiar el token y storage
      if (error.message.includes('401')) {
        console.warn('Error 401 en refreshToken - limpiando token');
        tokenService.removeToken();
        localStorage.removeItem('auth_storage_type');
      }
      throw error;
    });
  },
};

// Endpoints de usuarios
export const userAPI = {
  create: (data: { email: string; name: string }) =>
    alovaInstance.Post<APIResponse<User>>(
      '/users', // Endpoint fijo para compatibilidad
      data
    ),
  
  get: () => 
    alovaInstance.Get<APIResponse<User>>(
      '/users/me' // Endpoint fijo para compatibilidad
    ),
  
  update: (data: { name?: string }) =>
    alovaInstance.Put<APIResponse<User>>(
      '/users/me', // Endpoint fijo para compatibilidad
      data
    ),
  
  delete: () =>
    alovaInstance.Delete<APIResponse<{ message: string }>>(
      '/users/me' // Endpoint fijo para compatibilidad
    ),
};

// Endpoints de investigación
export const researchAPI = {
  create: (data: ResearchBasicData) => {
    // Crear una copia de los datos para no modificar el original
    const processedData = {...data};
    
    // Forzar el tipo 'behavioural' si es necesario para compatibilidad con el backend
    try {
      const originalType = String(processedData.type);
      if (originalType.toLowerCase().includes('behaviour') || originalType.toLowerCase().includes('behavioral')) {
        // Asignar un valor que el backend acepte
        processedData.type = 'behavioural' as any;
      }
    } catch (e) {
      // Error silencioso
    }
    
    return alovaInstance.Post<any>(
      API_CONFIG.endpoints.research.CREATE || '/research',
      processedData
    )
      .then(response => {
        // Verificar si la respuesta tiene el formato correcto con message y data (formato AWS)
        if (response && response.message && response.data) {
          // Asegurar que se mantenga la estructura original de AWS
          return {
            success: true,
            data: response.data, // Aquí está el objeto con id
            message: response.message,
            error: null
          };
        }
      
        // Verificar si la respuesta tiene solo data
        if (response && response.data) {
          return {
            success: true,
            data: response.data,
            error: null
          };
        }
      
        // Si la respuesta es el objeto directo (sin estructuras anidadas)
        if (response && typeof response === 'object' && !('data' in response) && !('message' in response)) {
          return {
            success: true,
            data: response,
            error: null
          };
        }
      
        // Si no tiene formato conocido pero parece válido, intentar devolverlo como está
        if (response) {
          return {
            success: true,
            data: response,
            error: null
          };
        }
      
        // Si no se encontraron datos válidos
        throw new Error('No se pudieron extraer datos válidos de la respuesta');
      })
      .catch(error => {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : String(error)
        };
      });
  },
  
  get: (id: string) => {
    const url = (API_CONFIG.endpoints.research.GET || '/research/{id}').replace('{id}', id);
    
    // Crear un método GET explícito
    const method = alovaInstance.Get<APIResponse<Research>>(url);
    
    return method;
  },
  
  list: () => {
    return alovaInstance.Get<APIResponse<Research[]>>(
      API_CONFIG.endpoints.research.LIST || '/research'
    );
  },
  
  update: (id: string, data: Partial<ResearchBasicData>) => {
    const url = (API_CONFIG.endpoints.research.UPDATE || '/research/{id}').replace('{id}', id);
    return alovaInstance.Put<APIResponse<Research>>(url, data);
  },
  
  delete: (id: string) => {
    const url = (API_CONFIG.endpoints.research.DELETE || '/research/{id}').replace('{id}', id);
    return alovaInstance.Delete<APIResponse<boolean>>(url);
  },
  
  updateStatus: (id: string, status: string) => {
    const url = (API_CONFIG.endpoints.research.UPDATE_STATUS || '/research/{id}/status').replace('{id}', id);
    return alovaInstance.Put<APIResponse<Research>>(url, { status });
  },
  
  updateStage: (id: string, stage: string, progress: number) => {
    const url = (API_CONFIG.endpoints.research.UPDATE_STAGE || '/research/{id}/stage').replace('{id}', id);
    return alovaInstance.Put<APIResponse<Research>>(url, { stage, progress });
  },
};

// Endpoints de pantalla de agradecimiento
export const thankYouScreenAPI = {
  create: (data: any) => {
    const url = API_CONFIG.endpoints.thankYouScreen.CREATE || '/thank-you-screens';
    console.log(`Endpoint CREATE thankYouScreen utilizado: ${url}`);
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    const url = (API_CONFIG.endpoints.thankYouScreen.GET_BY_RESEARCH || '/thank-you-screens/research/{researchId}').replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH thankYouScreen utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  getById: (id: string) => {
    const url = (API_CONFIG.endpoints.thankYouScreen.GET || '/thank-you-screens/{id}').replace('{id}', id);
    console.log(`Endpoint GET thankYouScreen utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  update: (id: string, data: any) => {
    const url = (API_CONFIG.endpoints.thankYouScreen.UPDATE || '/thank-you-screens/{id}').replace('{id}', id);
    console.log(`Endpoint UPDATE thankYouScreen utilizado: ${url}`);
    return alovaInstance.Put<any>(url, data);
  },
  
  delete: (id: string) => {
    const url = (API_CONFIG.endpoints.thankYouScreen.DELETE || '/thank-you-screens/{id}').replace('{id}', id);
    console.log(`Endpoint DELETE thankYouScreen utilizado: ${url}`);
    return alovaInstance.Delete<any>(url);
  }
};

// También API para eye tracking
export const eyeTrackingAPI = {
  create: (data: any) => {
    const url = API_CONFIG.endpoints.eyeTracking?.CREATE || '/eye-tracking';
    console.log(`Endpoint CREATE eyeTracking utilizado: ${url}`);
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    const url = (API_CONFIG.endpoints.eyeTracking?.GET_BY_RESEARCH || '/eye-tracking/research/{researchId}').replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH eyeTracking utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  update: (id: string, data: any) => {
    const url = (API_CONFIG.endpoints.eyeTracking?.UPDATE || '/eye-tracking/{id}').replace('{id}', id);
    console.log(`Endpoint UPDATE eyeTracking utilizado: ${url}`);
    return alovaInstance.Put<any>(url, data);
  }
};

// API para SmartVOC
export const smartVocAPI = {
  create: (data: any) => {
    const url = API_CONFIG.endpoints.smartVoc?.CREATE || '/smart-voc';
    console.log(`Endpoint CREATE smartVoc utilizado: ${url}`);
    
    // Verificar explícitamente que el researchId está presente y es válido
    if (!data || !data.researchId || typeof data.researchId !== 'string' || !data.researchId.trim()) {
      console.error('ERROR: researchId inválido o faltante en los datos enviados:', data);
      throw new Error('Se requiere un ID de investigación válido (researchId)');
    }
    
    // Construir URL completa
    const fullUrl = `${API_CONFIG.baseURL}${url}`;
    console.log('URL completa para crear SmartVOC:', fullUrl);
    
    // Imprimir los datos que se enviarán para depuración
    console.log('DEBUG - smartVocAPI.create - Datos a enviar:', {
      researchId: data.researchId,
      questionsCount: data.questions?.length || 0,
      randomizeQuestions: data.randomizeQuestions,
      smartVocRequired: data.smartVocRequired
    });
    
    // Crear un método POST explícito con el cuerpo de la solicitud correctamente formateado
    return alovaInstance.Post<any>(url, {
      ...data,
      // Asegurar que el researchId se envía correctamente
      researchId: data.researchId.trim()
    });
  },
  
  getByResearchId: (researchId: string) => {
    // La ruta correcta es /smart-voc/research/{researchId}/smart-voc debido al basePath del controlador
    const url = `/smart-voc/research/${researchId}/smart-voc`;
    console.log(`Endpoint GET_BY_RESEARCH smartVoc utilizado: ${url}`);
    console.log(`URL completa: ${API_CONFIG.baseURL}${url}`);
    
    return alovaInstance.Get<any>(url);
  },
  
  update: (id: string, data: any) => {
    const url = (API_CONFIG.endpoints.smartVoc?.UPDATE || '/smart-voc/{id}').replace('{id}', id);
    console.log(`Endpoint UPDATE smartVoc utilizado: ${url}`);
    
    return alovaInstance.Put<any>(url, data);
  }
};

// Manejar errores de API
export const handleAPIError = (error: unknown): string => {
  // Verificar si es un error 404 relacionado con investigación
  const is404Error = error instanceof Error && error.message.includes('404');
  const isResearchError = error instanceof Error && 
                         error.message.includes('/research/') &&
                         !error.message.includes('/smart-voc') &&
                         !error.message.includes('/eye-tracking') &&
                         !error.message.includes('/welcome-screen') &&
                         !error.message.includes('/thank-you-screen');
  
  // Solo registrar errores en consola si NO son 404 de investigación
  if (!(is404Error && isResearchError)) {
    console.error('Error en la solicitud (capturado por handleAPIError):', error);
  }
  
  // Verificar si es un error de CORS
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.error('Error de CORS detectado! No se puede acceder a la API directamente desde el navegador.');
    return 'Error de conexión: No se puede acceder a la API directamente. Recomendamos usar las rewrites de Next.js con /api.';
  }
  
  // Otros tipos de errores
  if (error instanceof Error) {
    return error.message || 'Error desconocido';
  }
  
  return 'Error desconocido al procesar la solicitud';
};

export default alovaInstance; 
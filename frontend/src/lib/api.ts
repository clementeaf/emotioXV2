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
  token?: string;
  auth?: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
    }
  };
  user?: {
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
      credentials: 'omit' // Omitir credenciales completamente para evitar CORS complejos
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
  timeout: 15000, // 15 segundos de timeout
  beforeRequest(method: Method) {
    // Configuración de headers
    method.config.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...method.config.headers,
    };

    // Obtener el token de autenticación
    const token = localStorage.getItem('token');
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }

    // Configuración específica para AWS API Gateway
    method.config.mode = 'cors';
    method.config.credentials = 'omit';
  },
  responded: {
    onSuccess: async (response: Response) => {
      try {
        const data = await response.json();
        return {
          success: true,
          data: data.data || data,
          message: data.message
        };
      } catch (error) {
        console.error('Error al procesar la respuesta:', error);
        throw error;
      }
    },
    onError: async (error: Error) => {
      console.error('Error en la petición:', error);
      throw error;
    }
  }
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
  
  getProfile: () => 
    alovaInstance.Get<APIResponse<User>>(
      API_CONFIG.endpoints.auth?.PROFILE || '/auth/profile'
    ),
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
        processedData.type = 'behavioural' as any;
      }
    } catch (e) {
      console.error('Error al procesar el tipo:', e);
    }
    
    // Usar la ruta correcta del endpoint
    return alovaInstance.Post<APIResponse<Research>>(
      API_CONFIG.endpoints.research.createResearch || '/research',
      processedData
    );
  },
  
  get: (id: string) => {
    const url = (API_CONFIG.endpoints.research.getResearch || '/research/{id}').replace('{id}', id);
    return alovaInstance.Get<APIResponse<Research>>(url);
  },
  
  list: () => {
    return alovaInstance.Get<APIResponse<Research[]>>(
      API_CONFIG.endpoints.research.getAllResearch || '/research'
    );
  },
  
  update: (id: string, data: Partial<ResearchBasicData>) => {
    const url = (API_CONFIG.endpoints.research.updateResearch || '/research/{id}').replace('{id}', id);
    return alovaInstance.Put<APIResponse<Research>>(url, data);
  },
  
  delete: (id: string) => {
    // Validar que el ID sea válido
    if (!id || id === 'undefined' || id === 'null') {
      console.error('Error: Intento de eliminar una investigación con ID inválido:', id);
      return Promise.reject(new Error('ID de investigación inválido'));
    }
    
    const url = (API_CONFIG.endpoints.research.deleteResearch || '/research/{id}').replace('{id}', id);
    console.log(`Eliminando investigación con ID ${id} en URL: ${url}`);
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

// Endpoints de pantalla de agradecimiento - REFACTORIZADO
export const thankYouScreenAPI = {
  create: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la pantalla de agradecimiento');
    }
    const urlTemplate = API_CONFIG.endpoints.thankYouScreen.CREATE || '/research/{researchId}/thank-you-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint CREATE thankYouScreen utilizado: ${url}`);
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    const urlTemplate = API_CONFIG.endpoints.thankYouScreen.GET_BY_RESEARCH || '/research/{researchId}/thank-you-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH thankYouScreen utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  update: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar la pantalla de agradecimiento');
    }
    const urlTemplate = API_CONFIG.endpoints.thankYouScreen.UPDATE || '/research/{researchId}/thank-you-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint UPDATE thankYouScreen utilizado: ${url}`);
    return alovaInstance.Put<any>(url, data);
  },
  
  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la pantalla de agradecimiento');
    }
    const urlTemplate = API_CONFIG.endpoints.thankYouScreen.DELETE || '/research/{researchId}/thank-you-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint DELETE thankYouScreen utilizado: ${url}`);
    return alovaInstance.Delete<any>(url);
  }
};

// API para eye tracking - REFACTORIZADO
export const eyeTrackingAPI = {
  create: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear eye tracking');
    }
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.CREATE || '/research/{researchId}/eye-tracking';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint CREATE eyeTracking utilizado: ${url}`);
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.GET_BY_RESEARCH || '/research/{researchId}/eye-tracking';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH eyeTracking utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  update: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar eye tracking');
    }
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.UPDATE || '/research/{researchId}/eye-tracking';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint UPDATE eyeTracking utilizado: ${url}`);
    return alovaInstance.Put<any>(url, data);
  },
  
  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar eye tracking');
    }
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.DELETE || '/research/{researchId}/eye-tracking';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint DELETE eyeTracking utilizado: ${url}`);
    return alovaInstance.Delete<any>(url);
  }
};

// API para Eye Tracking Recruit - AÑADIDO Y REFACTORIZADO
export const eyeTrackingRecruitAPI = {
  create: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear eye tracking recruit');
    }
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.RECRUIT_CREATE || '/research/{researchId}/eye-tracking-recruit';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint CREATE eyeTrackingRecruit utilizado: ${url}`);
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.RECRUIT_GET || '/research/{researchId}/eye-tracking-recruit';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH eyeTrackingRecruit utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  update: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar eye tracking recruit');
    }
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.RECRUIT_UPDATE || '/research/{researchId}/eye-tracking-recruit';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint UPDATE eyeTrackingRecruit utilizado: ${url}`);
    return alovaInstance.Put<any>(url, data);
  },
  
  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar eye tracking recruit');
    }
    // Asumimos que DELETE usa la misma ruta base, ya que no está explícito en API_CONFIG
    const urlTemplate = API_CONFIG.endpoints.eyeTracking?.RECRUIT_BASE_PATH || '/research/{researchId}/eye-tracking-recruit';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint DELETE eyeTrackingRecruit utilizado: ${url}`);
    return alovaInstance.Delete<any>(url);
  }
};

// API para SmartVOC - REFACTORIZADO
export const smartVocAPI = {
  create: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación válido (researchId)');
    }
    // Usar la ruta base y reemplazar {researchId}
    const urlTemplate = API_CONFIG.endpoints.smartVoc?.CREATE || '/research/{researchId}/smart-voc';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint CREATE smartVoc utilizado: ${url}`);
    
    // Crear un método POST explícito con el cuerpo de la solicitud
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    // Usar la ruta base y reemplazar {researchId}
    const urlTemplate = API_CONFIG.endpoints.smartVoc?.GET_BY_RESEARCH || '/research/{researchId}/smart-voc';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH smartVoc utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  update: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar SmartVOC');
    }
    // Usar la ruta base y reemplazar {researchId}
    const urlTemplate = API_CONFIG.endpoints.smartVoc?.UPDATE || '/research/{researchId}/smart-voc';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint UPDATE smartVoc utilizado: ${url}`);
    return alovaInstance.Put<any>(url, data);
  },

  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar SmartVOC');
    }
    // Usar la ruta base y reemplazar {researchId}
    const urlTemplate = API_CONFIG.endpoints.smartVoc?.DELETE || '/research/{researchId}/smart-voc';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint DELETE smartVoc utilizado: ${url}`);
    return alovaInstance.Delete<any>(url);
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

// API para pantallas de bienvenida - REFACTORIZADO Y CORREGIDO
export const welcomeScreenAPI = {
  create: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la pantalla de bienvenida');
    }
    // Usar la ruta base y reemplazar {researchId}
    const urlTemplate = API_CONFIG.endpoints.welcomeScreen.CREATE || '/research/{researchId}/welcome-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint CREATE welcomeScreen utilizado: ${url}`);
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    // Usar la ruta base y reemplazar {researchId} - Corregido
    const urlTemplate = API_CONFIG.endpoints.welcomeScreen.GET_BY_RESEARCH || '/research/{researchId}/welcome-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH welcomeScreen utilizado: ${url} con researchId:`, researchId);
    // Usar GET para obtener el recurso
    return alovaInstance.Get<any>(url);
  },
  
  update: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar la pantalla de bienvenida');
    }
    // Usar la ruta base y reemplazar {researchId}
    const urlTemplate = API_CONFIG.endpoints.welcomeScreen.UPDATE || '/research/{researchId}/welcome-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint UPDATE welcomeScreen utilizado: ${url} con researchId:`, researchId);
    // Usar PUT para actualizar el recurso
    return alovaInstance.Put<any>(url, data);
  },
  
  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la pantalla de bienvenida');
    }
    // Usar la ruta base y reemplazar {researchId}
    const urlTemplate = API_CONFIG.endpoints.welcomeScreen.DELETE || '/research/{researchId}/welcome-screen';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint DELETE welcomeScreen utilizado: ${url} con researchId:`, researchId);
    // Usar DELETE para eliminar el recurso
    return alovaInstance.Delete<any>(url);
  }
};

// API para Cognitive Task - AÑADIDO
export const cognitiveTaskAPI = {
  create: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la tarea cognitiva');
    }
    const urlTemplate = API_CONFIG.endpoints.cognitiveTask?.CREATE || '/research/{researchId}/cognitive-task';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint CREATE cognitiveTask utilizado: ${url}`);
    return alovaInstance.Post<any>(url, data);
  },
  
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    const urlTemplate = API_CONFIG.endpoints.cognitiveTask?.GET_BY_RESEARCH || '/research/{researchId}/cognitive-task';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint GET_BY_RESEARCH cognitiveTask utilizado: ${url}`);
    return alovaInstance.Get<any>(url);
  },
  
  update: (researchId: string, data: any) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar la tarea cognitiva');
    }
    const urlTemplate = API_CONFIG.endpoints.cognitiveTask?.UPDATE || '/research/{researchId}/cognitive-task';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint UPDATE cognitiveTask utilizado: ${url}`);
    return alovaInstance.Put<any>(url, data);
  },
  
  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la tarea cognitiva');
    }
    const urlTemplate = API_CONFIG.endpoints.cognitiveTask?.DELETE || '/research/{researchId}/cognitive-task';
    const url = urlTemplate.replace('{researchId}', researchId);
    console.log(`Endpoint DELETE cognitiveTask utilizado: ${url}`);
    return alovaInstance.Delete<any>(url);
  }
};

export default alovaInstance; 
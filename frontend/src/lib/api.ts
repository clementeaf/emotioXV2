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
    const url = (API_CONFIG.endpoints.research.deleteResearch || '/research/{id}').replace('{id}', id);
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
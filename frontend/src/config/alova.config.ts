import { createAlova } from 'alova';
import fetchAdapter from 'alova/fetch';
import ReactHook from 'alova/react';
import API_CONFIG from '@/config/api.config';

// Función para obtener el token de autenticación
const getToken = () => {
  if (typeof window !== 'undefined') {
    // Verificar el tipo de almacenamiento utilizado
    const storageType = localStorage.getItem('auth_storage_type') || 'local';
    
    // Obtener token del almacenamiento correspondiente
    return storageType === 'local'
      ? localStorage.getItem('token') || ''
      : sessionStorage.getItem('token') || '';
  }
  return '';
};

// Creación de la instancia de alova
export const alovaInstance = createAlova({
  // Configuración del adaptador de solicitud (en este caso Fetch API)
  requestAdapter: fetchAdapter(),
  
  // URL base para todas las solicitudes - usando la configuración dinámica de API_CONFIG
  baseURL: API_CONFIG.baseURL,
  
  // Usar hooks de React para manejar el estado
  statesHook: ReactHook,
  
  // Configuración global para todas las solicitudes
  beforeRequest(method) {
    // Obtener la configuración del método
    const config = method.config;
    // Inicializar headers si no existe
    config.headers = config.headers || {}; 
    
    // Agregar el token de autorización a todas las solicitudes
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Asegurarse de que solo usamos los headers esenciales
    // Para evitar problemas con CORS
    const safeHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    // Sobreescribir headers con solo los seguros
    config.headers = safeHeaders;
    
    // Configuración específica para CORS
    method.config.credentials = 'omit';
    
    // Prevenir cualquier URL incorrecta que se haya formado
    if (typeof method.url === 'string') {
      // Si la URL contiene localhost, reemplazarla
      if (method.url.includes('localhost')) {
        const cleanedPath = method.url.replace(/http:\/\/localhost:[0-9]+\/api/, '');
        method.url = cleanedPath;
        console.warn('⚠️ Se detectó y corrigió una URL con localhost');
      }
      
      // Si la URL comienza con /api, quitar ese prefijo
      if (method.url.startsWith('/api')) {
        method.url = method.url.substring(4);
        console.warn('⚠️ Se corrigió una URL con prefijo /api');
      }
    }
    
    // Mostrar URL completa para depuración
    console.log(`Alova: Preparando solicitud a URL: ${method.baseURL}${method.url}`);
    console.log('Headers enviados:', JSON.stringify(config.headers));
  },
  
  // Transformación de respuesta
  responded: {
    onSuccess(response) {
      console.log('Alova: Respuesta HTTP exitosa', response.status, response.statusText);
      
      // Manejo especial para 404 - lo tratamos como un caso especial en lugar de un error
      if (response.status === 404) {
        // Para 404, simplemente devolvemos un objeto vacío sin lanzar error
        console.log('Alova: Recurso no encontrado (404) - No es un error crítico');
        return Promise.resolve({ data: null, success: false, notFound: true });
      }
      
      // Para otros errores HTTP, seguimos lanzando un error
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      return response.json().then(json => {
        console.log('Alova: Respuesta recibida', json);
        // Si la respuesta tiene un formato estándar {data: {...}}
        if (json && json.data !== undefined) {
          return json;
        }
        // Si la respuesta es directamente el objeto de datos
        return { data: json };
      }).catch(error => {
        console.error('Error al procesar JSON:', error);
        throw new Error('Error al procesar la respuesta del servidor');
      });
    },
    onError(error) {
      console.error('Alova: Error en la solicitud', error);
      
      if (error instanceof Response) {
        return error.text().then(text => {
          console.error('Respuesta de error completa:', text);
          try {
            // Intenta parsear como JSON
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || errorData.error || `Error ${error.status}: ${error.statusText}`);
          } catch (jsonError) {
            // Si no es JSON, devuelve el texto del error
            throw new Error(`Error en la solicitud: ${error.status} ${error.statusText} - ${text.substring(0, 100)}...`);
          }
        }).catch(textError => {
          throw new Error(`Error ${error.status}: ${error.statusText}`);
        });
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Error desconocido en la solicitud');
      }
    }
  }
});

// Exportar métodos de API por dominio
export const welcomeScreenAPI = {
  getByResearchId: (researchId: string) => 
    alovaInstance.Get(API_CONFIG.endpoints.welcomeScreen.GET_BY_RESEARCH.replace('{researchId}', researchId)),
  
  getById: (id: string) => 
    alovaInstance.Get(API_CONFIG.endpoints.welcomeScreen.GET.replace('{id}', id)),
  
  create: (data: any) => 
    alovaInstance.Post(API_CONFIG.endpoints.welcomeScreen.CREATE, data),
  
  update: (id: string, data: any) => 
    alovaInstance.Put(API_CONFIG.endpoints.welcomeScreen.UPDATE.replace('{id}', id), data),
  
  delete: (id: string) => 
    alovaInstance.Delete(API_CONFIG.endpoints.welcomeScreen.DELETE.replace('{id}', id)),
};

export const researchAPI = {
  getAll: () => 
    alovaInstance.Get(API_CONFIG.endpoints.research.LIST),
  
  getById: (id: string) => 
    alovaInstance.Get(API_CONFIG.endpoints.research.GET.replace('{id}', id)),
  
  create: (data: any) => 
    alovaInstance.Post(API_CONFIG.endpoints.research.CREATE, data),
  
  update: (id: string, data: any) => 
    alovaInstance.Put(API_CONFIG.endpoints.research.UPDATE.replace('{id}', id), data),
  
  delete: (id: string) => 
    alovaInstance.Delete(API_CONFIG.endpoints.research.DELETE.replace('{id}', id)),
  
  updateStatus: (id: string, status: string) => 
    alovaInstance.Put(API_CONFIG.endpoints.research.UPDATE_STATUS.replace('{id}', id), { status }),
  
  updateStage: (id: string, stage: string) => 
    alovaInstance.Put(API_CONFIG.endpoints.research.UPDATE_STAGE.replace('{id}', id), { stage }),
}; 
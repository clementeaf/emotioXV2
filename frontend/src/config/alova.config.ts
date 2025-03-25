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
  
  // URL base para todas las solicitudes - usando URL directa de AWS
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
    
    // Mostrar URL completa para depuración
    console.log(`Alova: Preparando solicitud a URL completa: ${method.baseURL}${method.url}`);
    console.log('Headers enviados:', JSON.stringify(config.headers));
  },
  
  // Transformación de respuesta
  responded: {
    onSuccess(response) {
      console.log('Alova: Respuesta HTTP exitosa', response.status, response.statusText);
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
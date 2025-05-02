import { 
  EyeTrackingConfig,
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitStats,
  EyeTrackingRecruitResponse,
  EyeTrackingRecruitRequest
} from '../interfaces/eyeTracking';
import alovaInstance from '@/lib/api';
import API_CONFIG from '@/config/api.config';
import { ApiEndpointManager } from '@/config/api-client';

// Crear una instancia del gestor de endpoints para usar sus funciones
const endpointManager = new ApiEndpointManager();

/**
 * API para configurar el módulo de EyeTracking usando AlovaJS
 */
export const eyeTrackingAPI = {
  /**
   * Obtiene la configuración de EyeTracking para Build
   */
  getEyeTrackingConfig: (researchId: string) => {
    // Usar endpoints definidos y el gestor para obtener la URL completa
    const url = endpointManager.getEndpoint('eyeTracking', 'GET_BY_RESEARCH', { researchId });
    const method = alovaInstance.Get(url);
    
    // Para solucionar problemas de CORS, eliminamos headers problemáticos
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Actualiza la configuración de EyeTracking para Build
   */
  updateEyeTrackingConfig: (researchId: string, config: EyeTrackingConfig) => {
    // Usar endpoints definidos y el gestor para obtener la URL completa
    const url = endpointManager.getEndpoint('eyeTracking', 'UPDATE', { researchId });
    const method = alovaInstance.Put(url, config);
    
    // Para solucionar problemas de CORS, eliminamos headers problemáticos
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Obtiene la configuración de reclutamiento de EyeTracking
   */
  getEyeTrackingRecruitConfig: (researchId: string) => {
    // Usar endpoints definidos y el gestor para obtener la URL completa
    const url = endpointManager.getEndpoint('eyeTracking', 'RECRUIT_GET', { researchId });
    const method = alovaInstance.Get(url);
    
    // Para solucionar problemas de CORS, eliminamos headers problemáticos
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Actualiza la configuración de reclutamiento de EyeTracking
   */
  updateEyeTrackingRecruitConfig: (request: EyeTrackingRecruitRequest) => {
    const { researchId, config } = request;
    
    // Usar endpoints definidos y el gestor para obtener la URL completa
    const url = endpointManager.getEndpoint('eyeTracking', 'RECRUIT_UPDATE', { researchId });
    const method = alovaInstance.Put(url, config);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Crea una nueva configuración de reclutamiento de EyeTracking
   */
  createEyeTrackingRecruitConfig: (request: EyeTrackingRecruitRequest) => {
    const { researchId, config } = request;
    
    // Usar endpoints definidos y el gestor para obtener la URL completa
    const url = endpointManager.getEndpoint('eyeTracking', 'RECRUIT_CREATE', { researchId });
    const method = alovaInstance.Post(url, config);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Obtiene las estadísticas actuales de reclutamiento
   */
  getEyeTrackingRecruitStats: (researchId: string) => {
    // Construir URL para estadísticas usando la ruta base y añadiendo /summary
    const basePath = API_CONFIG.endpoints.eyeTracking.RECRUIT_BASE_PATH;
    const url = `${API_CONFIG.baseURL}${basePath.replace('{researchId}', researchId)}/summary`;
    const method = alovaInstance.Get(url);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Genera un enlace de reclutamiento nuevo
   */
  generateRecruitmentLink: (configId: string) => {
    // Construir URL usando patrón consistente para configuración específica
    const url = `${API_CONFIG.baseURL}/eye-tracking-recruit/config/${configId}/link`;
    const method = alovaInstance.Post(url, {});
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Obtiene los enlaces activos para una configuración
   */
  getActiveLinks: (configId: string) => {
    // Construir URL usando patrón consistente para configuración específica
    const url = `${API_CONFIG.baseURL}/eye-tracking-recruit/config/${configId}/links`;
    const method = alovaInstance.Get(url);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Obtiene las estadísticas para una configuración específica
   */
  getConfigStats: (configId: string) => {
    // Construir URL usando patrón consistente para configuración específica
    const url = `${API_CONFIG.baseURL}/eye-tracking-recruit/config/${configId}/stats`;
    const method = alovaInstance.Get(url);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  }
}; 
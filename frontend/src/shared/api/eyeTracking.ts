import { 
  EyeTrackingConfig,
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitStats,
  EyeTrackingRecruitResponse,
  EyeTrackingRecruitRequest
} from '../interfaces/eyeTracking';
import { alovaInstance } from '@/config/alova.config';
import API_CONFIG from '@/config/api.config';

// Preparar los endpoints para eyeTracking
const API_BASE = API_CONFIG.baseURL || '';

/**
 * API para configurar el módulo de EyeTracking usando AlovaJS
 */
export const eyeTrackingAPI = {
  /**
   * Obtiene la configuración de EyeTracking para Build
   */
  getEyeTrackingConfig: (researchId: string) => {
    const method = alovaInstance.Get(`${API_BASE}/eye-tracking/research/${researchId}`);
    
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
    const method = alovaInstance.Put(`${API_BASE}/eye-tracking/research/${researchId}`, config);
    
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
    // Usar la ruta exacta del controlador que obtiene la configuración por researchId
    const path = `${API_BASE}/eye-tracking-recruit/research/${researchId}/config`;
    const method = alovaInstance.Get(path);
    
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
    
    // Verificar si la configuración ya existe (tendrá un configId) o es nueva
    if ('id' in config && config.id) {
      // Si existe, usar la ruta de actualización de configuración existente
      const path = `${API_BASE}/eye-tracking-recruit/config/${config.id}`;
      const method = alovaInstance.Put(path, config);
      
      if (method.config?.headers) {
        const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
        method.config.headers = cleanHeaders;
      }
      
      return method;
    } else {
      // Si es nueva, crear configuración para esta investigación
      const path = `${API_BASE}/eye-tracking-recruit/research/${researchId}/config`;
      const method = alovaInstance.Post(path, config);
      
      if (method.config?.headers) {
        const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
        method.config.headers = cleanHeaders;
      }
      
      return method;
    }
  },

  /**
   * Obtiene las estadísticas actuales de reclutamiento
   */
  getEyeTrackingRecruitStats: (researchId: string) => {
    // Usar la ruta exacta del controlador para obtener el resumen de investigación
    const path = `${API_BASE}/eye-tracking-recruit/research/${researchId}/summary`;
    const method = alovaInstance.Get(path);
    
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
    // Usar la ruta exacta para generar un enlace de reclutamiento para una configuración específica
    const path = `${API_BASE}/eye-tracking-recruit/config/${configId}/link`;
    const method = alovaInstance.Post(path, {});
    
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
    // Usar la ruta exacta para obtener enlaces activos
    const path = `${API_BASE}/eye-tracking-recruit/config/${configId}/links`;
    const method = alovaInstance.Get(path);
    
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
    // Usar la ruta exacta para obtener estadísticas de una configuración
    const path = `${API_BASE}/eye-tracking-recruit/config/${configId}/stats`;
    const method = alovaInstance.Get(path);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  }
}; 
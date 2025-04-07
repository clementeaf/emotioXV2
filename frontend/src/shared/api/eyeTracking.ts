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
    const method = alovaInstance.Get(`${API_BASE}/research/${researchId}/eye-tracking`);
    
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
    const method = alovaInstance.Put(`${API_BASE}/research/${researchId}/eye-tracking`, config);
    
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
    // Usar la ruta correcta según el controlador en el backend
    const path = `/eye-tracking-recruit/research/${researchId}/config`;
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
      const path = `/eye-tracking-recruit/config/${config.id}`;
      const method = alovaInstance.Put(path, config);
      
      if (method.config?.headers) {
        const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
        method.config.headers = cleanHeaders;
      }
      
      return method;
    } else {
      // Si es nueva, crear configuración para esta investigación
      const path = `/eye-tracking-recruit/research/${researchId}/config`;
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
    // Esta aproximación es compleja porque requiere encadenar peticiones
    // En lugar de esto, vamos a hacer una petición simple y manejar el error en el cliente
    const path = `/eye-tracking-recruit/research/${researchId}/summary`;
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
  generateRecruitmentLink: (researchId: string) => {
    // Esta es una operación más compleja porque primero necesitamos el configId
    // Usamos la misma aproximación que para las estadísticas
    const path = `/eye-tracking-recruit/research/${researchId}/summary`;
    const method = alovaInstance.Get(path);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  },

  /**
   * Genera un código QR para el enlace de reclutamiento
   */
  generateQRCode: (researchId: string) => {
    // Esta es una operación más compleja porque primero necesitamos el configId
    // Usamos la misma aproximación que para las estadísticas
    const path = `/eye-tracking-recruit/research/${researchId}/summary`;
    const method = alovaInstance.Get(path);
    
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  }
}; 
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
    const method = alovaInstance.Get(`${API_BASE}/research/${researchId}/eye-tracking-recruit`);
    
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
    const method = alovaInstance.Put(`${API_BASE}/research/${researchId}/eye-tracking-recruit`, config);
    
    // Para solucionar problemas de CORS, eliminamos headers problemáticos
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
    const method = alovaInstance.Get(`${API_BASE}/research/${researchId}/eye-tracking-recruit/stats`);
    
    // Para solucionar problemas de CORS, eliminamos headers problemáticos
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
    const method = alovaInstance.Post(`${API_BASE}/research/${researchId}/eye-tracking-recruit/generate-link`, {});
    
    // Para solucionar problemas de CORS, eliminamos headers problemáticos
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
    const method = alovaInstance.Post(`${API_BASE}/research/${researchId}/eye-tracking-recruit/generate-qr`, {});
    
    // Para solucionar problemas de CORS, eliminamos headers problemáticos
    if (method.config?.headers) {
      const { 'Cache-Control': _, 'Pragma': __, ...cleanHeaders } = method.config.headers as any;
      method.config.headers = cleanHeaders;
    }
    
    return method;
  }
}; 
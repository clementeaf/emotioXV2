import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import alovaInstance from '@/lib/api';
import {
  EyeTrackingConfig,
  EyeTrackingRecruitRequest
} from '../interfaces/eyeTracking';

/**
 * API para configurar el módulo de EyeTracking usando AlovaJS
 */
export const eyeTrackingAPI = {
  /**
   * Obtiene la configuración de EyeTracking para Build
   */
  getEyeTrackingConfig: (researchId: string) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTracking.getByResearch.replace('{researchId}', researchId)}`;
    const method = alovaInstance.Get(url);
    return method;
  },

  /**
   * Actualiza la configuración de EyeTracking para Build
   */
  updateEyeTrackingConfig: (researchId: string, config: EyeTrackingConfig) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTracking.update.replace('{researchId}', researchId)}`;
    const method = alovaInstance.Put(url, config);
    return method;
  },

  /**
   * Obtiene la configuración de reclutamiento de EyeTracking
   */
  getEyeTrackingRecruitConfig: (researchId: string) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTrackingRecruit.getConfigByResearch.replace('{researchId}', researchId)}`;
    const method = alovaInstance.Get(url);
    return method;
  },

  /**
   * Actualiza la configuración de reclutamiento de EyeTracking
   */
  updateEyeTrackingRecruitConfig: (request: EyeTrackingRecruitRequest) => {
    const { researchId, config } = request;
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTrackingRecruit.updateConfig.replace('{researchId}', researchId)}`;
    const method = alovaInstance.Put(url, config);
    return method;
  },

  /**
   * Crea una nueva configuración de reclutamiento de EyeTracking
   */
  createEyeTrackingRecruitConfig: (request: EyeTrackingRecruitRequest) => {
    const { researchId, config } = request;
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTrackingRecruit.createConfig.replace('{researchId}', researchId)}`;
    const method = alovaInstance.Post(url, config);
    return method;
  },

  /**
   * Obtiene las estadísticas actuales de reclutamiento
   */
  getEyeTrackingRecruitStats: (researchId: string) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTrackingRecruit.getResearchSummary.replace('{researchId}', researchId)}`;
    const method = alovaInstance.Get(url);
    return method;
  },

  /**
   * Genera un enlace de reclutamiento nuevo
   */
  generateRecruitmentLink: (configId: string) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTrackingRecruit.generateLink.replace('{configId}', configId)}`;
    const method = alovaInstance.Post(url, {});
    return method;
  },

  /**
   * Obtiene los enlaces activos para una configuración
   */
  getActiveLinks: (configId: string) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTrackingRecruit.getActiveLinks.replace('{configId}', configId)}`;
    const method = alovaInstance.Get(url);
    return method;
  },

  /**
   * Obtiene las estadísticas para una configuración específica
   */
  getConfigStats: (configId: string) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.eyeTrackingRecruit.getStats.replace('{configId}', configId)}`;
    const method = alovaInstance.Get(url);
    return method;
  }
};

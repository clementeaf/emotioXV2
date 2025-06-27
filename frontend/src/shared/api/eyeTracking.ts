import { apiClient } from '@/lib/api';
import {
    EyeTrackingConfig,
    EyeTrackingRecruitRequest
} from '../interfaces/eyeTracking';

/**
 * API para configurar el módulo de EyeTracking usando apiClient
 */
export const eyeTrackingAPI = {
  /**
   * Obtiene la configuración de EyeTracking para Build
   */
  getEyeTrackingConfig: (researchId: string) => {
    return apiClient.get('eyeTracking', 'getByResearch', { researchId });
  },

  /**
   * Actualiza la configuración de EyeTracking para Build
   */
  updateEyeTrackingConfig: (researchId: string, config: EyeTrackingConfig) => {
    return apiClient.put('eyeTracking', 'update', config, { researchId });
  },

  /**
   * Obtiene la configuración de reclutamiento de EyeTracking
   */
  getEyeTrackingRecruitConfig: (researchId: string) => {
    return apiClient.get('eyeTrackingRecruit', 'getConfigByResearch', { researchId });
  },

  /**
   * Actualiza la configuración de reclutamiento de EyeTracking
   */
  updateEyeTrackingRecruitConfig: (request: EyeTrackingRecruitRequest) => {
    const { researchId, config } = request;
    return apiClient.put('eyeTrackingRecruit', 'updateConfig', config, { researchId });
  },

  /**
   * Crea una nueva configuración de reclutamiento de EyeTracking
   */
  createEyeTrackingRecruitConfig: (request: EyeTrackingRecruitRequest) => {
    const { researchId, config } = request;
    return apiClient.post('eyeTrackingRecruit', 'createConfig', config, { researchId });
  },

  /**
   * Obtiene las estadísticas actuales de reclutamiento
   */
  getEyeTrackingRecruitStats: (researchId: string) => {
    return apiClient.get('eyeTrackingRecruit', 'getResearchSummary', { researchId });
  },

  /**
   * Genera un enlace de reclutamiento nuevo
   */
  generateRecruitmentLink: (configId: string) => {
    return apiClient.post('eyeTrackingRecruit', 'generateLink', {}, { configId });
  },

  /**
   * Obtiene los enlaces activos para una configuración
   */
  getActiveLinks: (configId: string) => {
    return apiClient.get('eyeTrackingRecruit', 'getActiveLinks', { configId });
  },

  /**
   * Obtiene las estadísticas para una configuración específica
   */
  getConfigStats: (configId: string) => {
    return apiClient.get('eyeTrackingRecruit', 'getStats', { configId });
  }
};

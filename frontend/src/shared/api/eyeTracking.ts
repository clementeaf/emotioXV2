import axios from 'axios';
import { 
  EyeTrackingConfig,
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitStats,
  EyeTrackingRecruitResponse,
  EyeTrackingRecruitRequest
} from '../interfaces/eyeTracking';

const API_BASE = '/api/research';

// Función utilitaria para manejar respuestas
const handleResponse = <T>(response: any): T => {
  return response.data;
};

/**
 * API para configurar el módulo de EyeTracking
 */
export const eyeTrackingAPI = {
  /**
   * Obtiene la configuración de EyeTracking para Build
   */
  getEyeTrackingConfig: async (researchId: string): Promise<EyeTrackingConfig> => {
    try {
      const response = await axios.get(`${API_BASE}/${researchId}/eye-tracking`);
      return handleResponse<EyeTrackingConfig>(response);
    } catch (error) {
      console.error('Error al obtener configuración de eye tracking:', error);
      throw error;
    }
  },

  /**
   * Actualiza la configuración de EyeTracking para Build
   */
  updateEyeTrackingConfig: async (researchId: string, config: EyeTrackingConfig): Promise<void> => {
    try {
      await axios.put(`${API_BASE}/${researchId}/eye-tracking`, config);
    } catch (error) {
      console.error('Error al actualizar configuración de eye tracking:', error);
      throw error;
    }
  },

  /**
   * Obtiene la configuración de reclutamiento de EyeTracking
   */
  getEyeTrackingRecruitConfig: async (researchId: string): Promise<EyeTrackingRecruitResponse> => {
    try {
      const response = await axios.get(`${API_BASE}/${researchId}/eye-tracking-recruit`);
      return handleResponse<EyeTrackingRecruitResponse>(response);
    } catch (error) {
      console.error('Error al obtener configuración de reclutamiento eye tracking:', error);
      throw error;
    }
  },

  /**
   * Actualiza la configuración de reclutamiento de EyeTracking
   */
  updateEyeTrackingRecruitConfig: async (
    request: EyeTrackingRecruitRequest
  ): Promise<EyeTrackingRecruitResponse> => {
    try {
      const { researchId, config } = request;
      const response = await axios.put(`${API_BASE}/${researchId}/eye-tracking-recruit`, config);
      return handleResponse<EyeTrackingRecruitResponse>(response);
    } catch (error) {
      console.error('Error al actualizar configuración de reclutamiento eye tracking:', error);
      throw error;
    }
  },

  /**
   * Obtiene las estadísticas actuales de reclutamiento
   */
  getEyeTrackingRecruitStats: async (researchId: string): Promise<EyeTrackingRecruitStats> => {
    try {
      const response = await axios.get(`${API_BASE}/${researchId}/eye-tracking-recruit/stats`);
      return handleResponse<EyeTrackingRecruitStats>(response);
    } catch (error) {
      console.error('Error al obtener estadísticas de reclutamiento eye tracking:', error);
      throw error;
    }
  },

  /**
   * Genera un enlace de reclutamiento nuevo
   */
  generateRecruitmentLink: async (researchId: string): Promise<string> => {
    try {
      const response = await axios.post(`${API_BASE}/${researchId}/eye-tracking-recruit/generate-link`);
      return response.data.link;
    } catch (error) {
      console.error('Error al generar enlace de reclutamiento:', error);
      throw error;
    }
  },

  /**
   * Genera un código QR para el enlace de reclutamiento
   */
  generateQRCode: async (researchId: string): Promise<string> => {
    try {
      const response = await axios.post(`${API_BASE}/${researchId}/eye-tracking-recruit/generate-qr`);
      return response.data.qrImageUrl;
    } catch (error) {
      console.error('Error al generar código QR:', error);
      throw error;
    }
  }
}; 
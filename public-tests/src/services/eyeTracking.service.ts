import { APIResponse } from '../lib/types';
import { APIStatus } from '../lib/api';
import { EyeTrackingFormData } from '../../../shared/interfaces/eye-tracking.interface';

/**
 * URL base de la API
 */
const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Servicio para interactuar con el módulo de Eye Tracking
 */
export const eyeTrackingService = {
  /**
   * Obtiene la configuración de seguimiento ocular para un estudio específico
   * @param researchId ID de la investigación
   * @param token Token de autenticación del participante
   * @returns Promesa con la respuesta de la API que contiene los datos de EyeTrackingFormData
   */
  async getEyeTrackingConfig(researchId: string, token: string): Promise<APIResponse<EyeTrackingFormData>> {
    if (!researchId) {
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: 'Se requiere un ID de investigación para obtener eye tracking'
      };
    }

    try {
      const url = `/research/${researchId}/eye-tracking`;
      console.log(`[EyeTrackingService] Obteniendo configuración con researchId ${researchId}, URL: ${API_BASE_URL}${url}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers
      });

      let responseData: any = null;
      try {
        if (response.headers.get('content-length') !== '0') {
          responseData = await response.json();
        }
      } catch (e) {
        console.error(`[EyeTrackingService] Error parseando JSON:`, e);
        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.SERVER_ERROR,
          message: `Error del servidor: Respuesta inválida (status ${response.status})`
        };
      }

      if (!response.ok) {
        // Si hay error 404, simplemente indicamos que no se encontraron datos
        if (response.status === 404) {
          return {
            data: null,
            notFound: true,
            status: response.status,
            apiStatus: APIStatus.NOT_FOUND,
            message: responseData?.message || 'Configuración de Eye Tracking no encontrada'
          };
        }

        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: responseData?.message || `Error HTTP: ${response.status}`
        };
      }

      // Si hay datos en la respuesta, los extraemos del campo data si existe
      const data = responseData?.data || responseData;
      console.log('[EyeTrackingService] Datos obtenidos:', data);
      
      return {
        data,
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      console.error('[EyeTrackingService] Error:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          data: null,
          error: true,
          apiStatus: APIStatus.NETWORK_ERROR,
          message: 'Error de conexión: verifica tu conexión a internet'
        };
      }

      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}; 
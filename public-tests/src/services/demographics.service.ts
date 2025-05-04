import { DemographicsSection, DEFAULT_DEMOGRAPHICS_CONFIG } from '../types/demographics';
import { APIResponse } from '../lib/types';
import { APIStatus } from '../lib/api';

/**
 * URL base de la API
 */
const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Servicio para manejar las preguntas demográficas
 */
export const demographicsService = {
  /**
   * Obtiene la configuración de preguntas demográficas para un estudio
   * @param researchId ID de la investigación
   * @param token Token de autenticación del participante
   * @returns Promesa con la configuración de preguntas demográficas
   */
  async getDemographicsConfig(researchId: string, token: string): Promise<APIResponse<DemographicsSection>> {
    if (!researchId) {
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: 'Se requiere un ID de investigación para obtener preguntas demográficas'
      };
    }

    try {
      const url = `/research/${researchId}/demographics`;
      console.log(`[DemographicsService] Obteniendo configuración con researchId ${researchId}, URL: ${API_BASE_URL}${url}`);
      
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

      // Si obtenemos un error 404, devolvemos la configuración por defecto
      // En un entorno real, podríamos verificar si realmente queremos este fallback
      if (response.status === 404) {
        console.log('[DemographicsService] No se encontró configuración, utilizando valores por defecto');
        return {
          data: DEFAULT_DEMOGRAPHICS_CONFIG,
          status: 200,
          apiStatus: APIStatus.SUCCESS
        };
      }

      let responseData: any = null;
      try {
        if (response.headers.get('content-length') !== '0') {
          responseData = await response.json();
        }
      } catch (e) {
        console.error(`[DemographicsService] Error parseando JSON:`, e);
        return {
          data: DEFAULT_DEMOGRAPHICS_CONFIG, // Usar configuración por defecto como fallback
          status: 200,
          apiStatus: APIStatus.SUCCESS
        };
      }

      if (!response.ok) {
        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: responseData?.message || `Error HTTP: ${response.status}`
        };
      }

      // Si hay datos en la respuesta, asegurarnos de que la estructura sea correcta
      const data = responseData?.data || responseData;
      
      if (!data || !data.questions) {
        console.log('[DemographicsService] Datos de respuesta inválidos, utilizando valores por defecto');
        return {
          data: DEFAULT_DEMOGRAPHICS_CONFIG,
          status: 200,
          apiStatus: APIStatus.SUCCESS
        };
      }
      
      console.log('[DemographicsService] Datos obtenidos:', data);
      
      return {
        data,
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      console.error('[DemographicsService] Error:', error);
      
      // En caso de error, devolvemos la configuración por defecto para no bloquear el flujo
      return {
        data: DEFAULT_DEMOGRAPHICS_CONFIG,
        status: 200,
        apiStatus: APIStatus.SUCCESS
      };
    }
  },

  /**
   * Guarda las respuestas demográficas del participante
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @param responses Respuestas a las preguntas demográficas
   * @param token Token de autenticación
   * @returns Promesa con el resultado de la operación
   */
  async saveDemographicResponses(
    researchId: string,
    participantId: string,
    responses: any,
    token: string
  ): Promise<APIResponse<any>> {
    if (!researchId || !participantId) {
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: 'Se requiere el ID de investigación y el ID del participante'
      };
    }

    try {
      const url = `/research/${researchId}/participants/${participantId}/demographics`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(responses)
      });

      let responseData = null;
      try {
        if (response.headers.get('content-length') !== '0') {
          responseData = await response.json();
        }
      } catch (e) {
        console.error(`[DemographicsService] Error parseando JSON:`, e);
      }

      if (!response.ok) {
        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: responseData?.message || `Error HTTP: ${response.status}`
        };
      }

      return {
        data: responseData?.data || responseData,
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      console.error('[DemographicsService] Error:', error);
      
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}; 
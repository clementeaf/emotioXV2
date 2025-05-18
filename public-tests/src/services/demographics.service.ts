import { DemographicsSection, DemographicResponses } from '../types/demographics';
import { APIResponse } from '../lib/types';
import { APIStatus, ApiClient } from '../lib/api';

/**
 * Interfaz para definir la estructura de un 'step' dentro de all_steps.
 */
interface StepDefinition {
  stepType?: string;
  type?: string;
  response?: unknown;
  id?: string;
  // Añade aquí otras propiedades que pueda tener un 'step' si son conocidas
}

/**
 * URL base de la API
 */
// const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev'; // Ya no se usa directamente aquí

// Nuevo tipo para la respuesta de getDemographicResponses
interface DemographicDataPayload {
  responses: DemographicResponses;
  documentId: string | null;
  demographicModuleResponseId: string | null;
}

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
  async getDemographicsConfig(researchId: string, token: string): Promise<APIResponse<DemographicsSection | null>> {
    if (!researchId) {
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: 'Se requiere un ID de investigación para obtener preguntas demográficas'
      };
    }

    try {
      const API_BASE_URL_CONFIG = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
      const url = `/research/${researchId}/demographics`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) { headers['Authorization'] = `Bearer ${token}`; }

      const response = await fetch(`${API_BASE_URL_CONFIG}${url}`, { method: 'GET', headers });

      if (response.status === 404) {
        return { // Configuración no encontrada
          data: null,
          error: true, // Considerar esto un error o un caso especial
          status: 404,
          apiStatus: APIStatus.NOT_FOUND,
          message: 'Configuración demográfica no encontrada para este estudio.'
        };
      }

      let responseData: unknown = null;
      try {
        if (response.headers.get('content-length') !== '0') {
          responseData = await response.json();
        }
      } catch (e) {
        return { // Error de parseo, no se puede usar la respuesta
          data: null,
          error: true,
          status: response.status, // O un código de error genérico si response.status no es relevante aquí
          apiStatus: APIStatus.ERROR,
          message: `Error parseando JSON de respuesta demográfica: ${e instanceof Error ? e.message : String(e)}`
        };
      }

      if (!response.ok) {
        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: (responseData && typeof responseData === 'object' && responseData !== null && 'message' in responseData)
            ? (responseData as { message?: string }).message || `Error HTTP obteniendo configuración demográfica: ${response.status}`
            : `Error HTTP obteniendo configuración demográfica: ${response.status}`
        };
      }

      const data = (responseData && typeof responseData === 'object' && responseData !== null && 'data' in responseData)
        ? (responseData as { data: DemographicsSection }).data
        : responseData;
      
      // Validar que la data obtenida tenga la estructura esperada (al menos la prop 'questions')
      if (!data || typeof (data as DemographicsSection).questions !== 'object' || (data as DemographicsSection).questions === null) {
        return { // Estructura de datos inesperada desde el backend
          data: null,
          error: true,
          status: response.status, // O un código de error de validación
          apiStatus: APIStatus.ERROR,
          message: 'La configuración demográfica recibida del backend no tiene la estructura esperada (falta questions).'
        };
      }
      
      // Asumimos que 'data' es ahora del tipo DemographicsSection
      return {
        data: data as DemographicsSection,
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      return { // Error de red u otro error inesperado
        data: null,
        error: true,
        status: 500, // Error genérico del servidor o de cliente
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido al obtener configuración demográfica.'
      };
    }
  },

  /**
   * Obtiene las respuestas demográficas de un participante
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @returns Promesa con las respuestas demográficas
   */
  async getDemographicResponses(
    researchId: string,
    participantId: string
  ): Promise<APIResponse<DemographicDataPayload>> {
    if (!researchId || !participantId) {
      return {
        data: { responses: {}, documentId: null, demographicModuleResponseId: null }, 
        error: true,
        apiStatus: APIStatus.ERROR,
        message: 'Se requiere el ID de investigación y el ID del participante'
      };
    }

    const apiClient = new ApiClient();

    try {
      const apiResponse = await apiClient.getModuleResponses(researchId, participantId);

      if (apiResponse.error || apiResponse.apiStatus !== APIStatus.SUCCESS || !apiResponse.data || (typeof apiResponse.data !== 'object') || apiResponse.data === null || !('data' in apiResponse.data)) {
        let message = apiResponse.message || 'No se encontraron respuestas o ocurrió un error.';
        const anidatedData = apiResponse.data as { status?: number } | undefined;
        const statusErrorCode = anidatedData?.status || apiResponse.status || (apiResponse.apiStatus === APIStatus.NOT_FOUND ? 404 : 500);

        if (apiResponse.apiStatus === APIStatus.NOT_FOUND || (anidatedData?.status === 404)) {
          message = 'No existen respuestas previas para este participante.';
        }
        return {
          data: { responses: {}, documentId: null, demographicModuleResponseId: null },
          error: apiResponse.error ?? true,
          status: statusErrorCode,
          apiStatus: apiResponse.apiStatus || APIStatus.ERROR,
          message
        };
      }

      const fullDocument = (typeof apiResponse.data === 'object' && apiResponse.data !== null && 'data' in apiResponse.data)
        ? (apiResponse.data as { data: { id: string, responses: StepDefinition[], [key: string]: unknown } }).data
        : { id: '', responses: [] };

      let demographicDataToReturn: DemographicResponses = {};
      let foundDocumentId: string | null = null;
      let foundDemographicModuleResponseId: string | null = null;

      if (typeof fullDocument === 'object' && fullDocument !== null && Array.isArray(fullDocument.responses)) {
        foundDocumentId = fullDocument.id;

        const demographicStepData = fullDocument.responses.find(
          (step: StepDefinition) => step.stepType === 'demographic'
        );

        if (demographicStepData && typeof demographicStepData.response === 'object' && demographicStepData.response !== null) {
          demographicDataToReturn = demographicStepData.response as DemographicResponses;
          foundDemographicModuleResponseId = demographicStepData.id || null;
        }
      } else {
        console.warn('[DemographicsService] Estructura de fullDocument (apiResponse.data.data) NO es la esperada o no contiene un array \'responses\'. \'fullDocument\' actual:', JSON.stringify(fullDocument, null, 2));
      }

      return {
        data: { responses: demographicDataToReturn, documentId: foundDocumentId, demographicModuleResponseId: foundDemographicModuleResponseId },
        status: apiResponse.status || 200,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      console.error('[DemographicsService] Error interno obteniendo/procesando respuestas demográficas:', error);
      return { 
        data: { responses: {}, documentId: null, demographicModuleResponseId: null }, 
        error: true, 
        status: 500,
        apiStatus: APIStatus.ERROR, 
        message: error instanceof Error ? error.message : 'Error desconocido al procesar respuestas demográficas.' 
      };
    }
  },
}; 
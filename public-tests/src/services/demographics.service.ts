import { APIStatus, ApiClient } from '../lib/api';
import { APIResponse } from '../lib/types';
import { DemographicDataPayload, DemographicResponseData, DemographicResponses, DemographicsSection, StepDefinition } from '../types/demographics';

/**
 * URL base de la API
 */
// const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev'; // Ya no se usa directamente aquí

/**
 * Servicio para manejar las preguntas demográficas
 */
export const demographicsService = {
  /**
   * Obtiene la configuración de preguntas demográficas para un estudio
   * Las preguntas demográficas están almacenadas en la configuración de Eye Tracking
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
      // Usar el endpoint de forms que ya existe y contiene la configuración de Eye Tracking
      const url = `/research/${researchId}/forms`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) { headers['Authorization'] = `Bearer ${token}`; }

      const response = await fetch(`${API_BASE_URL_CONFIG}${url}`, { method: 'GET', headers });

      if (response.status === 404) {
        return { // Configuración no encontrada
          data: null,
          error: true,
          status: 404,
          apiStatus: APIStatus.NOT_FOUND,
          message: 'Configuración de investigación no encontrada para este estudio.'
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
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: `Error parseando JSON de respuesta de configuración: ${e instanceof Error ? e.message : String(e)}`
        };
      }

      if (!response.ok) {
        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: (responseData && typeof responseData === 'object' && responseData !== null && 'message' in responseData)
            ? (responseData as { message?: string }).message || `Error HTTP obteniendo configuración: ${response.status}`
            : `Error HTTP obteniendo configuración: ${response.status}`
        };
      }

      // Extraer configuración demográfica de Eye Tracking Config
      const formsData = (responseData && typeof responseData === 'object' && responseData !== null && 'data' in responseData)
        ? (responseData as { data: any[] }).data
        : [];

      if (!Array.isArray(formsData)) {
        return {
          data: null,
          error: true,
          status: response.status,
          apiStatus: APIStatus.ERROR,
          message: 'La respuesta de configuración no tiene la estructura esperada.'
        };
      }

      // Buscar la configuración de Eye Tracking
      const eyeTrackingConfig = formsData.find(item =>
        item.originalSk === 'EYE_TRACKING_CONFIG' || item.sk === 'EYE_TRACKING_CONFIG'
      );

      if (!eyeTrackingConfig || !eyeTrackingConfig.config?.demographicQuestions) {
        return {
          data: null,
          error: true,
          status: 404,
          apiStatus: APIStatus.NOT_FOUND,
          message: 'No se encontró configuración demográfica en este estudio.'
        };
      }

             // Convertir la configuración de Eye Tracking a formato de DemographicsSection
       const demographicQuestions = eyeTrackingConfig.config.demographicQuestions;
       const demographicsSection: DemographicsSection = {
         enabled: true,
         title: 'Preguntas Demográficas',
         description: 'Por favor, complete las siguientes preguntas demográficas.',
         questions: {} as any // Usar any temporalmente para permitir indexación dinámica
       };

       // Mapear cada pregunta demográfica
       Object.entries(demographicQuestions).forEach(([key, config]: [string, any]) => {
         if (config && typeof config === 'object' && config.enabled) {
           (demographicsSection.questions as any)[key] = {
             id: key,
             enabled: config.enabled,
             required: config.required || false,
             title: this.getDemographicQuestionTitle(key),
             description: this.getDemographicQuestionDescription(key),
             options: config.options || []
           };
         }
       });

      return {
        data: demographicsSection,
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      return { // Error de red u otro error inesperado
        data: null,
        error: true,
        status: 500,
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido al obtener configuración demográfica.'
      };
    }
  },

  /**
   * Obtiene el título localizado para una pregunta demográfica
   */
  getDemographicQuestionTitle(key: string): string {
    const titles: Record<string, string> = {
      age: 'Edad',
      gender: 'Género',
      educationLevel: 'Nivel de Educación',
      country: 'País',
      householdIncome: 'Ingresos del Hogar',
      employmentStatus: 'Estado de Empleo',
      dailyHoursOnline: 'Horas Diarias en Línea',
      technicalProficiency: 'Competencia Técnica'
    };
    return titles[key] || key;
  },

  /**
   * Obtiene la descripción localizada para una pregunta demográfica
   */
  getDemographicQuestionDescription(key: string): string {
    const descriptions: Record<string, string> = {
      age: 'Seleccione su rango de edad',
      gender: 'Seleccione su género',
      educationLevel: 'Seleccione su nivel de educación más alto',
      country: 'Seleccione su país de residencia',
      householdIncome: 'Seleccione el rango de ingresos de su hogar',
      employmentStatus: 'Seleccione su estado de empleo actual',
      dailyHoursOnline: 'Seleccione cuántas horas pasa en línea diariamente',
      technicalProficiency: 'Seleccione su nivel de competencia técnica'
    };
    return descriptions[key] || '';
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
        data: { responses: demographicDataToReturn as DemographicResponseData, documentId: foundDocumentId, demographicModuleResponseId: foundDemographicModuleResponseId },
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

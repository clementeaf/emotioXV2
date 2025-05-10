import { DemographicsSection, DEFAULT_DEMOGRAPHICS_CONFIG, DemographicResponses } from '../types/demographics';
import { APIResponse } from '../lib/types';
import { APIStatus } from '../lib/api';

/**
 * Interfaz para definir la estructura de un 'step' dentro de all_steps.
 */
interface StepDefinition {
  stepType?: string;
  type?: string;
  responses?: any;
  answer?: any;
  // Añade aquí otras propiedades que pueda tener un 'step' si son conocidas
}

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
   * Obtiene las respuestas demográficas de un participante
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @param token Token de autenticación
   * @returns Promesa con las respuestas demográficas
   */
  async getDemographicResponses(
    researchId: string,
    participantId: string,
    token: string
  ): Promise<APIResponse<DemographicResponses>> {
    if (!researchId || !participantId) {
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: 'Se requiere el ID de investigación y el ID del participante'
      };
    }

    try {
      const url = `/research/${researchId}/participants/${participantId}/responses`;
      console.log(`[DemographicsService] Obteniendo respuestas de participante, URL: ${API_BASE_URL}${url}`);
      
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

      let responseData = null;
      try {
        if (response.headers.get('content-length') !== '0') {
          responseData = await response.json();
        }
      } catch (e) {
        console.error(`[DemographicsService] Error parseando JSON:`, e);
        return {
          data: {},
          error: true,
          apiStatus: APIStatus.ERROR,
          message: 'Error al procesar la respuesta del servidor'
        };
      }

      if (!response.ok) {
        // Si es 404, simplemente no hay datos guardados aún
        if (response.status === 404) {
          console.log('[DemographicsService] No se encontraron respuestas guardadas');
          return {
            data: {},
            status: 200,
            apiStatus: APIStatus.SUCCESS
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

      // Extrayendo los datos de respuesta
      const allResponses = responseData?.data || responseData;
      console.log('[DemographicsService] Todas las respuestas obtenidas:', allResponses);
      
      // Buscar específicamente el formulario demográfico
      let demographicData = {};
      
      // Si la respuesta es un array, buscar por tipo
      if (Array.isArray(allResponses)) {
        console.log('[DemographicsService] Respuesta es un array, buscando formulario demográfico...');
        const demographicForm = allResponses.find(form => 
          form.type === 'demographic' || 
          form.stepType === 'demographic' ||
          form.formType === 'demographic'
        );
        
        if (demographicForm) {
          console.log('[DemographicsService] Encontrado formulario demográfico:', demographicForm);
          demographicData = demographicForm.responses || demographicForm.answer || demographicForm;
        }
      } 
      // Si la respuesta tiene una propiedad 'modules' (estructura común en la aplicación)
      else if (allResponses && allResponses.modules) {
        console.log('[DemographicsService] Respuesta tiene estructura de módulos');
        
        // Buscar en la estructura de módulos
        if (allResponses.modules.demographic) {
          demographicData = allResponses.modules.demographic.responses || 
                            allResponses.modules.demographic.answer || 
                            allResponses.modules.demographic;
        } 
        // Buscar en all_steps si existe
        else if (Array.isArray(allResponses.modules.all_steps)) {
          const demographicStep = allResponses.modules.all_steps.find((step: StepDefinition) => 
            step.stepType === 'demographic' || 
            step.type === 'demographic'
          );
          
          if (demographicStep) {
            demographicData = demographicStep.responses || demographicStep.answer || demographicStep;
          }
        }
      }
      // Si directamente tiene la estructura del formulario demográfico
      else if (allResponses && (
        allResponses.type === 'demographic' || 
        allResponses.stepType === 'demographic' ||
        allResponses.formType === 'demographic'
      )) {
        demographicData = allResponses.responses || allResponses.answer || allResponses;
      }
      
      // Verificar si encontramos datos demográficos
      if (Object.keys(demographicData).length === 0) {
        console.log('[DemographicsService] No se encontraron respuestas demográficas específicas');
        return {
          data: {},
          status: 200,
          apiStatus: APIStatus.SUCCESS
        };
      }
      
      console.log('[DemographicsService] Respuestas demográficas extraídas:', demographicData);
      
      return {
        data: demographicData || {},
        status: response.status,
        apiStatus: APIStatus.SUCCESS
      };
    } catch (error) {
      console.error('[DemographicsService] Error obteniendo respuestas demográficas:', error);
      
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido'
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
  },

  /**
   * Actualiza las respuestas demográficas existentes de un participante
   * @param researchId ID de la investigación
   * @param participantId ID del participante
   * @param responses Respuestas actualizadas a las preguntas demográficas
   * @param token Token de autenticación
   * @returns Promesa con el resultado de la operación
   */
  async updateDemographicResponses(
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
        method: 'PUT',
        headers,
        body: JSON.stringify(responses)
      });

      let responseData = null;
      try {
        if (response.headers.get('content-length') !== '0') {
          responseData = await response.json();
        }
      } catch (e) {
        console.error(`[DemographicsService] Error parseando JSON de actualización:`, e);
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
      console.error('[DemographicsService] Error en actualización:', error);
      
      return {
        data: null,
        error: true,
        apiStatus: APIStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido en actualización'
      };
    }
  }
}; 
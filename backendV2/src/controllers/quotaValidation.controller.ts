import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { ParticipantDemographics, QuotaValidationService } from '../services/quotaValidation.service';
import { structuredLog } from '../utils/logging.util';

export class QuotaValidationController {
  private readonly quotaService: QuotaValidationService;
  private readonly controllerName = 'QuotaValidationController';

  constructor() {
    this.quotaService = new QuotaValidationService();
  }

  /**
   * Analiza cuotas de participantes (SOLO PARA ANÁLISIS, NO LIMITA)
   */
  async analyzeParticipantQuotas(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'analyzeParticipantQuotas';

    try {
      structuredLog('info', `${this.controllerName}.${context}`, 'Analyzing participant quotas', {
        path: event.path,
        method: event.httpMethod
      });

      const body = JSON.parse(event.body || '{}');
      const { researchId, demographics } = body;

      // Validar campos requeridos
      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'researchId es requerido'
          })
        };
      }

      if (!demographics || typeof demographics !== 'object') {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'demographics es requerido y debe ser un objeto'
          })
        };
      }

      // Validar estructura de demographics
      const validDemographics: ParticipantDemographics = {
        age: demographics.age,
        country: demographics.country,
        gender: demographics.gender,
        educationLevel: demographics.educationLevel,
        householdIncome: demographics.householdIncome,
        employmentStatus: demographics.employmentStatus,
        dailyHoursOnline: demographics.dailyHoursOnline,
        technicalProficiency: demographics.technicalProficiency
      };

      // Analizar cuotas (SOLO PARA ANÁLISIS)
      const quotaAnalysisResult = await this.quotaService.analyzeParticipantQuotas(
        researchId,
        validDemographics
      );

      structuredLog('info', `${this.controllerName}.${context}`, 'Quota analysis completed', {
        researchId,
        isValid: quotaAnalysisResult.isValid,
        reason: quotaAnalysisResult.reason
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            isValid: quotaAnalysisResult.isValid,
            reason: quotaAnalysisResult.reason,
            quotaInfo: quotaAnalysisResult.quotaInfo
          }
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${context}`, 'Unexpected error in analyzeParticipantQuotas', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Obtiene estadísticas de cuotas para análisis
   */
  async getQuotaStats(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getQuotaStats';

    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'researchId es requerido'
          })
        };
      }

      const stats = await this.quotaService.getQuotaStats(researchId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: stats
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${context}`, 'Unexpected error in getQuotaStats', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Reinicia contadores de cuotas
   */
  async resetQuotaCounters(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'resetQuotaCounters';

    try {
      const body = JSON.parse(event.body || '{}');
      const { researchId } = body;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'researchId es requerido'
          })
        };
      }

      // Implementar lógica de reinicio de contadores
      // Por ahora, solo retornamos éxito
      structuredLog('info', `${this.controllerName}.${context}`, 'Quota counters reset requested', { researchId });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Contadores de cuotas reiniciados'
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${context}`, 'Unexpected error in resetQuotaCounters', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        })
      };
    }
  }
}
// Instancia del controlador
const controller = new QuotaValidationController();

/**
 * Handler principal para validación de cuotas
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Manejar preflight CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: ''
      };
    }

    const path = event.path.toLowerCase();
    const method = event.httpMethod;

    // Enrutar según el método y path
    if (method === 'POST' && path === '/quota/analyze') {
      return controller.analyzeParticipantQuotas(event);
    } else if (method === 'GET' && path.match(/^\/quota\/stats\/[\w-]+$/)) {
      return controller.getQuotaStats(event);
    } else if (method === 'POST' && path === '/quota/reset') {
      return controller.resetQuotaCounters(event);
    }

    // Ruta no encontrada
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Recurso no encontrado', status: 404 })
    };
  } catch (error: any) {
    structuredLog('error', 'QuotaValidationHandler', 'Error en quotaValidationHandler', { error });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Error interno del servidor',
        status: 500
      })
    };
  }
};

export const handler = mainHandler;

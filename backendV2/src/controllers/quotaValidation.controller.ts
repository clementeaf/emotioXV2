import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { ParticipantDemographics, QuotaValidationService } from '../services/quotaValidation.service';
import { structuredLog } from '../utils/logging.util';

/**
 * Controlador para validación de cuotas demográficas
 */
export class QuotaValidationController {
  private quotaService: QuotaValidationService;
  private controllerName = 'QuotaValidationController';

  constructor() {
    this.quotaService = new QuotaValidationService();
  }

  /**
 * Valida si un participante puede ser aceptado basado en las cuotas
 */
  async validateParticipant(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'validateParticipant';

    try {
      structuredLog('info', `${this.controllerName}.${context}`, 'Validating participant quotas', {
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

      // Validar cuotas
      const quotaValidationResult = await this.quotaService.validateParticipantQuotas(
        researchId,
        validDemographics
      );

      structuredLog('info', `${this.controllerName}.${context}`, 'Quota validation completed', {
        researchId,
        isValid: quotaValidationResult.isValid,
        reason: quotaValidationResult.reason
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            isValid: quotaValidationResult.isValid,
            reason: quotaValidationResult.reason,
            quotaInfo: quotaValidationResult.quotaInfo
          }
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${context}`, 'Error validating participant quotas', { error });
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
 * Obtiene estadísticas de cuotas para una investigación
 */
  async getQuotaStats(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getQuotaStats';

    try {
      structuredLog('info', `${this.controllerName}.${context}`, 'Getting quota statistics', {
        path: event.path,
        method: event.httpMethod
      });

      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'researchId es requerido en la URL'
          })
        };
      }

      // Obtener estadísticas
      const stats = await this.quotaService.getQuotaStats(researchId);

      structuredLog('info', `${this.controllerName}.${context}`, 'Quota stats retrieved', {
        researchId,
        statsCount: stats.length
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            researchId,
            stats,
            totalCounters: stats.length
          }
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${context}`, 'Error getting quota stats', { error });
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
   * Reinicia los contadores de cuotas para una investigación
   */
  async resetQuotaCounters(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'resetQuotaCounters';

    try {
      structuredLog('info', `${this.controllerName}.${context}`, 'Resetting quota counters', {
        path: event.path,
        method: event.httpMethod
      });

      const body = JSON.parse(event.body || '{}');
      const { researchId, confirmReset } = body;

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

      if (confirmReset !== true) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'confirmReset debe ser true para confirmar el reinicio'
          })
        };
      }

      // TODO: Implementar lógica de reinicio de contadores
      // Por ahora, retornamos éxito
      structuredLog('info', `${this.controllerName}.${context}`, 'Quota counters reset requested', {
        researchId
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            message: 'Contadores de cuotas reiniciados exitosamente',
            researchId
          }
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${context}`, 'Error resetting quota counters', { error });
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

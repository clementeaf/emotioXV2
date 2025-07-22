import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QuotaValidationController } from '../controllers/quotaValidation.controller';
import { corsMiddleware, getCorsHeaders } from '../middlewares/cors';
import { structuredLog } from '../utils/logging.util';

const controller = new QuotaValidationController();

/**
 * Función Lambda para analizar cuotas de participantes (SOLO ANÁLISIS)
 */
export const analyzeParticipantQuotas = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const context = 'analyzeParticipantQuotas';

  try {
    // 🎯 MANEJAR CORS
    const corsResponse = await corsMiddleware(event);
    if (corsResponse) return corsResponse;

    structuredLog('info', context, 'Analyzing participant quotas', {
      path: event.path,
      method: event.httpMethod,
      body: event.body
    });

    const result = await controller.analyzeParticipantQuotas(event);

    // 🎯 AGREGAR HEADERS CORS A LA RESPUESTA
    return {
      ...result,
      headers: {
        ...result.headers,
        ...getCorsHeaders(event)
      }
    };

  } catch (error) {
    structuredLog('error', context, 'Unexpected error in analyzeParticipantQuotas', { error });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      })
    };
  }
};

/**
 * Función Lambda para obtener estadísticas de cuotas
 */
export const getQuotaStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const context = 'getQuotaStats';

  try {
    // 🎯 MANEJAR CORS
    const corsResponse = await corsMiddleware(event);
    if (corsResponse) return corsResponse;

    structuredLog('info', context, 'Getting quota stats', {
      path: event.path,
      method: event.httpMethod
    });

    const result = await controller.getQuotaStats(event);

    // 🎯 AGREGAR HEADERS CORS A LA RESPUESTA
    return {
      ...result,
      headers: {
        ...result.headers,
        ...getCorsHeaders(event)
      }
    };

  } catch (error) {
    structuredLog('error', context, 'Unexpected error in getQuotaStats', { error });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      })
    };
  }
};

/**
 * Función Lambda para reiniciar contadores de cuotas
 */
export const resetQuotaCounters = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const context = 'resetQuotaCounters';

  try {
    // 🎯 MANEJAR CORS
    const corsResponse = await corsMiddleware(event);
    if (corsResponse) return corsResponse;

    structuredLog('info', context, 'Resetting quota counters', {
      path: event.path,
      method: event.httpMethod,
      body: event.body
    });

    const result = await controller.resetQuotaCounters(event);

    // 🎯 AGREGAR HEADERS CORS A LA RESPUESTA
    return {
      ...result,
      headers: {
        ...result.headers,
        ...getCorsHeaders(event)
      }
    };

  } catch (error) {
    structuredLog('error', context, 'Unexpected error in resetQuotaCounters', { error });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      })
    };
  }
};

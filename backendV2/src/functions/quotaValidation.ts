import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QuotaValidationController } from '../controllers/quotaValidation.controller';
import { corsMiddleware, getCorsHeaders } from '../middlewares/cors';
import { structuredLog } from '../utils/logging.util';

const controller = new QuotaValidationController();

/**
 * Función Lambda para validar participantes contra cuotas
 */
export const validateParticipantQuotas = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const context = 'validateParticipantQuotas';

  try {
    // 🎯 MANEJAR CORS
    const corsResponse = await corsMiddleware(event);
    if (corsResponse) return corsResponse;

    structuredLog('info', context, 'Validating participant quotas', {
      path: event.path,
      method: event.httpMethod,
      body: event.body
    });

    const result = await controller.validateParticipant(event);

    // 🎯 AGREGAR HEADERS CORS A LA RESPUESTA
    return {
      ...result,
      headers: {
        ...result.headers,
        ...getCorsHeaders(event)
      }
    };

  } catch (error) {
    structuredLog('error', context, 'Unexpected error in validateParticipantQuotas', { error });
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

    structuredLog('info', context, 'Getting quota statistics', {
      path: event.path,
      method: event.httpMethod,
      pathParameters: event.pathParameters
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

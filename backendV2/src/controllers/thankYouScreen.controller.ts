import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ThankYouScreenFormData } from '../../../shared/interfaces/thank-you-screen.interface';
import { thankYouScreenService } from '../services/thankYouScreen.service';
import {
  createResponse,
  errorResponse,
  validateTokenAndSetupAuth
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';
import { toApplicationError } from '../types/errors';

/**
 * Maneja las solicitudes entrantes para Thank You Screen
 */
const thankYouScreenHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, body, path } = event;
  
  // Extract researchId from path manually: /research/{researchId}/thank-you-screen
  const pathMatch = path.match(/^\/research\/([^\/]+)\/thank-you-screen/);
  const researchId = pathMatch?.[1];

  if (!researchId) {
    return errorResponse('Se requiere researchId en la ruta', 400, event);
  }

  // Validar token y obtener userId
  const authResult = await validateTokenAndSetupAuth(event, event.path);
  if ('statusCode' in authResult) {
    return authResult;
  }
  const userId = authResult.userId;

  try {
    switch (httpMethod) {
      case 'GET':
        structuredLog('info', 'ThankYouScreenHandler.GET', 'Iniciando obtención', { researchId });
        const screen = await thankYouScreenService.getByResearchId(researchId);
        structuredLog('info', 'ThankYouScreenHandler.GET', 'Obtención exitosa', { researchId });
        return createResponse(200, screen, event); // screen can be null if not found

      case 'POST':
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud para crear/actualizar', 400, event);
        }

        const data: ThankYouScreenFormData = JSON.parse(body);
        structuredLog('info', 'ThankYouScreenHandler.POST', 'Iniciando creación/actualización', { researchId, userId });
        const result = await thankYouScreenService.updateByResearchId(researchId, data, userId);
        structuredLog('info', 'ThankYouScreenHandler.POST', 'Creación/actualización exitosa', { researchId, screenId: result.id });
        return createResponse(200, result, event);

      case 'DELETE':
        structuredLog('info', 'ThankYouScreenHandler.DELETE', 'Iniciando eliminación', { researchId });
        const screenToDelete = await thankYouScreenService.getByResearchId(researchId);
        if (screenToDelete) {
          await thankYouScreenService.delete(screenToDelete.id, userId);
          structuredLog('info', 'ThankYouScreenHandler.DELETE', 'Eliminación exitosa', { researchId });
        } else {
          structuredLog('info', 'ThankYouScreenHandler.DELETE', 'No se encontró pantalla para eliminar', { researchId });
        }
        return createResponse(204, null, event);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, event);
    }
  } catch (error: unknown) {
    const appError = toApplicationError(error);
    structuredLog('error', `ThankYouScreenHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: appError.message,
      stack: appError.stack
    });
    if (appError.name === 'NotFoundError' || appError.message.includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de Thank You Screen no encontrada.' }, event);
    }
    return errorResponse(appError.message, appError.statusCode || 500, event);
  }
};

export const handler = thankYouScreenHandler;
export const mainHandler = thankYouScreenHandler;
export default mainHandler;

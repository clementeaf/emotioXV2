import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WelcomeScreenFormData } from '../../../shared/interfaces/welcome-screen.interface';
import { welcomeScreenService } from '../services/welcomeScreen.service';
import {
  createResponse,
  errorResponse
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

/**
 * Maneja las solicitudes entrantes para Welcome Screen
 */
const welcomeScreenHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, body } = event;
  const researchId = pathParameters?.researchId;
  const userId = event.requestContext.authorizer?.claims?.sub; // Asumiendo autenticación Cognito

  if (!researchId) {
    return errorResponse('Se requiere researchId en la ruta', 400);
  }

  try {
    switch (httpMethod) {
      case 'GET':
        structuredLog('info', 'WelcomeScreenHandler.GET', 'Iniciando obtención', { researchId });
        const screen = await welcomeScreenService.getByResearchId(researchId);
        structuredLog('info', 'WelcomeScreenHandler.GET', 'Obtención exitosa', { researchId });
        return createResponse(200, screen);

      case 'POST':
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud para crear/actualizar', 400);
        }
        if (!userId) {
          return errorResponse('No se pudo identificar al usuario', 403);
        }

        const data: WelcomeScreenFormData = JSON.parse(body);
        structuredLog('info', 'WelcomeScreenHandler.POST', 'Iniciando creación/actualización', { researchId, userId });
        const result = await welcomeScreenService.updateByResearchId(researchId, data, userId);
        structuredLog('info', 'WelcomeScreenHandler.POST', 'Creación/actualización exitosa', { researchId, screenId: result.id });
        return createResponse(200, result);

      case 'DELETE':
        if (!userId) {
          return errorResponse('No se pudo identificar al usuario', 403);
        }
        structuredLog('info', 'WelcomeScreenHandler.DELETE', 'Iniciando eliminación', { researchId });
        // Primero, encontrar el screenId asociado al researchId
        const screenToDelete = await welcomeScreenService.getByResearchId(researchId);
        await welcomeScreenService.delete(screenToDelete.id, userId);
        structuredLog('info', 'WelcomeScreenHandler.DELETE', 'Eliminación exitosa', { researchId });
        return createResponse(204, null); // 204 No Content

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405);
    }
  } catch (error: any) {
    structuredLog('error', `WelcomeScreenHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: error.message,
      stack: error.stack
    });
    // Manejar Not Found de forma elegante
    if (error.name === 'NotFoundError' || error.message.includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de Welcome Screen no encontrada para esta investigación.' });
    }
    return errorResponse(error.message, error.statusCode || 500);
  }
};

export const handler = welcomeScreenHandler;
export const mainHandler = welcomeScreenHandler;

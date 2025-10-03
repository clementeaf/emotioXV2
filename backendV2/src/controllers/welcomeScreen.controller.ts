import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WelcomeScreenFormData } from '../../../shared/interfaces/welcome-screen.interface';
import { welcomeScreenService } from '../services/welcomeScreen.service';
import {
  createResponse,
  errorResponse,
  validateTokenAndSetupAuth
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';
import { toApplicationError } from '../types/errors';

/**
 * Maneja las solicitudes entrantes para Welcome Screen
 */
const welcomeScreenHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, body, path } = event;
  
  // Extract researchId from path manually: /research/{researchId}/welcome-screen
  const pathMatch = path.match(/^\/research\/([^\/]+)\/welcome-screen/);
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
        structuredLog('info', 'WelcomeScreenHandler.GET', 'Iniciando obtención', { researchId });
        const screen = await welcomeScreenService.getByResearchId(researchId);
        structuredLog('info', 'WelcomeScreenHandler.GET', 'Obtención exitosa', { researchId });
        return createResponse(200, screen, event);

      case 'POST':
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud para crear/actualizar', 400, event);
        }

        const data: WelcomeScreenFormData = JSON.parse(body);
        structuredLog('info', 'WelcomeScreenHandler.POST', 'Iniciando creación/actualización', { researchId, userId });
        const result = await welcomeScreenService.updateByResearchId(researchId, data, userId);
        structuredLog('info', 'WelcomeScreenHandler.POST', 'Creación/actualización exitosa', { researchId, screenId: result.id });
        return createResponse(200, result, event);

      case 'DELETE':
        structuredLog('info', 'WelcomeScreenHandler.DELETE', 'Iniciando eliminación', { researchId });
        // Primero, encontrar el screenId asociado al researchId
        const screenToDelete = await welcomeScreenService.getByResearchId(researchId);
        await welcomeScreenService.delete(screenToDelete.id, userId);
        structuredLog('info', 'WelcomeScreenHandler.DELETE', 'Eliminación exitosa', { researchId });
        return createResponse(204, null, event); // 204 No Content

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, event);
    }
  } catch (error: unknown) {
    const appError = toApplicationError(error);
    structuredLog('error', `WelcomeScreenHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: appError.message,
      stack: appError.stack
    });
    // Manejar Not Found de forma elegante
    if (appError.name === 'NotFoundError' || appError.message.includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de Welcome Screen no encontrada para esta investigación.' }, event);
    }
    return errorResponse(appError.message, appError.statusCode || 500, event);
  }
};

export const handler = welcomeScreenHandler;
export const mainHandler = welcomeScreenHandler;

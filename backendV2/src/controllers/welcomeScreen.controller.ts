import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WelcomeScreenFormData as SharedWelcomeScreenFormData } from '../../../shared/interfaces/welcome-screen.interface';
import { HttpError } from '../errors';
import { WelcomeScreenError, welcomeScreenService } from '../services/welcomeScreen.service';
import { createController, RouteMap } from '../utils/controller.decorator';
import {
    createResponse,
    errorResponse
} from '../utils/controller.utils';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';
import {
    extractResearchId,
    parseAndValidateBody,
    validateMultiple,
    validateResearchId,
    validateUserId,
    validateWelcomeScreenData
} from '../utils/validation';

interface WelcomeScreenFormData extends SharedWelcomeScreenFormData {
  researchId?: string;
}

export class WelcomeScreenController {
  /**
   * Crea una nueva pantalla de bienvenida (sin invalidación de caché)
   */
  async createWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    const context = 'WelcomeScreenController.createWelcomeScreen';
    try {
      structuredLog('info', context, 'Inicio de creación');

      const authError = validateUserId(userId);
      if (authError) return authError;

      const bodyResult = parseAndValidateBody<WelcomeScreenFormData>(event, validateWelcomeScreenData);
      if ('statusCode' in bodyResult) return bodyResult;

      const screenData = bodyResult.data;

      const researchResult = extractResearchId(event, screenData);
      if ('statusCode' in researchResult) return researchResult;

      const { researchId } = researchResult;

      structuredLog('info', context, 'Llamando al servicio para crear', { researchId: researchId });
      const welcomeScreen = await welcomeScreenService.create(screenData, researchId, userId);
      structuredLog('info', context, 'Pantalla de bienvenida creada exitosamente', { welcomeScreenId: welcomeScreen.id, researchId: researchId });

      return createResponse(201, {
        message: 'Pantalla de bienvenida creada exitosamente',
        data: welcomeScreen
      });
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación (sin caché de controlador)
   */
  async getWelcomeScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'WelcomeScreenController.getWelcomeScreen';
    try {
      const researchResult = extractResearchId(event);
      if ('statusCode' in researchResult) return researchResult;
      const { researchId } = researchResult;

      structuredLog('info', context, 'Buscando welcome screen para la investigación', { researchId: researchId });
      const screen = await welcomeScreenService.getByResearchId(researchId);

      if (!screen) {
        structuredLog('info', context, 'No se encontró welcome screen', { researchId: researchId });
        return createResponse(404, { message: 'Welcome screen not found for this research.'});
      }

      structuredLog('info', context, 'Welcome screen encontrado', { welcomeScreenId: screen.id, researchId: researchId });
      return createResponse(200, screen);

    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Actualiza una pantalla de bienvenida específica por su ID (sin invalidación de caché)
   */
  async updateWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    const context = 'WelcomeScreenController.updateWelcomeScreen';
    let researchId: string | undefined;
    let screenId: string | undefined;
    try {
      structuredLog('info', context, 'Inicio de actualización');

      screenId = event.pathParameters?.screenId;
      if (!screenId) {
        return errorResponse('Se requiere screenId en la ruta', 400);
      }

      researchId = event.pathParameters?.researchId;
      const validationError = validateMultiple(
        validateUserId(userId),
        validateResearchId(researchId)
      );
      if (validationError) return validationError;

      const bodyResult = parseAndValidateBody<WelcomeScreenFormData>(event, validateWelcomeScreenData);
      if ('statusCode' in bodyResult) return bodyResult;
      const screenData = bodyResult.data;

      const currentResearchId = researchId!;

      structuredLog('info', context, 'Actualizando welcome screen', { screenId: screenId, researchId: currentResearchId });
      const updatedScreen = await welcomeScreenService.updateForResearch(currentResearchId, screenId, screenData, userId);

      structuredLog('info', context, 'Actualización completada', { screenId: updatedScreen.id, researchId: currentResearchId });
      return createResponse(200, {
        message: 'Pantalla de bienvenida actualizada exitosamente',
        data: updatedScreen
      });

    } catch (error) {
      return this.handleError(error, context, { screenId, researchId });
    }
  }

  /**
   * Elimina una pantalla de bienvenida específica por su ID (sin invalidación de caché)
   */
  async deleteWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    const context = 'WelcomeScreenController.deleteWelcomeScreen';
    let researchId: string | undefined;
    let screenId: string | undefined;
    try {
      structuredLog('info', context, 'Inicio de eliminación');

      screenId = event.pathParameters?.screenId;
      if (!screenId) {
        return errorResponse('Se requiere screenId en la ruta', 400);
      }

      researchId = event.pathParameters?.researchId;
      const validationError = validateMultiple(
        validateUserId(userId),
        validateResearchId(researchId)
      );
      if (validationError) return validationError;

      const currentResearchId = researchId!;

      structuredLog('info', context, 'Eliminando welcome screen', { screenId: screenId, researchId: currentResearchId });
      await welcomeScreenService.delete(screenId, userId);
      structuredLog('info', context, 'Eliminación completada en servicio');

      return createResponse(204, null);

    } catch (error) {
      return this.handleError(error, context, { screenId, researchId });
    }
  }

  /**
   * Maneja errores y genera respuestas HTTP adecuadas (sin cambios)
   */
  private handleError(error: any, context: string, extraData?: Record<string, any>): APIGatewayProxyResult {
    structuredLog('error', context, 'Error procesando la solicitud', {
        error: error instanceof Error ? { name: error.name, message: error.message } : error,
        ...extraData // Añadir IDs relevantes si se pasaron
    });

    if (error instanceof HttpError) {
      return createResponse(error.statusCode, {
        error: error.message
      });
    }

    if (error instanceof ApiError) {
      return createResponse(error.statusCode, {
        error: error.message
      });
    }
    if (error.message?.includes(WelcomeScreenError.NOT_FOUND)) {
      return errorResponse(error.message, 404);
    }
    if (error.message?.includes(WelcomeScreenError.INVALID_DATA) ||
        error.message?.includes(WelcomeScreenError.RESEARCH_REQUIRED)) {
      return errorResponse(error.message, 400);
    }
    if (error.message?.includes(WelcomeScreenError.PERMISSION_DENIED)) {
      return errorResponse(error.message, 403);
    }

    return errorResponse('Error interno del servidor', 500);
  }
}

// Instanciar el controlador
const controller = new WelcomeScreenController();

// Definir el mapa de rutas para WelcomeScreen ASEGURANDO QUE PUT SOLO ESTÉ EN LA RUTA ESPECÍFICA
const welcomeScreenRouteMap: RouteMap = {
  // Ruta base para OBTENER por researchId y CREAR
  '/research/{researchId}/welcome-screen': {
    'GET': controller.getWelcomeScreen.bind(controller),
    'POST': controller.createWelcomeScreen.bind(controller),
    // PUT NO DEBE ESTAR AQUÍ
    // DELETE tampoco debería estar aquí si se borra por screenId
  },
  // Ruta específica con screenId para ACTUALIZAR y ELIMINAR
  '/research/{researchId}/welcome-screen/{screenId}': {
    'PUT': controller.updateWelcomeScreen.bind(controller),
    'DELETE': controller.deleteWelcomeScreen.bind(controller),
    // GET específico por screenId podría ir aquí si se necesita
  }
};

/**
 * Manejador principal para las rutas de pantallas de bienvenida
 *
 * Utiliza el decorador de controlador para manejar la autenticación y CORS automáticamente.
 *
 * Estructura jerárquica:
 * - GET /research/{researchId}/welcome-screen : Obtiene el welcome screen de la investigación
 * - POST /research/{researchId}/welcome-screen : Crea un nuevo welcome screen para la investigación
 * - PUT /research/{researchId}/welcome-screen : Actualiza el welcome screen de la investigación
 * - DELETE /research/{researchId}/welcome-screen : Elimina el welcome screen de la investigación
 */
export const mainHandler = createController(welcomeScreenRouteMap, {
  basePath: '',  // Sin base path para permitir múltiples patrones de ruta
  // No hay rutas públicas, todas requieren autenticación
});

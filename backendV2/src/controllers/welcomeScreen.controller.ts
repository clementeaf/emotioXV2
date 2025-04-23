import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { welcomeScreenService, WelcomeScreenError } from '../services/welcomeScreen.service';
import { WelcomeScreenFormData as SharedWelcomeScreenFormData } from '../../../shared/interfaces/welcome-screen.interface';
import { ApiError } from '../utils/errors';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { 
  validateUserId, 
  validateResearchId, 
  validateWelcomeScreenData, 
  validateMultiple,
  extractResearchId,
  parseAndValidateBody
} from '../utils/validation';

interface WelcomeScreenFormData extends SharedWelcomeScreenFormData {
  researchId?: string;
}

export class WelcomeScreenController {

  /**
   * Crea una nueva pantalla de bienvenida
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de bienvenida creada
   */
  async createWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando createWelcomeScreen...');
      
      // Validar autenticación
      const authError = validateUserId(userId);
      if (authError) return authError;
      
      // Parsear y validar el cuerpo de la petición
      const bodyResult = parseAndValidateBody<WelcomeScreenFormData>(event, validateWelcomeScreenData);
      if ('statusCode' in bodyResult) return bodyResult;
      
      const screenData = bodyResult.data;
      
      // Extraer y validar el ID de investigación
      const researchResult = extractResearchId(event, screenData);
      if ('statusCode' in researchResult) return researchResult;
      
      const { researchId } = researchResult;

      // Crear la pantalla de bienvenida usando el servicio
      console.log('Llamando al servicio para crear pantalla de bienvenida...');
      const welcomeScreen = await welcomeScreenService.create(screenData, researchId, userId);
      console.log('Pantalla de bienvenida creada exitosamente:', welcomeScreen.id);

      return createResponse(201, {
        message: 'Pantalla de bienvenida creada exitosamente',
        data: welcomeScreen
      });
    } catch (error) {
      console.error('Error en createWelcomeScreen:', error);
      return this.handleError(error);
    }
  }

  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación
   * @param event Evento API Gateway
   * @returns Respuesta con los datos de la pantalla o null si no existe
   */
  async getWelcomeScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      console.log('Buscando welcome screen por research ID');
      
      // Extraer y validar el ID de investigación
      const researchResult = extractResearchId(event);
      if ('statusCode' in researchResult) return researchResult;
      
      const { researchId } = researchResult;
      
      console.log(`Buscando welcome screen para la investigación: ${researchId}`);
      const screen = await welcomeScreenService.getByResearchId(researchId);
      
      if (!screen) {
        console.log(`No se encontró welcome screen para la investigación: ${researchId}`);
        return createResponse(200, { data: null });
      }
      
      console.log('Welcome screen encontrado:', screen);
      return createResponse(200, { data: screen });
    } catch (error) {
      console.error('Error al obtener welcome screen:', error);
      return errorResponse(
        'Error al obtener la pantalla de bienvenida',
        500
      );
    }
  }

  /**
   * Actualiza una pantalla de bienvenida de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de bienvenida actualizada
   */
  async updateWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando updateWelcomeScreen...');
      
      // Validaciones
      const validationError = validateUserId(userId);
      if (validationError) return validationError;
      
      // Parsear y validar el cuerpo de la petición
      const bodyResult = parseAndValidateBody<WelcomeScreenFormData>(event, validateWelcomeScreenData);
      if ('statusCode' in bodyResult) return bodyResult;
      
      const screenData = bodyResult.data;
      
      // Extraer y validar el ID de investigación
      const researchResult = extractResearchId(event, screenData);
      if ('statusCode' in researchResult) return researchResult;
      
      const { researchId } = researchResult;

      console.log(`Actualizando welcome screen para la investigación: ${researchId}`);
      
      // Buscar la pantalla existente
      const existingScreen = await welcomeScreenService.getByResearchId(researchId);
      
      if (!existingScreen) {
        // Si no existe, crearla
        console.log(`No existe welcome screen, creando para la investigación: ${researchId}`);
        const welcomeScreen = await welcomeScreenService.create(screenData, researchId, userId);
        
        return createResponse(201, {
          message: 'Pantalla de bienvenida creada exitosamente',
          data: welcomeScreen
        });
      } else {
        // Si existe, actualizarla
        console.log(`Actualizando welcome screen existente para la investigación: ${researchId}`);
        const updatedScreen = await welcomeScreenService.update(existingScreen.id, screenData, userId);
        
        return createResponse(200, {
          message: 'Pantalla de bienvenida actualizada exitosamente',
          data: updatedScreen
        });
      }
    } catch (error) {
      console.error('Error en updateWelcomeScreen:', error);
      return this.handleError(error);
    }
  }

  /**
   * Elimina una pantalla de bienvenida
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP indicando el resultado de la operación
   */
  async deleteWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando deleteWelcomeScreen...');
      
      // Validaciones múltiples
      const validationError = validateMultiple(
        validateUserId(userId),
        validateResearchId(event.pathParameters?.researchId)
      );
      if (validationError) return validationError;
      
      // Extraer y validar el ID de investigación (sabemos que es válido por la validación anterior)
      const researchId = event.pathParameters!.researchId!;
      
      // Verificar si existe la pantalla de bienvenida para esta investigación
      const existingScreen = await welcomeScreenService.getByResearchId(researchId);
      
      if (!existingScreen) {
        console.log(`No se encontró welcome screen para la investigación: ${researchId}`);
        return errorResponse('No se encontró la pantalla de bienvenida para eliminar', 404);
      }
      
      // Eliminar la pantalla de bienvenida
      console.log(`Eliminando welcome screen para la investigación: ${researchId}`);
      await welcomeScreenService.delete(existingScreen.id, userId);
      console.log('Welcome screen eliminado correctamente');
      
      return createResponse(200, {
        message: 'Pantalla de bienvenida eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error en deleteWelcomeScreen:', error);
      return this.handleError(error);
    }
  }

  /**
   * Maneja errores y genera respuestas HTTP adecuadas
   * @param error Error capturado
   * @returns Respuesta HTTP de error
   */
  private handleError(error: any): APIGatewayProxyResult {
    console.error('Error en WelcomeScreenController:', error);

    // Si es un error de API conocido, usar su código de estado
    if (error instanceof ApiError) {
      return createResponse(error.statusCode, {
        error: error.message
      });
    }

    // Mapear errores conocidos del servicio a códigos HTTP
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

    // Error genérico para otros casos
    return errorResponse('Error interno del servidor', 500);
  }
}

// Instanciar el controlador
const controller = new WelcomeScreenController();

// Definir el mapa de rutas para WelcomeScreen
const welcomeScreenRouteMap: RouteMap = {
  // Ruta jerárquica para welcome-screen asociada a investigación
  '/research/{researchId}/welcome-screen': {
    'GET': controller.getWelcomeScreen.bind(controller),
    'POST': controller.createWelcomeScreen.bind(controller),
    'PUT': controller.updateWelcomeScreen.bind(controller),
    'DELETE': controller.deleteWelcomeScreen.bind(controller)
  },
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
export const welcomeScreenHandler = createController(welcomeScreenRouteMap, {
  basePath: '',  // Sin base path para permitir múltiples patrones de ruta
  // No hay rutas públicas, todas requieren autenticación
}); 
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
        console.log(`No se encontró welcome screen para la investigación: ${researchId}, devolviendo 404.`);
        // Devolver 404 Not Found si no se encuentra
        return createResponse(404, { message: 'Welcome screen not found for this research.'});
      }
      
      console.log('Welcome screen encontrado:', screen);
      // Devolver el objeto screen directamente con status 200 OK
      console.log('[DEBUG] Respuesta GET WelcomeScreen preparada (objeto directo):', JSON.stringify(screen));
      return createResponse(200, screen);
    } catch (error) {
      console.error('Error al obtener welcome screen:', error);
      return errorResponse(
        'Error al obtener la pantalla de bienvenida',
        500
      );
    }
  }

  /**
   * Actualiza una pantalla de bienvenida específica por su ID
   * @param event Evento de API Gateway (con screenId en pathParameters)
   * @returns Respuesta HTTP con la pantalla de bienvenida actualizada
   */
  async updateWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando updateWelcomeScreen por screenId...');
      
      // Validar screenId por separado primero
      const screenId = event.pathParameters?.screenId;
      if (!screenId) {
        return errorResponse('Se requiere screenId en la ruta', 400);
      }
      
      // Validaciones restantes
      const validationError = validateMultiple(
        validateUserId(userId),
        validateResearchId(event.pathParameters?.researchId)
        // Ya no se valida screenId aquí
      );
      if (validationError) return validationError;
      
      // Parsear y validar el cuerpo de la petición
      const bodyResult = parseAndValidateBody<WelcomeScreenFormData>(event, validateWelcomeScreenData);
      if ('statusCode' in bodyResult) return bodyResult;
      
      const screenData = bodyResult.data;
      
      // Extraer researchId (ya validado)
      const researchId = event.pathParameters!.researchId!;

      console.log(`Actualizando welcome screen con ID: ${screenId} para la investigación: ${researchId}`);
      
      // Llamar al servicio pasando ambos IDs para asegurar la pertenencia
      // Asumimos que existe una función `updateForResearch` o similar en el servicio
      // que acepta researchId, screenId, data y userId.
      // Si no existe, habrá que crearla o modificar la existente `update`.
      const updatedScreen = await welcomeScreenService.updateForResearch(researchId, screenId, screenData, userId);
        
      return createResponse(200, {
        message: 'Pantalla de bienvenida actualizada exitosamente',
        data: updatedScreen
      });

    } catch (error) {
      console.error('Error en updateWelcomeScreen:', error);
      return this.handleError(error);
    }
  }

  /**
   * Elimina una pantalla de bienvenida específica por su ID
   * @param event Evento de API Gateway (con screenId en pathParameters)
   * @returns Respuesta HTTP indicando el resultado de la operación
   */
  async deleteWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando deleteWelcomeScreen por screenId...');
      
      // Validar screenId por separado primero
      const screenId = event.pathParameters?.screenId;
      if (!screenId) {
        return errorResponse('Se requiere screenId en la ruta', 400);
      }

      // Validaciones múltiples restantes
      const validationError = validateMultiple(
        validateUserId(userId),
        validateResearchId(event.pathParameters?.researchId)
        // Ya no se valida screenId aquí
      );
      if (validationError) return validationError;
      
      // Extraer researchId (ya validado)
      const researchId = event.pathParameters!.researchId!;
            
      // Eliminar directamente la pantalla de bienvenida por su ID
      console.log(`Eliminando welcome screen con ID: ${screenId} para la investigación: ${researchId}`);
      await welcomeScreenService.delete(screenId, userId);
      console.log('Welcome screen eliminado correctamente');
      
      // Usar 204 No Content para DELETE exitoso
      return createResponse(204, null);

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
export const welcomeScreenHandler = createController(welcomeScreenRouteMap, {
  basePath: '',  // Sin base path para permitir múltiples patrones de ruta
  // No hay rutas públicas, todas requieren autenticación
}); 
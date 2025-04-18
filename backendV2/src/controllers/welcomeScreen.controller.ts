import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { welcomeScreenService, WelcomeScreenError } from '../services/welcomeScreen.service';
import { WelcomeScreenFormData as SharedWelcomeScreenFormData } from '../../../shared/interfaces/welcome-screen.interface';
import { ApiError } from '../utils/errors';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';

/**
 * Extendemos la interfaz compartida para agregar el campo researchId que se usa en el controlador
 */
interface WelcomeScreenFormData extends SharedWelcomeScreenFormData {
  researchId?: string;
}

/**
 * Controlador para manejar las peticiones relacionadas con pantallas de bienvenida
 * 
 * Este controlador gestiona la creación, actualización, obtención y eliminación de
 * pantallas de bienvenida para investigaciones. Trabaja en conjunto con el servicio
 * welcomeScreenService para las operaciones de datos y requiere que el usuario esté
 * autenticado para todas las operaciones.
 * 
 * La autenticación se verifica a través del token JWT proporcionado en el header
 * Authorization de la solicitud, siguiendo el mismo patrón que otros controladores.
 */
export class WelcomeScreenController {
  /**
   * Crea una nueva pantalla de bienvenida
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de bienvenida creada
   */
  async createWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando createWelcomeScreen...');
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        console.error('Error: No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la pantalla de bienvenida', 400);
      }

      console.log('ID de usuario extraído:', userId);
      
      if (!userId) {
        console.error('Error: No se pudo extraer el ID de usuario');
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición con manejo de errores
      let screenData: WelcomeScreenFormData;
      try {
        screenData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log('Datos de pantalla parseados:', screenData);
      } catch (e) {
        console.error('Error al parsear JSON del cuerpo:', e);
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }

      // Obtener el ID de la investigación desde el cuerpo de la petición o parámetros de ruta
      const researchId = screenData.researchId || event.pathParameters?.researchId;
      console.log('ID de investigación:', researchId);
      
      if (!researchId) {
        console.error('Error: No se proporcionó ID de investigación');
        return errorResponse('Se requiere un ID de investigación (proporcione researchId en el cuerpo de la petición)', 400);
      }

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
   * Obtiene una pantalla de bienvenida por su ID
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de bienvenida solicitada
   */
  async getWelcomeScreenById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la pantalla desde los parámetros de ruta
      const screenId = event.pathParameters?.id;
      if (!screenId) {
        return errorResponse('Se requiere un ID de pantalla de bienvenida', 400);
      }

      // Obtener la pantalla de bienvenida usando el servicio
      const welcomeScreen = await welcomeScreenService.getById(screenId);

      return createResponse(200, {
        data: welcomeScreen
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene la pantalla de bienvenida de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de bienvenida de la investigación
   */
  async getWelcomeScreenByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      console.log('[WelcomeScreenController] Iniciando getWelcomeScreenByResearchId');
      
      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        console.error('[WelcomeScreenController] No se proporcionó ID de investigación');
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      console.log('[WelcomeScreenController] Buscando welcome screen para researchId:', researchId);
      
      // Obtener la pantalla de bienvenida usando el servicio
      const welcomeScreen = await welcomeScreenService.getByResearchId(researchId);

      if (!welcomeScreen) {
        console.log('[WelcomeScreenController] No se encontró welcome screen');
        return createResponse(200, {
          data: null
        });
      }

      console.log('[WelcomeScreenController] Welcome screen encontrado:', welcomeScreen);
      return createResponse(200, {
        data: welcomeScreen
      });
    } catch (error) {
      console.error('[WelcomeScreenController] Error en getWelcomeScreenByResearchId:', error);
      return this.handleError(error);
    }
  }

  /**
   * Actualiza una pantalla de bienvenida
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de bienvenida actualizada
   */
  async updateWelcomeScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la pantalla de bienvenida', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const screenData: Partial<WelcomeScreenFormData> = JSON.parse(event.body);

      // Obtener el ID de la pantalla desde los parámetros de ruta
      const screenId = event.pathParameters?.id;
      if (!screenId) {
        return errorResponse('Se requiere un ID de pantalla de bienvenida', 400);
      }

      // Actualizar la pantalla de bienvenida usando el servicio
      const updatedScreen = await welcomeScreenService.update(screenId, screenData, userId);

      return createResponse(200, {
        message: 'Pantalla de bienvenida actualizada exitosamente',
        data: updatedScreen
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza o crea la pantalla de bienvenida de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de bienvenida actualizada o creada
   */
  async updateWelcomeScreenByResearchId(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('[WelcomeScreenController] Iniciando updateWelcomeScreenByResearchId');
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        console.error('[WelcomeScreenController] No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para actualizar la pantalla de bienvenida', 400);
      }

      if (!userId) {
        console.error('[WelcomeScreenController] No se proporcionó ID de usuario');
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      let screenData: WelcomeScreenFormData;
      try {
        screenData = JSON.parse(event.body);
      } catch (e) {
        console.error('[WelcomeScreenController] Error al parsear JSON:', e);
        return errorResponse('Error al procesar los datos de la petición', 400);
      }

      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        console.error('[WelcomeScreenController] No se proporcionó ID de investigación');
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      console.log('[WelcomeScreenController] Actualizando welcome screen para researchId:', researchId);
      console.log('[WelcomeScreenController] Datos recibidos:', screenData);

      // Actualizar o crear la pantalla de bienvenida usando el servicio
      const welcomeScreen = await welcomeScreenService.updateByResearchId(researchId, screenData, userId);

      console.log('[WelcomeScreenController] Welcome screen actualizado:', welcomeScreen);
      return createResponse(200, {
        message: 'Pantalla de bienvenida actualizada correctamente',
        data: welcomeScreen
      });
    } catch (error) {
      console.error('[WelcomeScreenController] Error en updateWelcomeScreenByResearchId:', error);
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
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener el ID de la pantalla desde los parámetros de ruta
      const screenId = event.pathParameters?.id;
      if (!screenId) {
        return errorResponse('Se requiere un ID de pantalla de bienvenida', 400);
      }

      // Eliminar la pantalla de bienvenida usando el servicio
      await welcomeScreenService.delete(screenId, userId);

      return createResponse(200, {
        message: 'Pantalla de bienvenida eliminada exitosamente'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene todas las pantallas de bienvenida
   * @param _event Evento de API Gateway (no utilizado directamente)
   * @param _userId ID del usuario autenticado (no utilizado directamente)
   * @returns Respuesta HTTP con todas las pantallas de bienvenida
   */
  async getAllWelcomeScreens(_event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Obtener todas las pantallas de bienvenida
      const welcomeScreens = await welcomeScreenService.getAll();
      
      return createResponse(200, {
        data: welcomeScreens
      });
    } catch (error) {
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
  '/welcome-screen': {
    'GET': controller.getWelcomeScreenByResearchId.bind(controller),
    'POST': controller.createWelcomeScreen.bind(controller),
    'PUT': controller.updateWelcomeScreenByResearchId.bind(controller),
    'DELETE': controller.deleteWelcomeScreen.bind(controller)
  }
};

/**
 * Manejador principal para las rutas de pantallas de bienvenida
 * 
 * Utiliza el decorador de controlador para manejar la autenticación y CORS automáticamente.
 * 
 * Rutas soportadas:
 * - GET /welcome-screen : Obtiene el welcome screen de la investigación actual
 * - POST /welcome-screen : Crea un nuevo welcome screen
 * - PUT /welcome-screen : Actualiza el welcome screen existente
 * - DELETE /welcome-screen : Elimina el welcome screen
 */
export const welcomeScreenHandler = createController(welcomeScreenRouteMap, {
  basePath: '/welcome-screen',
  // No hay rutas públicas, todas requieren autenticación
}); 
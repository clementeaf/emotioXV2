import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { thankYouScreenService, ThankYouScreenError } from '../services/thankYouScreen.service';
import { ThankYouScreenFormData as SharedThankYouScreenFormData } from '../../../shared/interfaces/thank-you-screen.interface';
import { ApiError } from '../utils/errors';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';

/**
 * Extendemos la interfaz compartida para agregar el campo researchId que se usa en el controlador
 */
interface ThankYouScreenFormData extends SharedThankYouScreenFormData {
  researchId?: string;
}

/**
 * Controlador para manejar las peticiones relacionadas con pantallas de agradecimiento
 * 
 * Este controlador gestiona la creación, actualización, obtención y eliminación de
 * pantallas de agradecimiento para investigaciones. Trabaja en conjunto con el servicio
 * thankYouScreenService para las operaciones de datos y requiere que el usuario esté
 * autenticado para todas las operaciones excepto la obtención pública de pantallas.
 * 
 * La autenticación se verifica a través del token JWT proporcionado en el header
 * Authorization de la solicitud, siguiendo el mismo patrón que otros controladores.
 */
export class ThankYouScreenController {
  /**
   * Crea una nueva pantalla de agradecimiento
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de agradecimiento creada
   */
  async createThankYouScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando createThankYouScreen...');
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        console.error('Error: No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la pantalla de agradecimiento', 400);
      }

      console.log('ID de usuario extraído:', userId);
      
      if (!userId) {
        console.error('Error: No se pudo extraer el ID de usuario');
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición con manejo de errores
      let screenData: ThankYouScreenFormData;
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

      // Crear la pantalla de agradecimiento usando el servicio
      console.log('Llamando al servicio para crear pantalla de agradecimiento...');
      const thankYouScreen = await thankYouScreenService.create(screenData, researchId, userId);
      console.log('Pantalla de agradecimiento creada exitosamente:', thankYouScreen.id);

      return createResponse(201, {
        message: 'Pantalla de agradecimiento creada exitosamente',
        data: thankYouScreen
      });
    } catch (error) {
      console.error('Error en createThankYouScreen:', error);
      return this.handleError(error);
    }
  }

  /**
   * Obtiene una pantalla de agradecimiento por su ID
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de agradecimiento solicitada
   */
  async getThankYouScreenById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la pantalla desde los parámetros de ruta
      const screenId = event.pathParameters?.id;
      if (!screenId) {
        return errorResponse('Se requiere un ID de pantalla de agradecimiento', 400);
      }

      // Obtener la pantalla de agradecimiento usando el servicio
      const thankYouScreen = await thankYouScreenService.getById(screenId);

      return createResponse(200, {
        data: thankYouScreen
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene la pantalla de agradecimiento de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de agradecimiento de la investigación
   */
  async getThankYouScreenByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Obtener la pantalla de agradecimiento usando el servicio
      const thankYouScreen = await thankYouScreenService.getByResearchId(researchId);

      return createResponse(200, {
        data: thankYouScreen
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza una pantalla de agradecimiento
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de agradecimiento actualizada
   */
  async updateThankYouScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la pantalla de agradecimiento', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const screenData: Partial<ThankYouScreenFormData> = JSON.parse(event.body);

      // Obtener el ID de la pantalla desde los parámetros de ruta
      const screenId = event.pathParameters?.id;
      if (!screenId) {
        return errorResponse('Se requiere un ID de pantalla de agradecimiento', 400);
      }

      // Actualizar la pantalla de agradecimiento usando el servicio
      const updatedScreen = await thankYouScreenService.update(screenId, screenData, userId);

      return createResponse(200, {
        message: 'Pantalla de agradecimiento actualizada exitosamente',
        data: updatedScreen
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza o crea la pantalla de agradecimiento de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de agradecimiento actualizada o creada
   */
  async updateThankYouScreenByResearchId(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la pantalla de agradecimiento', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const screenData: ThankYouScreenFormData = JSON.parse(event.body);

      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Actualizar o crear la pantalla de agradecimiento usando el servicio
      const thankYouScreen = await thankYouScreenService.updateByResearchId(researchId, screenData, userId);

      return createResponse(200, {
        message: 'Pantalla de agradecimiento actualizada exitosamente',
        data: thankYouScreen
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Elimina una pantalla de agradecimiento
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP indicando el resultado de la operación
   */
  async deleteThankYouScreen(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener el ID de la pantalla desde los parámetros de ruta
      const screenId = event.pathParameters?.id;
      if (!screenId) {
        return errorResponse('Se requiere un ID de pantalla de agradecimiento', 400);
      }

      // Eliminar la pantalla de agradecimiento usando el servicio
      await thankYouScreenService.delete(screenId, userId);

      return createResponse(200, {
        message: 'Pantalla de agradecimiento eliminada exitosamente'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene una pantalla de agradecimiento para el participante de una investigación (acceso público)
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la pantalla de agradecimiento para el participante
   */
  async getParticipantThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Obtener la pantalla de agradecimiento usando el servicio
      const thankYouScreen = await thankYouScreenService.getByResearchId(researchId);

      // Para participantes, solo devolver datos si está habilitada
      if (!thankYouScreen.isEnabled) {
        return createResponse(200, {
          data: null,
          message: 'La pantalla de agradecimiento no está habilitada para esta investigación'
        });
      }

      // Filtrar solo los campos necesarios para el participante
      const participantView = {
        title: thankYouScreen.title,
        message: thankYouScreen.message,
        redirectUrl: thankYouScreen.redirectUrl,
        isEnabled: thankYouScreen.isEnabled
      };

      return createResponse(200, {
        data: participantView
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene todas las pantallas de agradecimiento
   * @param _event Evento de API Gateway (no utilizado directamente)
   * @returns Respuesta HTTP con todas las pantallas de agradecimiento
   */
  async getAllThankYouScreens(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener todas las pantallas de agradecimiento
      const thankYouScreens = await thankYouScreenService.getAll();
      
      return createResponse(200, {
        data: thankYouScreens
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Manejador para la ruta incorrecta /thank-you-screen/research/:researchId/thank-you-screen
   * Redirige a la ruta correcta /research/:researchId/thank-you-screen
   */
  async handleLegacyThankYouScreenRoute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      console.log('Manejando ruta legacy thank-you-screen:', event.path);
      // Extraer el ID de la investigación de la ruta
      const matches = event.path.match(/\/thank-you-screen\/research\/([^\/]+)\/thank-you-screen/);
      if (!matches || !matches[1]) {
        return errorResponse('Formato de ruta incorrecto', 400);
      }
      
      const researchId = matches[1];
      console.log('ID de investigación extraído:', researchId);
      
      // Actualizar los parámetros del evento para que coincidan con la estructura esperada
      event.pathParameters = { ...event.pathParameters, researchId };
      
      // Usar el método existente para obtener la pantalla
      return this.getThankYouScreenByResearchId(event);
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
    console.error('Error en ThankYouScreenController:', error);

    // Si es un error de API conocido, usar su código de estado
    if (error instanceof ApiError) {
      return createResponse(error.statusCode, {
        error: error.message
      });
    }

    // Mapear errores conocidos del servicio a códigos HTTP
    if (error.message?.includes(ThankYouScreenError.NOT_FOUND)) {
      return errorResponse(error.message, 404);
    }

    if (error.message?.includes(ThankYouScreenError.INVALID_DATA) ||
        error.message?.includes(ThankYouScreenError.RESEARCH_REQUIRED)) {
      return errorResponse(error.message, 400);
    }

    if (error.message?.includes(ThankYouScreenError.PERMISSION_DENIED)) {
      return errorResponse(error.message, 403);
    }

    // Por defecto, devolver error 500
    return errorResponse('Error interno del servidor', 500);
  }
}

/**
 * Mapa de rutas para el controlador de pantallas de agradecimiento
 */
const routes: RouteMap = {
  '/thank-you-screens': {
    'GET': (e) => new ThankYouScreenController().getAllThankYouScreens(e),
    'POST': (e, id) => new ThankYouScreenController().createThankYouScreen(e, id)
  },
  '/thank-you-screens/:id': {
    'GET': (e) => new ThankYouScreenController().getThankYouScreenById(e),
    'PUT': (e, id) => new ThankYouScreenController().updateThankYouScreen(e, id),
    'DELETE': (e, id) => new ThankYouScreenController().deleteThankYouScreen(e, id)
  },
  '/thank-you-screens/research/:researchId': {
    'GET': (e) => new ThankYouScreenController().getThankYouScreenByResearchId(e),
    'PUT': (e, id) => new ThankYouScreenController().updateThankYouScreenByResearchId(e, id)
  },
  '/thank-you-screen': {
    'POST': (e, id) => new ThankYouScreenController().createThankYouScreen(e, id)
  },
  '/thank-you-screen/:id': {
    'GET': (e) => new ThankYouScreenController().getThankYouScreenById(e),
    'PUT': (e, id) => new ThankYouScreenController().updateThankYouScreen(e, id),
    'DELETE': (e, id) => new ThankYouScreenController().deleteThankYouScreen(e, id)
  },
  '/research/:researchId/thank-you-screen': {
    'GET': (e) => new ThankYouScreenController().getThankYouScreenByResearchId(e),
    'PUT': (e, id) => new ThankYouScreenController().updateThankYouScreenByResearchId(e, id),
    'POST': (e, id) => new ThankYouScreenController().createThankYouScreen(e, id)
  },
  '/public/research/:researchId/thank-you-screen': {
    'GET': (e) => new ThankYouScreenController().getParticipantThankYouScreen(e)
  },
  '/thank-you-screen/research/:researchId/thank-you-screen': {
    'GET': (e) => new ThankYouScreenController().handleLegacyThankYouScreenRoute(e)
  }
};

/**
 * Opciones del controlador
 * Definimos la ruta base y las rutas públicas que no requieren autenticación
 */
const controllerOptions = {
  basePath: '/thank-you-screens',
  publicRoutes: [
    { path: '/public/research/:researchId/thank-you-screen', method: 'GET' }
  ]
};

/**
 * Handler para API Gateway
 * Esta función es el punto de entrada para las solicitudes HTTP a través de API Gateway
 */
export const thankYouScreenHandler = createController(routes, controllerOptions); 
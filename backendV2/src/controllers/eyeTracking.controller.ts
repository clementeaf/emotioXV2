import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EyeTrackingService, EyeTrackingError } from '../services/eyeTracking.service';
import { ApiError } from '../utils/errors';
import { EyeTrackingFormData } from '../models/eyeTracking.model';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';

// Instancia del servicio
const eyeTrackingService = new EyeTrackingService();

/**
 * Controlador para manejar las peticiones relacionadas con eye tracking
 * 
 * Este controlador gestiona la creación, actualización, obtención y eliminación de
 * configuraciones de eye tracking para investigaciones. Trabaja en conjunto con el servicio
 * eyeTrackingService para las operaciones de datos y requiere que el usuario esté
 * autenticado para todas las operaciones excepto la obtención pública de configuraciones.
 * 
 * La autenticación se verifica a través del token JWT proporcionado en el header
 * Authorization de la solicitud, siguiendo el mismo patrón que otros controladores.
 */
export class EyeTrackingController {
  /**
   * Crea una nueva configuración de eye tracking
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con la configuración creada
   */
  async createEyeTracking(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando createEyeTracking...');
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        console.error('Error: No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la configuración de eye tracking', 400);
      }

      console.log('ID de usuario extraído:', userId);
      
      if (!userId) {
        console.error('Error: No se pudo extraer el ID de usuario');
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición con manejo de errores
      let configData: EyeTrackingFormData;
      try {
        configData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log('Datos de configuración parseados:', configData);
      } catch (e) {
        console.error('Error al parsear JSON del cuerpo:', e);
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }

      // Obtener el ID de la investigación desde el cuerpo de la petición o parámetros de ruta
      const researchId = configData.researchId || event.pathParameters?.researchId;
      console.log('ID de investigación:', researchId);
      
      if (!researchId) {
        console.error('Error: No se proporcionó ID de investigación');
        return errorResponse('Se requiere un ID de investigación (proporcione researchId en el cuerpo de la petición)', 400);
      }

      // Crear la configuración de eye tracking usando el servicio
      console.log('Llamando al servicio para crear configuración de eye tracking...');
      const eyeTracking = await eyeTrackingService.create(configData, researchId, userId);
      console.log('Configuración de eye tracking creada exitosamente:', eyeTracking.id);

      return createResponse(201, {
        message: 'Configuración de eye tracking creada exitosamente',
        data: eyeTracking
      });
    } catch (error) {
      console.error('Error en createEyeTracking:', error);
      return this.handleError(error);
    }
  }

  /**
   * Obtiene una configuración de eye tracking por su ID
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la configuración solicitada
   */
  async getEyeTrackingById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la configuración desde los parámetros de ruta
      const configId = event.pathParameters?.id;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración de eye tracking', 400);
      }

      // Obtener la configuración de eye tracking usando el servicio
      const eyeTracking = await eyeTrackingService.getById(configId);

      return createResponse(200, {
        data: eyeTracking
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene la configuración de eye tracking de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la configuración de la investigación
   */
  async getEyeTrackingByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Obtener la configuración de eye tracking usando el servicio
      const eyeTracking = await eyeTrackingService.getByResearchId(researchId);

      return createResponse(200, {
        data: eyeTracking
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza una configuración de eye tracking
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con la configuración actualizada
   */
  async updateEyeTracking(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la configuración de eye tracking', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const configData: Partial<EyeTrackingFormData> = JSON.parse(event.body);

      // Obtener el ID de la configuración desde los parámetros de ruta
      const configId = event.pathParameters?.id;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración de eye tracking', 400);
      }

      // Actualizar la configuración de eye tracking usando el servicio
      const updatedConfig = await eyeTrackingService.update(configId, configData, userId);

      return createResponse(200, {
        message: 'Configuración de eye tracking actualizada exitosamente',
        data: updatedConfig
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza o crea la configuración de eye tracking de una investigación
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con la configuración actualizada o creada
   */
  async updateEyeTrackingByResearchId(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la configuración de eye tracking', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const configData: EyeTrackingFormData = JSON.parse(event.body);

      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Asegurar que el researchId coincide
      configData.researchId = researchId;

      // Actualizar o crear la configuración de eye tracking usando el servicio
      const eyeTracking = await eyeTrackingService.updateByResearchId(researchId, configData, userId);

      return createResponse(200, {
        message: 'Configuración de eye tracking actualizada exitosamente',
        data: eyeTracking
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Elimina una configuración de eye tracking
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP indicando el resultado de la operación
   */
  async deleteEyeTracking(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener el ID de la configuración desde los parámetros de ruta
      const configId = event.pathParameters?.id;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración de eye tracking', 400);
      }

      // Eliminar la configuración de eye tracking usando el servicio
      await eyeTrackingService.delete(configId, userId);

      return createResponse(200, {
        message: 'Configuración de eye tracking eliminada exitosamente'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene una configuración de eye tracking para el participante de una investigación (acceso público)
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la configuración para el participante
   */
  async getParticipantEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Obtener la configuración de eye tracking usando el servicio
      const eyeTracking = await eyeTrackingService.getByResearchId(researchId);

      // Para participantes, solo devolver datos si está habilitada
      if (!eyeTracking.config.enabled) {
        return createResponse(200, {
          data: null,
          message: 'El eye tracking no está habilitado para esta investigación'
        });
      }

      return createResponse(200, {
        data: eyeTracking
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Maneja errores comunes y los convierte en respuestas HTTP apropiadas
   * @param error Error capturado
   * @returns Respuesta HTTP con información del error
   */
  private handleError(error: any): APIGatewayProxyResult {
    console.error('Error en EyeTrackingController:', error);

    if (error instanceof ApiError) {
      return createResponse(error.statusCode, {
        error: error.message
      });
    }

    // Manejo de errores específicos de eye tracking
    if (error.message?.includes(EyeTrackingError.NOT_FOUND)) {
      return createResponse(404, {
        error: 'Configuración de eye tracking no encontrada'
      });
    }

    if (error.message?.includes(EyeTrackingError.INVALID_DATA)) {
      return createResponse(400, {
        error: error.message
      });
    }

    if (error.message?.includes(EyeTrackingError.RESEARCH_REQUIRED)) {
      return createResponse(400, {
        error: 'Se requiere ID de investigación'
      });
    }

    if (error.message?.includes(EyeTrackingError.PERMISSION_DENIED)) {
      return createResponse(403, {
        error: 'Permiso denegado'
      });
    }

    if (error.message?.includes(EyeTrackingError.DATABASE_ERROR)) {
      return createResponse(500, {
        error: 'Error de base de datos'
      });
    }

    // Error genérico
    return createResponse(500, {
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

/**
 * Definición de rutas para el controlador de eye tracking
 */
const routes: RouteMap = {
  '/eye-tracking': {
    'POST': new EyeTrackingController().createEyeTracking
  },
  '/eye-tracking/:id': {
    'GET': new EyeTrackingController().getEyeTrackingById,
    'PUT': new EyeTrackingController().updateEyeTracking,
    'DELETE': new EyeTrackingController().deleteEyeTracking
  },
  '/research/:researchId/eye-tracking': {
    'GET': new EyeTrackingController().getEyeTrackingByResearchId,
    'POST': new EyeTrackingController().createEyeTracking,
    'PUT': new EyeTrackingController().updateEyeTrackingByResearchId
  },
  '/participant/:researchId/eye-tracking': {
    'GET': new EyeTrackingController().getParticipantEyeTracking
  }
};

/**
 * Handler principal para las rutas de eye tracking
 */
export const eyeTrackingHandler = createController(routes, {
  basePath: '/eye-tracking',
  publicRoutes: [
    { path: '/participant/:researchId/eye-tracking', method: 'GET' }
  ]
}); 
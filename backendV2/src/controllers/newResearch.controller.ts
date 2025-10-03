import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NewResearch } from '../models/newResearch.model';
import { newResearchService, ResearchError } from '../services/newResearch.service';
import {
    createResponse,
    errorResponse,
    validateTokenAndSetupAuth
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';
import { toApplicationError } from '../types/errors';

/**
 * Controlador para manejar las peticiones relacionadas con nuevas investigaciones
 */
export class NewResearchController {
  /**
   * Crea una nueva investigación
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con la investigación creada
   */
  async createResearch(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      structuredLog('info', 'NewResearchController.createResearch', 'Request recibida', {
        path: event.path,
        method: event.httpMethod,
        hasBody: !!event.body
      });

      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        structuredLog('error', 'NewResearchController.createResearch', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la investigación', 400, event);
      }

      structuredLog('info', 'NewResearchController.createResearch', 'ID de usuario extraído', { userId });

      if (!userId) {
        structuredLog('error', 'NewResearchController.createResearch', 'Usuario no autenticado');
        return errorResponse('Usuario no autenticado', 401, event);
      }

      // Parsear el cuerpo de la petición
      const researchData: NewResearch = JSON.parse(event.body);
      structuredLog('info', 'NewResearchController.createResearch', 'Datos de investigación parseados', { researchName: researchData.name, type: researchData.type });

      // Crear la investigación usando el servicio
      structuredLog('info', 'NewResearchController.createResearch', 'Llamando al servicio para crear la investigación');
      const newResearch = await newResearchService.createResearch(researchData, userId);
      structuredLog('info', 'NewResearchController.createResearch', 'Investigación creada correctamente', { researchId: newResearch.id });

      // Verificar que la investigación se creó correctamente y tiene un ID
      if (newResearch && newResearch.id) {
        // La pantalla de bienvenida se creará solo cuando el usuario la configure explícitamente
        structuredLog('info', 'NewResearchController.createResearch', 'Nueva investigación creada', { researchId: newResearch.id });
      }

      return createResponse(201, {
        message: 'Investigación creada exitosamente',
        data: newResearch
      }, event);
    } catch (error) {
      structuredLog('error', 'NewResearchController.createResearch', 'Error completo en createResearch', { error });
      return this.handleError(toApplicationError(error), event);
    }
  }

  /**
   * Obtiene una investigación por su ID
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con la investigación solicitada
   */
  async getResearchById(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID de la investigación de los parámetros
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado en pathParameters', 400, event);
      }
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401, event);
      }
      // Obtener la investigación (sin validación de permisos especiales)
      const research = await newResearchService.getResearchById(researchId, 'user');
      return createResponse(200, {
        data: research
      }, event);
    } catch (error) {
      return this.handleError(toApplicationError(error), event);
    }
  }

  /**
   * Obtiene todas las investigaciones del usuario autenticado
   * @param event Evento de API Gateway (no utilizado directamente)
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con las investigaciones del usuario
   */
  async getUserResearches(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401, event);
      }

      // Obtener investigaciones del usuario
      const researches = await newResearchService.getUserResearches(userId);

      return createResponse(200, {
        data: researches
      }, event);
    } catch (error) {
      return this.handleError(toApplicationError(error), event);
    }
  }

  /**
   * Actualiza una investigación existente
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con la investigación actualizada
   */
  async updateResearch(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la investigación', 400, event);
      }
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado en pathParameters', 400, event);
      }
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401, event);
      }
      const updateData: Partial<NewResearch> = JSON.parse(event.body);
      // Actualizar la investigación (sin validación de permisos especiales)
      const updatedResearch = await newResearchService.updateResearch(
        researchId,
        updateData,
        userId
      );
      return createResponse(200, {
        message: 'Investigación actualizada exitosamente',
        data: updatedResearch
      }, event);
    } catch (error) {
      return this.handleError(toApplicationError(error), event);
    }
  }

  /**
   * Elimina una investigación
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con confirmación de eliminación
   */
  async deleteResearch(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID de la investigación de los parámetros
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado en pathParameters', 400, event);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401, event);
      }

      // Eliminar la investigación
      const result = await newResearchService.deleteResearch(researchId, userId);

      return createResponse(200, {
        message: result.message
      }, event);
    } catch (error) {
      return this.handleError(toApplicationError(error), event);
    }
  }

  /**
   * Cambia el estado de una investigación
   * @param event Evento de API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con la investigación actualizada
   */
  async changeResearchStatus(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Se requiere especificar el nuevo estado', 400, event);
      }
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado en pathParameters', 400, event);
      }
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401, event);
      }
      const { status } = JSON.parse(event.body);
      if (!status) {
        return errorResponse('Se requiere especificar el nuevo estado', 400, event);
      }
      // Cambiar el estado de la investigación (sin validación de permisos especiales)
      const updatedResearch = await newResearchService.changeResearchStatus(
        researchId,
        status,
        userId
      );
      return createResponse(200, {
        message: `Estado cambiado a '${status}' exitosamente`,
        data: updatedResearch
      }, event);
    } catch (error) {
      return this.handleError(toApplicationError(error), event);
    }
  }

  /**
   * Obtiene todas las investigaciones (acceso solo para administradores)
   * @param _event Evento de API Gateway (no utilizado directamente)
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con todas las investigaciones
   */
  async getAllResearches(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401, event);
      }

      // Obtener todas las investigaciones del usuario
      const researches = await newResearchService.getAllResearches(userId);

      return createResponse(200, {
        data: researches
      }, event);
    } catch (error) {
      return this.handleError(toApplicationError(error), event);
    }
  }

  /**
   * Maneja un error y genera una respuesta HTTP apropiada
   * @param error Error capturado
   * @param event Evento de API Gateway para CORS dinámicos
   * @returns Respuesta HTTP con detalles del error
   */
  private handleError(error: Error | ResearchError, event?: APIGatewayProxyEvent): APIGatewayProxyResult {
    structuredLog('error', 'NewResearchController.handler', 'Error en controlador de investigaciones', { error });

    if (error instanceof ResearchError) {
      const responseBody: { message: string; errors?: Record<string, string> } = {
        message: error.message
      };

      // Si hay errores de validación, incluirlos en la respuesta
      if (error.validationErrors) {
        responseBody.errors = error.validationErrors;
      }

      return createResponse(error.statusCode, responseBody, event);
    }

    return createResponse(500, {
      error: 'Error interno del servidor',
      details: error.message || 'Error no especificado',
    }, event);
  }
}

// <<< Instanciar el controlador >>>
const controllerInstance = new NewResearchController();

// <<< Handler principal que maneja GET y POST /research >>>
// Exportar como el nombre original esperado por el index/router
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Ejecutando mainHandler para /research:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body
  });

  try {
    // Validar token y obtener userId
    const authResult = await validateTokenAndSetupAuth(event, event.path);
    if ('statusCode' in authResult) {
      return authResult;
    }
    const userId = authResult.userId;

    // Manejar diferentes métodos HTTP
    switch (event.httpMethod) {
      case 'GET':
        // Verificar si hay un ID en el path para determinar qué método usar
        const researchId = event.pathParameters?.researchId;
        if (researchId) {
          console.log('Manejando GET /research/{researchId}');
          return await controllerInstance.getResearchById(event, userId);
        } else {
          console.log('Manejando GET /research');
          return await controllerInstance.getUserResearches(event, userId);
        }

      case 'POST':
        console.log('Manejando POST /research');
        return await controllerInstance.createResearch(event, userId);

      case 'PUT':
        console.log('Manejando PUT /research/{researchId}');
        return await controllerInstance.updateResearch(event, userId);

      case 'DELETE':
        console.log('Manejando DELETE /research/{researchId}');
        return await controllerInstance.deleteResearch(event, userId);

      default:
        return createResponse(405, {
          error: 'Método no permitido',
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
        }, event);
    }

  } catch (error: unknown) {
    console.error('Error en mainHandler:', error);
    const appError = toApplicationError(error);
    return createResponse(500, {
      error: 'Error interno del servidor',
      details: appError.message || 'Error no especificado'
    }, event);
  }
};

// <<< Mantener comentado el RouteMap y el handler original con createController >>>
/*
// Definir el mapa de rutas para NewResearch
const newResearchRouteMap: RouteMap = {
  // Ruta base para investigaciones
  '/research/all': {
    'GET': controllerInstance.getAllResearches.bind(controllerInstance) // Obtener todas las investigaciones
  },
  // Ruta para crear investigación
  '/research': {
    'POST': controllerInstance.createResearch.bind(controllerInstance) // Crear nueva investigación
  },
  // Ruta para investigación específica por ID
  '/research/{researchId}': {
    'GET': controllerInstance.getResearchById.bind(controllerInstance),    // Obtener investigación por ID
    'PUT': controllerInstance.updateResearch.bind(controllerInstance),    // Actualizar investigación por ID
    'DELETE': controllerInstance.deleteResearch.bind(controllerInstance) // Eliminar investigación por ID
  },
  // Ruta para cambiar el estado de una investigación
  '/research/{researchId}/status': {
    'PUT': controllerInstance.changeResearchStatus.bind(controllerInstance) // Cambiar estado
  }
  // Podríamos añadir más rutas específicas aquí si fuera necesario
};

// Exportación original comentada
export const newResearchHandler_original = createController(newResearchRouteMap, {
  basePath: '/research',
});
*/

// Export handler for index.ts compatibility
export const handler = mainHandler;

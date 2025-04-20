import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NewResearch } from '../models/newResearch.model';
import { newResearchService, ResearchError } from '../services/newResearch.service';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';

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
      console.log('Request recibida en createResearch:', {
        path: event.path,
        method: event.httpMethod,
        headers: event.headers,
        body: event.body,
        requestContext: event.requestContext
      });
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        console.log('Error: No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la investigación', 400);
      }

      console.log('ID de usuario extraído:', userId);
      
      if (!userId) {
        console.log('Error: Usuario no autenticado');
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const researchData: NewResearch = JSON.parse(event.body);
      console.log('Datos de investigación parseados:', researchData);

      // Crear la investigación usando el servicio
      console.log('Llamando al servicio para crear la investigación...');
      const newResearch = await newResearchService.createResearch(researchData, userId);
      console.log('Investigación creada correctamente:', newResearch);

      // Verificar que la investigación se creó correctamente y tiene un ID
      if (newResearch && newResearch.id) {
        // La pantalla de bienvenida se creará solo cuando el usuario la configure explícitamente
        console.log(`Nueva investigación creada con ID: ${newResearch.id}`);
      }

      return createResponse(201, {
        message: 'Investigación creada exitosamente',
        data: newResearch
      });
    } catch (error) {
      console.error('Error completo en createResearch:', error);
      return this.handleError(error);
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
      const researchId = event.pathParameters?.id;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener la investigación
      const research = await newResearchService.getResearchById(researchId, userId);

      return createResponse(200, {
        data: research
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene todas las investigaciones del usuario autenticado
   * @param event Evento de API Gateway (no utilizado directamente)
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con las investigaciones del usuario
   */
  async getUserResearches(_event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener investigaciones del usuario
      const researches = await newResearchService.getUserResearches(userId);

      return createResponse(200, {
        data: researches
      });
    } catch (error) {
      return this.handleError(error);
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
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la investigación', 400);
      }

      // Obtener ID de la investigación de los parámetros
      const researchId = event.pathParameters?.id;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const updateData: Partial<NewResearch> = JSON.parse(event.body);

      // Actualizar la investigación
      const updatedResearch = await newResearchService.updateResearch(
        researchId,
        updateData,
        userId
      );

      return createResponse(200, {
        message: 'Investigación actualizada exitosamente',
        data: updatedResearch
      });
    } catch (error) {
      return this.handleError(error);
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
      const researchId = event.pathParameters?.id;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Eliminar la investigación
      const result = await newResearchService.deleteResearch(researchId, userId);

      return createResponse(200, {
        message: result.message
      });
    } catch (error) {
      return this.handleError(error);
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
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requiere especificar el nuevo estado', 400);
      }

      // Obtener ID de la investigación de los parámetros
      const researchId = event.pathParameters?.id;
      if (!researchId) {
        return errorResponse('ID de investigación no proporcionado', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const { status } = JSON.parse(event.body);
      if (!status) {
        return errorResponse('Se requiere especificar el nuevo estado', 400);
      }

      // Cambiar el estado de la investigación
      const updatedResearch = await newResearchService.changeResearchStatus(
        researchId,
        status,
        userId
      );

      return createResponse(200, {
        message: `Estado cambiado a '${status}' exitosamente`,
        data: updatedResearch
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene todas las investigaciones (acceso solo para administradores)
   * @param _event Evento de API Gateway (no utilizado directamente)
   * @param userId ID del usuario autenticado
   * @returns Respuesta HTTP con todas las investigaciones
   */
  async getAllResearches(_event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener todas las investigaciones
      const researches = await newResearchService.getAllResearches();

      return createResponse(200, {
        data: researches
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Maneja un error y genera una respuesta HTTP apropiada
   * @param error Error capturado
   * @returns Respuesta HTTP con detalles del error
   */
  private handleError(error: any): APIGatewayProxyResult {
    console.error('Error en controlador de investigaciones:', error);
    
    if (error instanceof ResearchError) {
      const responseBody: any = {
        message: error.message
      };
      
      // Si hay errores de validación, incluirlos en la respuesta
      if (error.validationErrors) {
        responseBody.errors = error.validationErrors;
      }
      
      return createResponse(error.statusCode, responseBody);
    }
    
    return createResponse(500, {
      message: 'Error interno del servidor'
    });
  }
}

// Instanciar el controlador
const controller = new NewResearchController();

// Definir el mapa de rutas para Investigaciones
const researchRouteMap: RouteMap = {
  '/research': {
    'GET': controller.getAllResearches.bind(controller),
    'POST': controller.createResearch.bind(controller)
  },
  
  '/research/user': {
    'GET': controller.getUserResearches.bind(controller)
  },
  
  '/research/current': {
    'GET': controller.getUserResearches.bind(controller)
  },
  
  '/research/all': {
    'GET': controller.getAllResearches.bind(controller)
  },
  
  '/research/:id': {
    'GET': controller.getResearchById.bind(controller),
    'PUT': controller.updateResearch.bind(controller),
    'DELETE': controller.deleteResearch.bind(controller)
  },
  
  '/research/:id/status': {
    'PUT': controller.changeResearchStatus.bind(controller)
  }
};

/**
 * Manejador principal para las operaciones de investigación
 * 
 * Utiliza el decorador de controlador para manejar la autenticación y CORS automáticamente.
 * 
 * Rutas soportadas:
 * - POST /research : Crea una nueva investigación
 * - GET /research/user : Obtiene todas las investigaciones del usuario
 * - GET /research/:id : Obtiene una investigación por su ID
 * - PUT /research/:id : Actualiza una investigación existente
 * - DELETE /research/:id : Elimina una investigación
 * - PUT /research/:id/status : Cambia el estado de una investigación
 */
export const researchHandler = createController(researchRouteMap, {
  basePath: '/research',
  // No hay rutas públicas, todas requieren autenticación
}); 
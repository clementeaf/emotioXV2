import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { CognitiveTaskService } from '../services/cognitiveTask.service';
import { CognitiveTaskFormData, Question } from '../../../shared/interfaces/cognitive-task.interface';
import { validateUserId, extractResearchId, ERROR_MESSAGES } from '../utils/validation';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

/**
 * Controlador para manejar operaciones relacionadas con formularios CognitiveTask
 * Refactorizado para seguir el patrón estándar.
 */
@createController
export class CognitiveTaskController {
  private service: CognitiveTaskService;

  constructor() {
    this.service = new CognitiveTaskService();
  }

  /**
   * Log estructurado con nivel, contexto y mensaje
   */
  private log(level: 'info' | 'error' | 'warn' | 'debug', context: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: `CognitiveTaskController.${context}`,
      message,
      ...(data && { data })
    };
    
    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Maneja errores en las operaciones del controlador
   */
  private handleError(error: any, context: string): APIGatewayProxyResult {
    this.log('error', context, 'Error al procesar la solicitud', { error });
    
    // Verificar si es un error de DynamoDB relacionado con recursos no encontrados
    if (error.name === 'ResourceNotFoundException') {
      return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('El formulario CognitiveTask'), 404);
    }
    
    // Verificar si es un error de validación de datos
    if (error.name === 'ValidationError') {
      return errorResponse('Error de validación: ' + error.message, 400);
    }
    
    // Verificar si es un error de acceso denegado
    if (error.name === 'AccessDeniedException') {
      return errorResponse(ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }
    
    // Error genérico
    return errorResponse(`Error al ${context}: ${error.message || 'error desconocido'}`, 500);
  }

  // Función auxiliar para validación y extracción común
  private validateAndExtractIds(event: APIGatewayProxyEvent): { userId: string; researchId: string; taskId?: string } | APIGatewayProxyResult {
    const userId = event.requestContext.authorizer?.claims?.sub;
    const userValidationError = validateUserId(userId);
    if (userValidationError) return userValidationError;

    const researchIdResult = extractResearchId(event);
    if ('statusCode' in researchIdResult) return researchIdResult;
    const { researchId } = researchIdResult;

    // Extraer taskId si existe (para update/delete)
    const taskId = event.pathParameters?.taskId;
    
    return { userId: userId!, researchId, taskId };
  }

  /**
   * Obtiene un formulario CognitiveTask según el ID de investigación
   */
  public async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      const { researchId } = extracted;

      this.log('info', 'get', 'Obteniendo datos para investigación', { researchId });
      const form = await this.service.getByResearchId(researchId);
      
      if (!form) {
          return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask'), 404);
      }

      return successResponse(form);
    } catch (error) {
      return this.handleError(error, 'obtener formulario CognitiveTask');
    }
  }

  /**
   * Crea un formulario CognitiveTask
   */
  public async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      const { researchId } = extracted;
      
      if (!event.body) {
        this.log('error', 'create', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear el formulario', 400);
      }
      
      let formData: CognitiveTaskFormData;
      try {
        formData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'create', 'Error al parsear JSON', { error: e });
        return errorResponse('Formato JSON inválido', 400);
      }
      
      this.log('info', 'create', 'Creando formulario CognitiveTask', { researchId });
      const result = await this.service.create(researchId, formData);
      
      return createResponse(201, result);
    } catch (error) {
      return this.handleError(error, 'crear formulario CognitiveTask');
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente usando su ID
   */
  public async update(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      const { researchId, taskId } = extracted;

      if (!taskId) {
          return errorResponse('Falta el ID de la tarea cognitiva en la ruta', 400);
      }
      
      if (!event.body) {
        this.log('error', 'update', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para actualizar el formulario', 400);
      }
      
      let formData: Partial<CognitiveTaskFormData>;
      try {
        formData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'update', 'Error al parsear JSON', { error: e });
        return errorResponse('Formato JSON inválido', 400);
      }
      
      this.log('info', 'update', 'Actualizando formulario CognitiveTask', { researchId, taskId });
      const result = await this.service.update(taskId, formData);
      
      return successResponse(result);
    } catch (error) {
      if (error.message?.includes('no encontrado') || error.statusCode === 404) {
           return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask'), 404);
      }
      return this.handleError(error, 'actualizar formulario CognitiveTask');
    }
  }

  /**
   * Elimina un formulario CognitiveTask usando su ID
   */
  public async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      const { researchId, taskId } = extracted;

      if (!taskId) {
          return errorResponse('Falta el ID de la tarea cognitiva en la ruta', 400);
      }

      this.log('info', 'delete', 'Eliminando formulario CognitiveTask', { researchId, taskId });
      await this.service.delete(taskId);
      
      return successResponse({ message: 'Formulario CognitiveTask eliminado con éxito' });
    } catch (error) {
      if (error.message?.includes('no encontrado') || error.statusCode === 404) {
           return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask'), 404);
      }
      return this.handleError(error, 'eliminar formulario CognitiveTask');
    }
  }

  // Definir el mapa de rutas para el decorador
  public routes(): RouteMap<CognitiveTaskController> {
    return {
      // Ruta base /research/{researchId}/cognitive-task
      '^': {
        GET: this.get,    // Maneja GET sin ID de tarea
        POST: this.create,  // Maneja POST sin ID de tarea
      },
      // Ruta con ID /research/{researchId}/cognitive-task/{taskId}
      '^\/[^\/]+$': {
        // GET con ID (opcional, si se necesita obtener por ID específico)
        // GET: this.getById, 
        PUT: this.update,   // Maneja PUT con ID de tarea
        DELETE: this.delete // Maneja DELETE con ID de tarea
      }
    };
  }
}

// Instanciar el controlador
const controller = new CognitiveTaskController();

// Definir el mapa de rutas para CognitiveTask
const cognitiveTaskRouteMap: RouteMap = {
  // Ruta jerárquica para cognitive-task asociado a investigación
  '/research/{researchId}/cognitive-task': {
    'GET': controller.get.bind(controller),
    'POST': controller.create.bind(controller),
    'PUT': controller.update.bind(controller),
    'DELETE': controller.delete.bind(controller)
  }
};

/**
 * Manejador principal para las rutas de formularios CognitiveTask
 * 
 * Utiliza el decorador de controlador para manejar la autenticación y CORS automáticamente.
 * 
 * Estructura jerárquica:
 * - GET /research/{researchId}/cognitive-task : Obtiene el formulario CognitiveTask de la investigación
 * - POST /research/{researchId}/cognitive-task : Crea un nuevo formulario CognitiveTask para la investigación
 * - PUT /research/{researchId}/cognitive-task : Actualiza el formulario CognitiveTask de la investigación
 * - DELETE /research/{researchId}/cognitive-task : Elimina el formulario CognitiveTask de la investigación
 */
export const cognitiveTaskHandler = createController(cognitiveTaskRouteMap, {
  basePath: '',  // Sin base path para permitir múltiples patrones de ruta
  // No hay rutas públicas, todas requieren autenticación
});

export default cognitiveTaskHandler; 
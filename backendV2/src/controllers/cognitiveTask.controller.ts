import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { CognitiveTaskService } from '../services/cognitiveTask.service';
import { CognitiveTaskFormData } from '../../../shared/interfaces/cognitive-task.interface';
import { validateUserId, extractResearchId, ERROR_MESSAGES } from '../utils/validation';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

/**
 * Controlador para manejar operaciones relacionadas con formularios CognitiveTask
 */
export class CognitiveTaskController {
  private service: CognitiveTaskService;
  private cache: Map<string, { data: any; timestamp: number; researchId: string }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minuto en milisegundos

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

  /**
   * Obtiene un formulario CognitiveTask según el ID de investigación
   */
  public async getCognitiveTaskForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const result = validateUserId(userId);
      if (result) return result;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar si tenemos una versión en caché válida
      const cacheKey = `cognitiveTask_${researchId}_${userId}`;
      const cachedEntry = this.cache.get(cacheKey);
      
      if (cachedEntry && 
          (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL && 
          cachedEntry.researchId === researchId) {
        this.log('info', 'getCognitiveTaskForm', 'Datos recuperados de caché', { researchId });
        return successResponse(cachedEntry.data);
      }

      // Si no hay caché o está expirado, obtener datos frescos
      this.log('info', 'getCognitiveTaskForm', 'Obteniendo datos para investigación', { researchId });
      const form = await this.service.getCognitiveTaskFormByResearchId(researchId);
      
      // Guardar en caché
      if (form) {
        this.cache.set(cacheKey, {
          data: form,
          timestamp: Date.now(),
          researchId
        });
      }
      
      return successResponse(form || { message: 'No se encontró un formulario CognitiveTask para esta investigación' });
    } catch (error) {
      return this.handleError(error, 'obtener formulario CognitiveTask');
    }
  }

  /**
   * Crea un formulario CognitiveTask
   */
  public async createCognitiveTaskForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        this.log('error', 'createCognitiveTaskForm', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear el formulario CognitiveTask', 400);
      }
      
      // Parsear el cuerpo de la petición
      let formData: CognitiveTaskFormData;
      try {
        formData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'createCognitiveTaskForm', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }
      
      // Asegurar que el researchId esté en el objeto de datos
      formData.researchId = researchId;

      this.log('info', 'createCognitiveTaskForm', 'Creando formulario CognitiveTask', { researchId });
      const result = await this.service.createCognitiveTaskForm(researchId, formData);
      
      // Invalidar caché al crear
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'crear formulario CognitiveTask');
    }
  }

  /**
   * Actualiza un formulario CognitiveTask
   */
  public async updateCognitiveTaskForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        this.log('error', 'updateCognitiveTaskForm', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para actualizar el formulario CognitiveTask', 400);
      }
      
      // Parsear el cuerpo de la petición
      let formData: CognitiveTaskFormData;
      try {
        formData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'updateCognitiveTaskForm', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }
      
      // Asegurar que el researchId esté en el objeto de datos
      formData.researchId = researchId;

      this.log('info', 'updateCognitiveTaskForm', 'Actualizando formulario CognitiveTask', { researchId });
      
      // Obtener el ID del formulario existente
      const existingForm = await this.service.getCognitiveTaskFormByResearchId(researchId);
      if (!existingForm) {
        return errorResponse('No existe un formulario CognitiveTask para actualizar', 404);
      }
      
      const result = await this.service.updateCognitiveTaskForm(existingForm.id, formData);
      
      // Invalidar caché al actualizar
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'actualizar formulario CognitiveTask');
    }
  }

  /**
   * Elimina un formulario CognitiveTask
   */
  public async deleteCognitiveTaskForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;

      this.log('info', 'deleteCognitiveTaskForm', 'Eliminando formulario CognitiveTask', { researchId });
      
      // Obtener el ID del formulario existente
      const existingForm = await this.service.getCognitiveTaskFormByResearchId(researchId);
      if (!existingForm) {
        return errorResponse('No existe un formulario CognitiveTask para eliminar', 404);
      }
      
      await this.service.deleteCognitiveTaskForm(existingForm.id);
      
      // Invalidar caché al eliminar
      this.invalidateCache(researchId, userId);
      
      return successResponse({ message: 'Formulario CognitiveTask eliminado con éxito' });
    } catch (error) {
      return this.handleError(error, 'eliminar formulario CognitiveTask');
    }
  }

  /**
   * Invalida la entrada de caché para un researchId específico
   */
  private invalidateCache(researchId: string, userId: string): void {
    const cacheKey = `cognitiveTask_${researchId}_${userId}`;
    this.cache.delete(cacheKey);
    this.log('debug', 'invalidateCache', 'Caché invalidado', { researchId });
  }

  /**
   * Mapa de rutas para el controlador CognitiveTask
   */
  public routes(): Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> {
    return {
      // Ruta jerárquica para operaciones con formularios CognitiveTask relacionados con una investigación específica
      'GET /research/{researchId}/cognitive-task': this.getCognitiveTaskForm.bind(this),
      'POST /research/{researchId}/cognitive-task': this.createCognitiveTaskForm.bind(this),
      'PUT /research/{researchId}/cognitive-task': this.updateCognitiveTaskForm.bind(this),
      'DELETE /research/{researchId}/cognitive-task': this.deleteCognitiveTaskForm.bind(this)
    };
  }
}

// Instanciar el controlador
const controller = new CognitiveTaskController();

// Definir el mapa de rutas para CognitiveTask
const cognitiveTaskRouteMap: RouteMap = {
  // Ruta jerárquica para cognitive-task asociado a investigación
  '/research/{researchId}/cognitive-task': {
    'GET': controller.getCognitiveTaskForm.bind(controller),
    'POST': controller.createCognitiveTaskForm.bind(controller),
    'PUT': controller.updateCognitiveTaskForm.bind(controller),
    'DELETE': controller.deleteCognitiveTaskForm.bind(controller)
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
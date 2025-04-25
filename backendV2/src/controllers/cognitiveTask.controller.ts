import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { CognitiveTaskService, CognitiveTaskError } from '../services/cognitiveTask.service';
import { CognitiveTaskFormData } from '../../../shared/interfaces/cognitive-task.interface';
import { validateUserId, extractResearchId, ERROR_MESSAGES } from '../utils/validation';
import { ApiError } from '../utils/errors';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

/**
 * Controlador para manejar operaciones relacionadas con formularios CognitiveTask
 * Utiliza el decorador createController para enrutamiento y middleware.
 */
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
   * Maneja errores en las operaciones del controlador, incluyendo ApiError del servicio.
   */
  private handleError(error: any, context: string): APIGatewayProxyResult {
    const errorData = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
    this.log('error', context, 'Error al procesar la solicitud', { error: errorData });
    
    if (error instanceof ApiError) {
      // Usar el código y mensaje del ApiError lanzado por el servicio
      // Mapear códigos de error específicos si es necesario, o usar directamente
      let statusCode = error.statusCode;
      let message = error.message;

      // Ejemplo de mapeo (se puede refinar según necesidad)
      if (message.startsWith(CognitiveTaskError.NOT_FOUND)) {
        statusCode = 404;
        message = ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask');
      } else if (message.startsWith(CognitiveTaskError.INVALID_DATA) || message.startsWith(CognitiveTaskError.RESEARCH_REQUIRED)) {
        statusCode = 400;
      } else if (message.startsWith(CognitiveTaskError.PERMISSION_DENIED)) {
        statusCode = 403;
        message = ERROR_MESSAGES.AUTH.FORBIDDEN;
      } // Añadir más mapeos si se necesitan (ej. FILE_ERROR, DATABASE_ERROR)
      
      return errorResponse(message, statusCode);
    }

    // Fallback para errores no esperados (que no son ApiError)
    // Mantener manejo específico si es necesario, aunque idealmente el servicio captura todo
    if (error.name === 'ResourceNotFoundException') { // Específico de AWS SDK v2? Revisar si aplica con v3
      return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Recurso DynamoDB'), 404);
    }
    if (error.name === 'AccessDeniedException') { // Específico de AWS SDK v2? Revisar si aplica con v3
      return errorResponse(ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }
    
    // Error genérico por defecto
    return errorResponse(`Error interno del servidor al ${context}`, 500);
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
    // La validación de si es obligatorio se hace en el método que lo requiere
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
      
      // El servicio debería lanzar ApiError si no se encuentra, que será capturado por handleError
      // Ya no es necesario el chequeo explícito de null aquí si el servicio maneja NOT_FOUND
      // if (!form) {
      //     return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask'), 404);
      // }

      // Si form es null y el servicio NO lanza error (comportamiento inesperado), devolvemos 404 igualmente.
      if (!form) {
         this.log('warn', 'get', 'Servicio retornó null pero no lanzó ApiError para NOT_FOUND', { researchId });
         return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask'), 404);
      }

      return successResponse(form);
    } catch (error) {
      // handleError se encarga de mapear ApiError (incluyendo NOT_FOUND) a la respuesta correcta
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
      const { researchId } = extracted; // userId no se usa directamente aquí, pero se valida
      
      if (!event.body) {
        this.log('error', 'create', 'No hay cuerpo en la petición');
        // Podría ser un ApiError específico
        return errorResponse('Se requieren datos para crear el formulario', 400); 
      }
      
      let formData: CognitiveTaskFormData;
      try {
        formData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'create', 'Error al parsear JSON', { error: e });
        return errorResponse('Formato JSON inválido', 400);
      }
      
      // Añadir researchId a los datos que se envían al servicio si no viene en el body
      // O asegurar que el servicio lo maneje correctamente. Asumimos que el servicio espera researchId como argumento separado.
      // formData.researchId = researchId; // Descomentar si es necesario

      this.log('info', 'create', 'Creando formulario CognitiveTask', { researchId });
      // El servicio valida los datos internos de formData
      const result = await this.service.create(researchId, formData); 
      
      return createResponse(201, result);
    } catch (error) {
       // handleError maneja ApiError de validación (INVALID_DATA) y otros errores
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
      const { researchId, taskId } = extracted; // userId no se usa directamente aquí

      if (!taskId) {
          // Lanzar un error que handleError pueda interpretar como Bad Request (400)
          throw new ApiError('Falta el ID de la tarea cognitiva en la ruta', 400);
      }
      
      if (!event.body) {
        this.log('error', 'update', 'No hay cuerpo en la petición');
        // Lanzar un error que handleError pueda interpretar como Bad Request (400)
        throw new ApiError('Se requieren datos para actualizar el formulario', 400);
      }
      
      let formData: Partial<CognitiveTaskFormData>;
      try {
        formData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'update', 'Error al parsear JSON', { error: e });
        throw new ApiError('Formato JSON inválido', 400);
      }
      
      this.log('info', 'update', 'Actualizando formulario CognitiveTask', { researchId, taskId });
      const result = await this.service.update(taskId, formData); 
      
      return successResponse(result);
    } catch (error) {
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
          throw new ApiError('Falta el ID de la tarea cognitiva en la ruta', 400);
      }

      this.log('info', 'delete', 'Eliminando formulario CognitiveTask', { researchId, taskId });
      await this.service.delete(taskId); 
      
      return successResponse({ message: 'Formulario CognitiveTask eliminado con éxito' });
    } catch (error) {
      return this.handleError(error, 'eliminar formulario CognitiveTask');
    }
  }

  public routes(): RouteMap {
    return {
      '^': {
        'GET': this.get.bind(this),
        'POST': this.create.bind(this),
      },

      '^\/[^\/]+$': {

        'PUT': this.update.bind(this),
        'DELETE': this.delete.bind(this)
      }
    };
  }
}

const controllerInstance = new CognitiveTaskController();

export const cognitiveTaskHandler = createController(controllerInstance.routes(), { basePath: '' }); // <<< AÑADIR basePath
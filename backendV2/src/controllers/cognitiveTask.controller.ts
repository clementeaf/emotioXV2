import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { cognitiveTaskService, CognitiveTaskError } from '../services/cognitiveTask.service';
import { CognitiveTaskFormData, Question, UploadedFile } from '../../../shared/interfaces/cognitive-task.interface';
import { extractResearchId, ERROR_MESSAGES, parseAndValidateBody, validateCognitiveTaskData } from '../utils/validation';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';
import s3Service from '../services/s3.service';


/**
 * Controlador para manejar operaciones relacionadas con formularios CognitiveTask
 * Utiliza el decorador createController para enrutamiento y middleware.
 */
export class CognitiveTaskController {
  /**
   * Maneja errores en las operaciones del controlador, incluyendo ApiError del servicio.
   */
  private handleError(error: any, context: string, extraData?: Record<string, any>): APIGatewayProxyResult {
    // Usar structuredLog para el error
    structuredLog('error', `CognitiveTaskController.${context}`, 'Error procesando la solicitud', {
      error: error instanceof Error ? { name: error.name, message: error.message } : error,
      ...extraData
    });

    if (error instanceof ApiError) {
      let statusCode = error.statusCode;
      let message = error.message;

      // Mapeo de errores específicos del servicio
      if (message.startsWith(CognitiveTaskError.NOT_FOUND)) {
        statusCode = 404;
        message = ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask');
      } else if (message.startsWith(CognitiveTaskError.INVALID_DATA) || message.startsWith(CognitiveTaskError.RESEARCH_REQUIRED)) {
        statusCode = 400;
      } else if (message.startsWith(CognitiveTaskError.PERMISSION_DENIED)) {
        statusCode = 403;
        message = ERROR_MESSAGES.AUTH.FORBIDDEN;
      } // Añadir más mapeos si es necesario
      
      // Usar createResponse para consistencia
      return createResponse(statusCode, { error: message });
    }

    // Error genérico por defecto
    return createResponse(500, { error: `Error interno del servidor al ${context}` });
  }

  // Función auxiliar para validación y extracción común
  private validateAndExtractIds(event: APIGatewayProxyEvent): { /*userId: string;*/ researchId: string; taskId?: string } | APIGatewayProxyResult {
    // const userId = event.requestContext.authorizer?.claims?.sub;
    // const userValidationError = validateUserId(userId);
    // if (userValidationError) return userValidationError;

    const researchIdResult = extractResearchId(event);
    if ('statusCode' in researchIdResult) return researchIdResult;
    const { researchId } = researchIdResult;

    const taskId = event.pathParameters?.taskId;
    
    // return { userId: userId!, researchId, taskId };
    return { researchId, taskId }; // Devolver solo researchId y taskId
  }

  /**
   * Obtiene un formulario CognitiveTask según el ID de investigación
   */
  public async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'get'; // Definir contexto para logs
    let researchId: string | undefined;
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      researchId = extracted.researchId; // Asignar para usar en catch

      structuredLog('info', `CognitiveTaskController.${context}`, 'Obteniendo datos para investigación', { researchId });
      const form = await cognitiveTaskService.getByResearchId(researchId);
      
      // Si el servicio devuelve null pero no lanza ApiError (comportamiento inesperado)
      if (!form) {
         structuredLog('warn', `CognitiveTaskController.${context}`, 'Servicio retornó null pero no lanzó ApiError para NOT_FOUND', { researchId });
         return createResponse(404, { error: ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario CognitiveTask') });
      }

      structuredLog('info', `CognitiveTaskController.${context}`, 'Formulario encontrado', { researchId, formId: form.id });
      return createResponse(200, form);
    } catch (error) {
      return this.handleError(error, context, { researchId }); // Pasar IDs al handleError
    }
  }

  /**
   * Crea un formulario CognitiveTask
   */
  public async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'create';
    let researchId: string | undefined;
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      researchId = extracted.researchId; // Asignar para usar en catch

      // Usar parseAndValidateBody
      const bodyResult = parseAndValidateBody<CognitiveTaskFormData>(event, validateCognitiveTaskData);
      if ('statusCode' in bodyResult) return bodyResult;
      const formData = bodyResult.data;
      
      structuredLog('info', `CognitiveTaskController.${context}`, 'Creando formulario CognitiveTask', { researchId });
      // Pasar userId al servicio si es necesario para lógica de permisos/auditoría
      const result = await cognitiveTaskService.create(researchId, formData /*, userId */); 
      
      structuredLog('info', `CognitiveTaskController.${context}`, 'Formulario creado', { researchId, formId: result.id });
      return createResponse(201, result);
    } catch (error) {
       // handleError maneja ApiError de validación (INVALID_DATA) y otros errores
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente usando su ID
   */
  public async update(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'update';
    let researchId: string | undefined;
    let taskId: string | undefined;
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      researchId = extracted.researchId;
      taskId = extracted.taskId;

      if (!taskId) {
          throw new ApiError('Falta el ID de la tarea cognitiva en la ruta', 400);
      }

      const bodyResult = parseAndValidateBody<Partial<CognitiveTaskFormData>>(event, data => validateCognitiveTaskData(data, true));
      if ('statusCode' in bodyResult) return bodyResult;
      const formData = bodyResult.data;

      structuredLog('info', `CognitiveTaskController.${context}`, 'Actualizando formulario CognitiveTask', { researchId, taskId });

      const currentTask = await cognitiveTaskService.getById(taskId);
      if (currentTask && currentTask.questions) {
        const s3KeysToDelete: string[] = [];

        currentTask.questions.forEach((currentQuestion: Question) => {
          const currentFiles = currentQuestion.files || []; 
          const updatedQuestion = formData.questions?.find(q => q.id === currentQuestion.id);
          const updatedFiles = updatedQuestion?.files || [];

          if (currentFiles.length > 0) {
            currentFiles.forEach((currentFile: UploadedFile) => {
              if (!currentFile || !currentFile.s3Key) return;

              const isFileKept = (updatedFiles as UploadedFile[]).some(updatedFile => 
                updatedFile && currentFile && 
                updatedFile.id === currentFile.id && 
                updatedFile.s3Key === currentFile.s3Key
              );

              if (!isFileKept) {
                s3KeysToDelete.push(currentFile.s3Key);
                structuredLog('info', `CognitiveTaskController.${context}.s3Delete`, 'Archivo marcado para eliminación de S3', { researchId, taskId, questionId: currentQuestion.id, fileId: currentFile.id, s3Key: currentFile.s3Key });
              }
            });
          }
        });

        if (s3KeysToDelete.length > 0) {
          structuredLog('info', `CognitiveTaskController.${context}.s3Delete`, `Intentando eliminar ${s3KeysToDelete.length} archivos de S3`, { researchId, taskId, keys: s3KeysToDelete });
          const deletePromises = s3KeysToDelete.map(key =>
            s3Service.deleteObject(key).catch((err: unknown) => {
              let errorMessage = 'Error desconocido';
              if (err instanceof Error) {
                  errorMessage = err.message;
              } else if (typeof err === 'string') {
                  errorMessage = err;
              }
              structuredLog('error', `CognitiveTaskController.${context}.s3Delete`, `Error al eliminar archivo de S3: ${key}`, { researchId, taskId, error: errorMessage });
            })
          );
          await Promise.all(deletePromises);
        }
      } else if (currentTask) {
          structuredLog('warn', `CognitiveTaskController.${context}.s3Delete`, 'No se encontraron preguntas en el registro actual para verificar archivos S3', { researchId, taskId });
      } else {
          structuredLog('warn', `CognitiveTaskController.${context}.s3Delete`, 'No se encontró el registro actual para verificar archivos S3', { researchId, taskId });
      }

      const result = await cognitiveTaskService.update(taskId, formData);

      structuredLog('info', `CognitiveTaskController.${context}`, 'Formulario actualizado', { researchId, taskId });
      return createResponse(200, result);
    } catch (error) {
      return this.handleError(error, context, { researchId, taskId });
    }
  }

  /**
   * Elimina un formulario CognitiveTask usando su ID
   */
  public async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'delete';
    let researchId: string | undefined;
    let taskId: string | undefined;
    try {
      const extracted = this.validateAndExtractIds(event);
      if ('statusCode' in extracted) return extracted;
      researchId = extracted.researchId;
      taskId = extracted.taskId;

      if (!taskId) {
          throw new ApiError('Falta el ID de la tarea cognitiva en la ruta', 400);
      }

      structuredLog('info', `CognitiveTaskController.${context}`, 'Eliminando formulario CognitiveTask', { researchId, taskId });
      // Pasar userId si es necesario
      await cognitiveTaskService.delete(taskId /*, userId */); 
      
      structuredLog('info', `CognitiveTaskController.${context}`, 'Formulario eliminado', { researchId, taskId });
      // Respuesta 204 No Content para DELETE exitoso
      return createResponse(204, null); 
    } catch (error) {
      return this.handleError(error, context, { researchId, taskId });
    }
  }

  public routes(): RouteMap {
    // Usar rutas relativas al basePath esperado
    return {
      '/': { // Corresponde a /research/{researchId}/cognitive-task
        'GET': this.get.bind(this),
        'POST': this.create.bind(this),
      },
      '/{taskId}': { // Corresponde a /research/{researchId}/cognitive-task/{taskId}
        'PUT': this.update.bind(this),
        'DELETE': this.delete.bind(this)
      }
    };
  }
}

const controllerInstance = new CognitiveTaskController();

// Definir RouteMap como constante, usando rutas relativas al nuevo basePath 'research'
const cognitiveTaskRouteMap: RouteMap = {
  // Mapear la ruta completa relativa al basePath
  '/{researchId}/cognitive-task': { 
    'GET': controllerInstance.get.bind(controllerInstance),
    'POST': controllerInstance.create.bind(controllerInstance),
  },
  // Mapear la ruta con taskId relativa al basePath
  '/{researchId}/cognitive-task/{taskId}': {
    'PUT': controllerInstance.update.bind(controllerInstance),
    'DELETE': controllerInstance.delete.bind(controllerInstance)
  }
};

// Crear el handler principal usando el decorador
// export const cognitiveTaskHandler = createController(cognitiveTaskRouteMap, {
export const mainHandler = createController(cognitiveTaskRouteMap, {
  basePath: '/research', // Base path común para estas rutas
});
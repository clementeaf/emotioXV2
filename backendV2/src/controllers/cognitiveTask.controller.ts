import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitiveTaskFormData } from '../../../shared/interfaces/cognitive-task.interface';
import { cognitiveTaskService } from '../services/cognitiveTask.service';
import {
  createResponse,
  errorResponse,
  validateTokenAndSetupAuth
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

/**
 * Maneja las solicitudes entrantes para Cognitive Task
 */
const cognitiveTaskHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, body, path } = event;
  const researchId = pathParameters?.researchId;

  if (!researchId) {
    return errorResponse('Se requiere researchId en la ruta', 400);
  }

  // Validar token y obtener userId
  const authResult = await validateTokenAndSetupAuth(event, event.path);
  if ('statusCode' in authResult) {
    return authResult;
  }
  const userId = authResult.userId;

  // Manejar la ruta especial de upload-url
  if (path.includes('/upload-url') && httpMethod === 'POST') {
    structuredLog('info', 'CognitiveTaskHandler.UPLOAD_URL', 'Iniciando generación de URL de upload', { researchId });
    
    if (!body) {
      return errorResponse('Se requiere cuerpo en la solicitud para generar URL de upload', 400);
    }

    try {
      const uploadData = JSON.parse(body);
      
      // Generar key único para S3
      const timestamp = Date.now();
      const s3Key = `cognitive-task/${researchId}/${timestamp}-${uploadData.fileName}`;
      const uploadUrl = `https://example-bucket.s3.amazonaws.com/${s3Key}`;
      
      // Estructura de respuesta esperada por el frontend
      const response = {
        uploadUrl,
        file: {
          s3Key,
          fileName: uploadData.fileName,
          contentType: uploadData.contentType || 'application/octet-stream',
          size: uploadData.size || 0,
          uploadedAt: new Date().toISOString()
        }
      };
      
      structuredLog('info', 'CognitiveTaskHandler.UPLOAD_URL', 'URL de upload generada exitosamente', { researchId, s3Key, uploadUrl });
      return createResponse(200, response);
    } catch (error) {
      structuredLog('error', 'CognitiveTaskHandler.UPLOAD_URL', 'Error generando URL de upload', { researchId, error });
      return errorResponse('Error generando URL de upload', 500);
    }
  }

  try {
    switch (httpMethod) {
      case 'GET':
        structuredLog('info', 'CognitiveTaskHandler.GET', 'Iniciando obtención', { researchId });
        const task = await cognitiveTaskService.getByResearchId(researchId);
        structuredLog('info', 'CognitiveTaskHandler.GET', 'Obtención exitosa', { researchId });
        return createResponse(200, task);

      case 'POST':
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud para guardar', 400);
        }

        const data: CognitiveTaskFormData = JSON.parse(body);
        structuredLog('info', 'CognitiveTaskHandler.POST', 'Iniciando guardado (upsert)', { researchId, userId });
        const result = await cognitiveTaskService.updateByResearchId(researchId, data, userId);
        structuredLog('info', 'CognitiveTaskHandler.POST', 'Guardado (upsert) exitoso', { researchId, taskId: result.id });
        return createResponse(200, result);

      case 'PUT':
        const taskId = pathParameters?.taskId;
        if (!taskId) {
          return errorResponse('Se requiere taskId en la ruta para actualizar', 400);
        }
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud para actualizar', 400);
        }

        const updateData: Partial<CognitiveTaskFormData> = JSON.parse(body);
        structuredLog('info', 'CognitiveTaskHandler.PUT', 'Iniciando actualización por ID', { researchId, taskId, userId });
        // Corregido: El servicio `update` no espera userId
        const updatedResult = await cognitiveTaskService.update(taskId, updateData);
        structuredLog('info', 'CognitiveTaskHandler.PUT', 'Actualización por ID exitosa', { researchId, taskId });
        return createResponse(200, updatedResult);

      case 'DELETE':
        const taskIdToDelete = pathParameters?.taskId;

        if (taskIdToDelete) {
          // Eliminar por taskId específico
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Iniciando eliminación por ID', { researchId, taskId: taskIdToDelete });
          // Corregido: El servicio `delete` no espera userId
          await cognitiveTaskService.delete(taskIdToDelete);
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Eliminación por ID exitosa', { researchId, taskId: taskIdToDelete });
        } else {
          // Eliminar configuración completa de la investigación
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Iniciando eliminación por researchId', { researchId });
          await cognitiveTaskService.deleteByResearchId(researchId);
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Eliminación por researchId exitosa', { researchId });
        }
        return createResponse(204, null);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405);
    }
  } catch (error: any) {
    structuredLog('error', `CognitiveTaskHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: error.message,
      stack: error.stack
    });
    if (error.name === 'NotFoundError' || error.message.includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de Cognitive Task no encontrada.' });
    }
    return errorResponse(error.message, error.statusCode || 500);
  }
};
export const handler = cognitiveTaskHandler;

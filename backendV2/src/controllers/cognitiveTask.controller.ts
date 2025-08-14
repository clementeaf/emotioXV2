import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitiveTaskFormData } from '../../../shared/interfaces/cognitive-task.interface';
import { cognitiveTaskService } from '../services/cognitiveTask.service';
import {
  createResponse,
  errorResponse
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

/**
 * Maneja las solicitudes entrantes para Cognitive Task
 */
const cognitiveTaskHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, body } = event;
  const researchId = pathParameters?.researchId;
  const userId = event.requestContext.authorizer?.claims.sub;

  if (!researchId) {
    return errorResponse('Se requiere researchId en la ruta', 400);
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
        if (!userId) {
          return errorResponse('No se pudo identificar al usuario', 403);
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
        if (!userId) {
          return errorResponse('No se pudo identificar al usuario', 403);
        }

        const updateData: Partial<CognitiveTaskFormData> = JSON.parse(body);
        structuredLog('info', 'CognitiveTaskHandler.PUT', 'Iniciando actualización por ID', { researchId, taskId, userId });
        const updatedResult = await cognitiveTaskService.update(taskId, updateData, userId);
        structuredLog('info', 'CognitiveTaskHandler.PUT', 'Actualización por ID exitosa', { researchId, taskId });
        return createResponse(200, updatedResult);

      case 'DELETE':
        const taskIdToDelete = pathParameters?.taskId;
        if (!userId) {
          return errorResponse('No se pudo identificar al usuario', 403);
        }

        if (taskIdToDelete) {
          // Eliminar por taskId específico
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Iniciando eliminación por ID', { researchId, taskId: taskIdToDelete });
          await cognitiveTaskService.delete(taskIdToDelete, userId);
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Eliminación por ID exitosa', { researchId, taskId: taskIdToDelete });
        } else {
          // Eliminar configuración completa de la investigación
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Iniciando eliminación por researchId', { researchId });
          await cognitiveTaskService.deleteByResearchId(researchId);
          structuredLog('info', 'CognitiveTaskHandler.DELETE', 'Eliminación por researchId exitosa', { researchId });
        }
        return createResponse(204, null);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, {
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
        });
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

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitiveTaskFormData } from '../../../shared/interfaces/cognitive-task.interface';
import { cognitiveTaskService } from '../services/cognitiveTask.service';
import { FileType, S3Service } from '../services/s3.service';
import {
  createResponse,
  errorResponse,
  validateTokenAndSetupAuth
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

// Crear instancia del servicio S3
const s3Service = new S3Service();

/**
 * Maneja las solicitudes entrantes para Cognitive Task
 */
const cognitiveTaskHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, body, path } = event;
  const researchId = pathParameters?.researchId;

  if (!researchId) {
    return errorResponse('Se requiere researchId en la ruta', 400, event);
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
      return errorResponse('Se requiere cuerpo en la solicitud para generar URL de upload', 400, event);
    }

    try {
      const uploadData = JSON.parse(body);
      structuredLog('debug', 'CognitiveTaskHandler.UPLOAD_URL', 'Datos recibidos para upload', { researchId, uploadData });

      // Determinar el tipo de archivo basado en la extensión o MIME type
      let fileType = FileType.DOCUMENT; // Default
      const mimeType = uploadData.contentType || uploadData.mimeType || uploadData.fileType || 'application/octet-stream';

      if (mimeType.startsWith('image/')) {
        fileType = FileType.IMAGE;
      } else if (mimeType.startsWith('video/')) {
        fileType = FileType.VIDEO;
      } else if (mimeType.startsWith('audio/')) {
        fileType = FileType.AUDIO;
      }

      structuredLog('debug', 'CognitiveTaskHandler.UPLOAD_URL', 'Parámetros para S3Service', {
        researchId,
        fileName: uploadData.fileName,
        fileType,
        mimeType,
        fileSize: uploadData.size || 0
      });

      // Generar URL presignada real usando S3 Service
      const presignedResponse = await s3Service.generateUploadUrl({
        researchId,
        folder: 'cognitive-task',
        fileName: uploadData.fileName,
        fileType,
        mimeType,
        fileSize: uploadData.size || 0,
        expiresIn: 15 * 60 // 15 minutos
      });

      // Estructura de respuesta esperada por el frontend
      const response = {
        uploadUrl: presignedResponse.uploadUrl,
        file: {
          s3Key: presignedResponse.key,
          fileName: uploadData.fileName,
          contentType: mimeType,
          size: uploadData.size || 0,
          uploadedAt: new Date().toISOString(),
          fileUrl: presignedResponse.fileUrl,
          expiresAt: presignedResponse.expiresAt
        }
      };

      structuredLog('info', 'CognitiveTaskHandler.UPLOAD_URL', 'URL de upload generada exitosamente', {
        researchId,
        s3Key: presignedResponse.key,
        uploadUrl: presignedResponse.uploadUrl
      });
      return createResponse(200, response, event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      structuredLog('error', 'CognitiveTaskHandler.UPLOAD_URL', 'Error generando URL de upload', {
        researchId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        uploadData: body ? JSON.parse(body) : null
      });
      return errorResponse(`Error generando URL de upload: ${errorMessage}`, 500, event);
    }
  }

  try {
    switch (httpMethod) {
      case 'GET':
        structuredLog('info', 'CognitiveTaskHandler.GET', 'Iniciando obtención', { researchId });
        const task = await cognitiveTaskService.getByResearchId(researchId);
        structuredLog('info', 'CognitiveTaskHandler.GET', 'Obtención exitosa', { researchId });
        return createResponse(200, task, event);

      case 'POST':
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud para guardar', 400, event);
        }

        const data: CognitiveTaskFormData = JSON.parse(body);
        structuredLog('info', 'CognitiveTaskHandler.POST', 'Iniciando guardado (upsert)', { researchId, userId });
        const result = await cognitiveTaskService.updateByResearchId(researchId, data, userId);
        structuredLog('info', 'CognitiveTaskHandler.POST', 'Guardado (upsert) exitoso', { researchId, taskId: result.id });
        return createResponse(200, result, event);

      case 'PUT':
        const taskId = pathParameters?.taskId;
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud para actualizar', 400, event);
        }

        const updateData: Partial<CognitiveTaskFormData> = JSON.parse(body);

        if (taskId) {
          // Actualizar por taskId específico
          structuredLog('info', 'CognitiveTaskHandler.PUT', 'Iniciando actualización por ID', { researchId, taskId, userId });
          const updatedResult = await cognitiveTaskService.update(taskId, updateData);
          structuredLog('info', 'CognitiveTaskHandler.PUT', 'Actualización por ID exitosa', { researchId, taskId });
          return createResponse(200, updatedResult, event);
        } else {
          // Actualizar por researchId (upsert)
          structuredLog('info', 'CognitiveTaskHandler.PUT', 'Iniciando actualización por researchId (upsert)', { researchId, userId });
          const result = await cognitiveTaskService.updateByResearchId(researchId, updateData as CognitiveTaskFormData, userId);
          structuredLog('info', 'CognitiveTaskHandler.PUT', 'Actualización por researchId exitosa', { researchId, taskId: result.id });
          return createResponse(200, result, event);
        }

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
        return createResponse(204, null, event);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, event);
    }
  } catch (error: any) {
    structuredLog('error', `CognitiveTaskHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: error.message,
      stack: error.stack
    });
    if (error.name === 'NotFoundError' || error.message.includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de Cognitive Task no encontrada.' }, event);
    }
    return errorResponse(error.message, error.statusCode || 500, event);
  }
};
export const handler = cognitiveTaskHandler;

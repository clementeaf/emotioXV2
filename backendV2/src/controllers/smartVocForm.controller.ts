import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
import { SmartVOCFormService } from '../services/smartVocForm.service';
import {
  createResponse,
  errorResponse
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

const smartVocService = new SmartVOCFormService();

const smartVocFormHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, body } = event;
  const researchId = pathParameters?.researchId;
  const userId = event.requestContext.authorizer?.claims?.sub;

  if (!researchId) {
    return errorResponse('Se requiere researchId en la ruta', 400);
  }

  try {
    switch (httpMethod) {
      case 'GET':
        structuredLog('info', 'SmartVocFormHandler.GET', 'Iniciando obtención', { researchId });
        const form = await smartVocService.getByResearchId(researchId);
        structuredLog('info', 'SmartVocFormHandler.GET', 'Obtención exitosa', { researchId });
        return createResponse(200, form);

      case 'POST':
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud', 400);
        }
        if (!userId) {
          return errorResponse('No se pudo identificar al usuario', 403);
        }

        const data: SmartVOCFormData = JSON.parse(body);
        structuredLog('info', 'SmartVocFormHandler.POST', 'Iniciando guardado (upsert)', { researchId, userId });

        const existingForm = await smartVocService.getByResearchId(researchId);
        let result;
        if (existingForm) {
          result = await smartVocService.update(existingForm.id, data, userId);
          structuredLog('info', 'SmartVocFormHandler.POST', 'Actualización exitosa', { researchId, formId: result.id });
        } else {
          result = await smartVocService.create(data, researchId, userId);
          structuredLog('info', 'SmartVocFormHandler.POST', 'Creación exitosa', { researchId, formId: result.id });
        }
        return createResponse(200, result);

      case 'DELETE':
        if (!userId) {
          return errorResponse('No se pudo identificar al usuario', 403);
        }
        structuredLog('info', 'SmartVocFormHandler.DELETE', 'Iniciando eliminación por researchId', { researchId });
        await smartVocService.deleteByResearchId(researchId, userId);
        structuredLog('info', 'SmartVocFormHandler.DELETE', 'Eliminación por researchId exitosa', { researchId });
        return createResponse(204, null);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405);
    }
  } catch (error: any) {
    structuredLog('error', `SmartVocFormHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: error.message,
      stack: error.stack
    });
    if (error.name === 'NotFoundError' || error.message.includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de SmartVOC no encontrada.' });
    }
    return errorResponse(error.message, error.statusCode || 500);
  }
};

export const handler = smartVocFormHandler;

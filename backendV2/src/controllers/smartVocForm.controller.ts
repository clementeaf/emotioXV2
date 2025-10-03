import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
import { SmartVOCFormService } from '../services/smartVocForm.service';
import {
  createResponse,
  errorResponse,
  validateTokenAndSetupAuth
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

const smartVocService = new SmartVOCFormService();

const smartVocFormHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, body, path } = event;
  
  // Extract researchId from path manually: /research/{researchId}/smart-voc
  const pathMatch = path.match(/^\/research\/([^\/]+)\/smart-voc/);
  const researchId = pathMatch?.[1];

  if (!researchId) {
    return errorResponse('Se requiere researchId en la ruta', 400, event);
  }

  // Validar token y obtener userId
  const authResult = await validateTokenAndSetupAuth(event, event.path);
  if ('statusCode' in authResult) {
    return authResult;
  }
  const userId = authResult.userId;

  try {
    switch (httpMethod) {
      case 'GET':
        structuredLog('info', 'SmartVocFormHandler.GET', 'Iniciando obtención', { researchId });
        const form = await smartVocService.getByResearchId(researchId);
        structuredLog('info', 'SmartVocFormHandler.GET', 'Obtención exitosa', { researchId });
        return createResponse(200, form, event);

      case 'POST':
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud', 400, event);
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
        return createResponse(200, result, event);

      case 'DELETE':
        structuredLog('info', 'SmartVocFormHandler.DELETE', 'Iniciando eliminación por researchId', { researchId });
        await smartVocService.deleteByResearchId(researchId, userId);
        structuredLog('info', 'SmartVocFormHandler.DELETE', 'Eliminación por researchId exitosa', { researchId });
        return createResponse(204, null, event);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, event);
    }
  } catch (error: unknown) {
    structuredLog('error', `SmartVocFormHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: error.message,
      stack: error.stack
    });
    if (error.name === 'NotFoundError' || error.message.includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de SmartVOC no encontrada.' }, event);
    }
    return errorResponse(error.message, error.statusCode || 500, event);
  }
};

export const handler = smartVocFormHandler;

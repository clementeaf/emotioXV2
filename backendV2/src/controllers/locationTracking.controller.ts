import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LocationTrackingService } from '../services/locationTracking.service';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';
import { validateLocationData } from '../utils/validation';

const locationTrackingService = new LocationTrackingService();

/**
 * Handler para gestión de ubicación del participante
 */
const locationTrackingHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, body } = event;
  const participantId = pathParameters?.participantId;
  const researchId = pathParameters?.researchId;

  try {
    switch (httpMethod) {
      case 'POST':
        // Guardar ubicación
        if (!body) {
          return errorResponse('Se requiere cuerpo en la solicitud', 400, event);
        }
        if (!participantId || !researchId) {
          return errorResponse('Se requiere participantId y researchId', 400, event);
        }

        const locationData = JSON.parse(body);
        
        // Validar datos de entrada
        const validationResult = validateLocationData(locationData);
        if (!validationResult.isValid) {
          return errorResponse('Datos de ubicación inválidos', 400, event);
        }

        structuredLog('info', 'LocationTrackingHandler.POST', 'Guardando ubicación', { participantId, researchId });
        
        await locationTrackingService.saveLocation({
          ...locationData,
          participantId,
          researchId,
          timestamp: new Date().toISOString()
        });

        structuredLog('info', 'LocationTrackingHandler.POST', 'Ubicación guardada exitosamente', { participantId, researchId });
        return createResponse(200, { success: true, message: 'Ubicación guardada exitosamente' }, event);

      case 'GET':
        // Obtener ubicaciones
        if (!participantId || !researchId) {
          return errorResponse('Se requiere participantId y researchId', 400, event);
        }

        structuredLog('info', 'LocationTrackingHandler.GET', 'Obteniendo ubicaciones', { participantId, researchId });
        
        const locations = await locationTrackingService.getLocationsByResearchId(researchId);
        
        structuredLog('info', 'LocationTrackingHandler.GET', 'Ubicaciones obtenidas', { 
          participantId, 
          researchId, 
          count: locations.length 
        });
        
        return createResponse(200, locations, event);

      case 'DELETE':
        // Eliminar ubicaciones
        if (!participantId || !researchId) {
          return errorResponse('Se requiere participantId y researchId', 400, event);
        }

        structuredLog('info', 'LocationTrackingHandler.DELETE', 'Eliminando ubicaciones', { participantId, researchId });
        
        await locationTrackingService.deleteLocationsByResearchId(researchId);
        
        structuredLog('info', 'LocationTrackingHandler.DELETE', 'Ubicaciones eliminadas', { participantId, researchId });
        
        return createResponse(204, null, event);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, event);
    }
  } catch (error: any) {
    structuredLog('error', `LocationTrackingHandler.${httpMethod}`, 'Error en el handler', {
      participantId,
      researchId,
      error: error.message,
      stack: error.stack
    });
    return errorResponse(error.message, error.statusCode || 500, event);
  }
};

export const handler = locationTrackingHandler;
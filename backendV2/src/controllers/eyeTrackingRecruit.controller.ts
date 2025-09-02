import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eyeTrackingService } from '../services/eyeTracking.service';
import {
  createResponse,
  errorResponse,
  validateTokenAndSetupAuth
} from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

/**
 * Controlador específico para Eye Tracking Recruit
 * Maneja las rutas /eye-tracking-recruit/research/{researchId}
 */
const eyeTrackingRecruitHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, path } = event;
  
  // Extract researchId from path since this route uses proxy+
  // Path format: /eye-tracking-recruit/research/{researchId}
  let researchId = pathParameters?.researchId;
  
  if (!researchId && path) {
    const pathMatch = path.match(/\/eye-tracking-recruit\/research\/([^\/]+)/);
    researchId = pathMatch ? pathMatch[1] : undefined;
  }

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
        structuredLog('info', 'EyeTrackingRecruitHandler.GET', 'Obteniendo configuración de recruit', { researchId });
        
        // Usar el mismo servicio que eye-tracking normal para obtener la configuración
        const config = await eyeTrackingService.getByResearchId(researchId);
        
        structuredLog('info', 'EyeTrackingRecruitHandler.GET', 'Configuración obtenida exitosamente', { 
          researchId, 
          hasConfig: !!config 
        });
        
        return createResponse(200, config, event);

      case 'POST':
      case 'PUT':
        // Para crear/actualizar configuración de recruit, usar el servicio estándar
        if (!event.body) {
          return errorResponse('Se requiere cuerpo en la solicitud', 400, event);
        }

        const data = JSON.parse(event.body);
        structuredLog('info', `EyeTrackingRecruitHandler.${httpMethod}`, 'Iniciando actualización de configuración', { researchId });
        
        const result = await eyeTrackingService.updateByResearchId(researchId, data, userId);
        
        structuredLog('info', `EyeTrackingRecruitHandler.${httpMethod}`, 'Configuración actualizada exitosamente', { 
          researchId, 
          configId: result.id 
        });
        
        return createResponse(200, result, event);

      case 'DELETE':
        structuredLog('info', 'EyeTrackingRecruitHandler.DELETE', 'Iniciando eliminación de configuración', { researchId });
        
        const configToDelete = await eyeTrackingService.getByResearchId(researchId);
        if (configToDelete) {
          await eyeTrackingService.delete(configToDelete.id, userId);
          structuredLog('info', 'EyeTrackingRecruitHandler.DELETE', 'Configuración eliminada exitosamente', { researchId });
        } else {
          structuredLog('info', 'EyeTrackingRecruitHandler.DELETE', 'No se encontró configuración para eliminar', { researchId });
        }
        
        return createResponse(204, null, event);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, event);
    }
  } catch (error: unknown) {
    structuredLog('error', `EyeTrackingRecruitHandler.${httpMethod}`, 'Error en el handler', {
      researchId,
      error: ((error as Error)?.message || "Error desconocido"),
      stack: (error as Error)?.stack
    });
    
    if ((error as Error)?.name === 'NotFoundError' || ((error as Error)?.message || "Error desconocido").includes('NOT_FOUND')) {
      return createResponse(404, { message: 'Configuración de Eye Tracking no encontrada.' }, event);
    }
    
    return errorResponse(((error as Error)?.message || "Error desconocido"), (error as { statusCode?: number }).statusCode || 500, event);
  }
};

export const handler = eyeTrackingRecruitHandler;
export const mainHandler = eyeTrackingRecruitHandler;
export default eyeTrackingRecruitHandler;
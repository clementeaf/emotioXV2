import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eyeTrackingRecruitService } from '../services/eyeTrackingRecruit.service';
import { 
  CreateEyeTrackingRecruitRequest 
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';
import { ApiError } from '../utils/errors';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';
import { 
  extractResearchId, 
  ERROR_MESSAGES,
  parseAndValidateBody,
  validateEyeTrackingRecruitData
} from '../utils/validation';

/**
 * Controlador para manejar operaciones relacionadas con reclutamiento para eye tracking
 */
export class EyeTrackingRecruitController {
  /**
   * Maneja errores en las operaciones del controlador (simplificado)
   */
  private handleError(error: any, context: string, extraData?: Record<string, any>): APIGatewayProxyResult {
    structuredLog('error', `EyeTrackingRecruitController.${context}`, 'Error procesando la solicitud', { 
        error: error instanceof Error ? { name: error.name, message: error.message } : error,
        ...extraData
    });

    if (error?.name === 'NotFoundError') { 
        return errorResponse(error.message, 404); 
    }

    if (error instanceof ApiError) {
      return errorResponse(error.message, error.statusCode);
    }
    
    structuredLog('error', `EyeTrackingRecruitController.${context}`, 'Cayendo en Fallback 500', { errorType: typeof error, errorName: error?.name, errorMessage: (error as Error)?.message });
    return errorResponse('Error interno del servidor', 500);
  }

  /**
   * Obtiene la configuración de reclutamiento, estadísticas, links y participantes
   * Ruta: GET /research/{researchId}/eye-tracking-recruit
   */
  public async getEyeTrackingRecruit(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getEyeTrackingRecruit';
    let researchId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Obteniendo datos para investigación', { researchId });
      const config = await eyeTrackingRecruitService.getConfigByResearchId(researchId);
      
      if (!config) {
        structuredLog('warn', `EyeTrackingRecruitController.${context}`, 'No se encontró configuración de reclutamiento (explicit check)', { researchId });
        return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de reclutamiento'), 404);
      }
      
      const configId = config.id;
      if (!configId) {
         structuredLog('error', `EyeTrackingRecruitController.${context}`, 'ID de configuración faltante después de obtener config', { researchId });
         return errorResponse('Error interno: ID de configuración faltante.', 500);
      }
      
      const [stats, links, participants] = await Promise.all([
        eyeTrackingRecruitService.getStatsByConfigId(configId),
        eyeTrackingRecruitService.getActiveLinks(configId),
        eyeTrackingRecruitService.getParticipantsByConfigId(configId)
      ]);
      
      const fullData = { config, stats, links, participants };
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Datos de reclutamiento obtenidos', { researchId, configId });
      return createResponse(200, fullData);
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Obtiene SOLO la configuración de reclutamiento según el ID de investigación
   * Ruta: GET /research/{researchId}/eye-tracking-recruit/config
   */
  public async getEyeTrackingRecruitConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getEyeTrackingRecruitConfig';
    let researchId: string | undefined;
    try {
      // // <<< Revertir a extracción desde event.path >>>
      const pathSegments = event.path.split('/'); // ['', 'eye-tracking-recruit', 'research', 'researchId', 'config']
      if (pathSegments.length < 4 || !pathSegments[3]) {
          return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('ID de investigación en la ruta /eye-tracking-recruit/research/{id}'), 400);
      }
      researchId = pathSegments[3]; // El ID está en el 4to segmento (índice 3)
      
      // // <<< Eliminar lógica de extracción de proxyPath >>>
      // const proxyPath = event.pathParameters?.proxy;
      // if (!proxyPath) {
      //     return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('Parámetro proxy en la ruta'), 400);
      // }
      // // Asumir que proxyPath es algo como "research/researchId/config"
      // const proxySegments = proxyPath.split('/'); // ['research', 'researchId', 'config']
      // if (proxySegments.length < 2 || !proxySegments[1]) {
      //     return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('ID de investigación dentro del parámetro proxy'), 400);
      // }
      // researchId = proxySegments[1]; // El ID estaría en el segundo segmento del proxy
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Obteniendo solo config para investigación', { researchId });
      
      // // <<< Restaurar llamada al servicio >>>
      const config = await eyeTrackingRecruitService.getConfigByResearchId(researchId);
      
      if (!config) {
        structuredLog('warn', `EyeTrackingRecruitController.${context}`, 'No se encontró configuración de reclutamiento', { researchId });
        return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de reclutamiento'), 404);
      }
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Configuración obtenida', { researchId, configId: config.id });
      // // Devolver solo el objeto de configuración
      return createResponse(200, { config }); 

      // // <<< Eliminar respuesta de debug >>>
      // return createResponse(200, { extractedResearchId: researchId, pathParamUsed: 'proxy' });

    } catch (error) {
      return this.handleError(error, context, { researchId }); // researchId podría ser undefined aquí si falla antes
    }
  }

  /**
   * Crea una configuración de reclutamiento
   */
  public async createEyeTrackingRecruit(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    const context = 'createEyeTrackingRecruit';
    let researchId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;
      
      const bodyResult = parseAndValidateBody<CreateEyeTrackingRecruitRequest>(event, validateEyeTrackingRecruitData);
      if ('statusCode' in bodyResult) return bodyResult;
      const configData = bodyResult.data;
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Creando configuración de reclutamiento', { researchId });
      const result = await eyeTrackingRecruitService.createConfig(researchId, configData);
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Configuración creada', { researchId, configId: result.id });
      return createResponse(201, { 
          message: "Configuración de reclutamiento creada exitosamente",
          config: result 
      });
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Actualiza una configuración de reclutamiento
   */
  public async updateEyeTrackingRecruit(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    const context = 'updateEyeTrackingRecruit';
    let researchId: string | undefined;
    let configId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;
      
      const bodyResult = parseAndValidateBody<Partial<CreateEyeTrackingRecruitRequest>>(event, /* validador opcional para update */);
      if ('statusCode' in bodyResult) return bodyResult;
      const updateData = bodyResult.data;
      
      const existingConfig = await eyeTrackingRecruitService.getConfigByResearchId(researchId);
      if (!existingConfig || !existingConfig.id) {
         structuredLog('warn', `EyeTrackingRecruitController.${context}`, 'No se encontró config para actualizar', { researchId });
         return errorResponse('No existe una configuración de reclutamiento para actualizar', 404);
      }
      configId = existingConfig.id as string;

      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Actualizando configuración de reclutamiento', { researchId, configId });
      const result = await eyeTrackingRecruitService.updateConfig(configId, updateData);
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Configuración actualizada', { researchId, configId: result.id });
      return createResponse(200, { 
          message: "Configuración de reclutamiento actualizada exitosamente",
          config: result 
      });
    } catch (error) {
      return this.handleError(error, context, { researchId, configId });
    }
  }

  /**
   * Elimina una configuración de reclutamiento
   */
  public async deleteEyeTrackingRecruit(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    const context = 'deleteEyeTrackingRecruit';
    let researchId: string | undefined;
    let configId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;

      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Eliminando configuración de reclutamiento', { researchId });
      
      const existingConfig = await eyeTrackingRecruitService.getConfigByResearchId(researchId);
      if (!existingConfig || !existingConfig.id) {
         structuredLog('warn', `EyeTrackingRecruitController.${context}`, 'No se encontró config para eliminar', { researchId });
         return createResponse(204, null);
      }
      configId = existingConfig.id as string;
      
      await eyeTrackingRecruitService.deleteConfig(configId);
      
      structuredLog('info', `EyeTrackingRecruitController.${context}`, 'Configuración eliminada', { researchId, configId });
      return createResponse(204, null); 
    } catch (error) {
      return this.handleError(error, context, { researchId, configId });
    }
  }
}

const controller = new EyeTrackingRecruitController();

export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path || '';
  const method = event.httpMethod;
  // El userId se podría extraer aquí si los métodos lo necesitan consistentemente
  // const userId = event.requestContext.authorizer?.claims?.sub;

  // Lógica de enrutamiento simple basada en el final del path
  if (method === 'GET' && path.endsWith('/config')) {
    return controller.getEyeTrackingRecruitConfig(event);
  } else if (method === 'GET') {
    return controller.getEyeTrackingRecruit(event);
  } else if (method === 'POST') {
    // Asumimos que userId se pasa internamente si es necesario
    return controller.createEyeTrackingRecruit(event, 'placeholder-user-id'); // TODO: Pasar userId real si es necesario
  } else if (method === 'PUT') {
    return controller.updateEyeTrackingRecruit(event, 'placeholder-user-id'); // TODO: Pasar userId real si es necesario
  } else if (method === 'DELETE') {
    return controller.deleteEyeTrackingRecruit(event, 'placeholder-user-id'); // TODO: Pasar userId real si es necesario
  }
  
  // Si no coincide ninguna ruta conocida dentro de este controlador
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, // Headers básicos
    body: JSON.stringify({ message: `Método ${method} no soportado para la ruta ${path} dentro del controlador EyeTrackingRecruit` })
  };
}; 
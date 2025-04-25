import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eyeTrackingRecruitService } from '../services/eyeTrackingRecruit.service';
import { 
  CreateEyeTrackingRecruitRequest 
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';
import { ApiError } from '../utils/errors';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
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

    if (error instanceof ApiError) {
      return errorResponse(error.message, error.statusCode);
    }
    
    if (error.message?.includes('RECRUIT_CONFIG_NOT_FOUND')) {
       return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de reclutamiento'), 404);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }

  /**
   * Obtiene la configuración de reclutamiento según el ID de investigación
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
        structuredLog('warn', `EyeTrackingRecruitController.${context}`, 'No se encontró configuración de reclutamiento', { researchId });
        return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de reclutamiento'), 404);
      }
      
      const configId = config.id as string;
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

const eyeTrackingRecruitRouteMap: RouteMap = {
  '/research/{researchId}/eye-tracking-recruit': {
    'GET': controller.getEyeTrackingRecruit.bind(controller),
    'POST': controller.createEyeTrackingRecruit.bind(controller),
    'PUT': controller.updateEyeTrackingRecruit.bind(controller),
    'DELETE': controller.deleteEyeTrackingRecruit.bind(controller)
  }
};

export const eyeTrackingRecruitHandler = createController(eyeTrackingRecruitRouteMap, {
  basePath: ''
}); 
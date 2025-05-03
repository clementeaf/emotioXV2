import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eyeTrackingService, EyeTrackingError } from '../services/eyeTracking.service';
import { ApiError } from '../utils/errors';
import { EyeTrackingFormData } from '../models/eyeTracking.model';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { structuredLog } from '../utils/logging.util';
import { 
  extractResearchId, 
  ERROR_MESSAGES,
  parseAndValidateBody,
  validateEyeTrackingData
} from '../utils/validation';

/**
 * Controlador para manejar operaciones relacionadas con eye tracking
 */
export class EyeTrackingController {
  /**
   * Maneja errores en las operaciones del controlador (simplificado)
   */
  private handleError(error: any, context: string, extraData?: Record<string, any>): APIGatewayProxyResult {
    structuredLog('error', `EyeTrackingController.${context}`, 'Error procesando la solicitud', { 
        error: error instanceof Error ? { name: error.name, message: error.message } : error,
        ...extraData
    });

    if (error instanceof ApiError) {
      return errorResponse(error.message, error.statusCode); 
    }

    if (error.message?.includes(EyeTrackingError.NOT_FOUND)) {
      return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de eye tracking'), 404);
    }
    if (error.message?.includes(EyeTrackingError.INVALID_DATA) ||
        error.message?.includes(EyeTrackingError.RESEARCH_REQUIRED)) {
      return errorResponse(error.message, 400);
    }
    if (error.message?.includes(EyeTrackingError.PERMISSION_DENIED)) {
      return errorResponse(ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }

    return errorResponse('Error interno del servidor', 500);
  }

  /**
   * Obtiene una configuración de eye tracking según el ID de investigación
   */
  public async getEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getEyeTracking';
    let researchId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;
      
      structuredLog('info', `EyeTrackingController.${context}`, 'Obteniendo datos para investigación', { researchId });
      const eyeTracking = await eyeTrackingService.getByResearchId(researchId);
      
      if (!eyeTracking) {
         structuredLog('warn', `EyeTrackingController.${context}`, 'No se encontró configuración (explicit check)', { researchId });
         return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Configuración de Eye Tracking'), 404);
      }

      structuredLog('info', `EyeTrackingController.${context}`, 'Configuración encontrada/creada', { researchId, id: eyeTracking.id });
      return createResponse(200, eyeTracking);
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Crea una configuración de eye tracking
   */
  public async createEyeTracking(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    const context = 'createEyeTracking';
    let researchId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;
      
      const bodyResult = parseAndValidateBody<EyeTrackingFormData>(event, validateEyeTrackingData);
      if ('statusCode' in bodyResult) return bodyResult;
      const configData = bodyResult.data;
      
      configData.researchId = researchId;

      structuredLog('info', `EyeTrackingController.${context}`, 'Creando configuración de eye tracking', { researchId });
      const result = await eyeTrackingService.create(configData, researchId, userId);
      
      structuredLog('info', `EyeTrackingController.${context}`, 'Configuración creada', { researchId, id: result.id });      
      return createResponse(201, { 
          message: "Configuración de eye tracking creada exitosamente",
          data: result 
      });
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Actualiza una configuración de eye tracking
   */
  public async updateEyeTracking(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    const context = 'updateEyeTracking';
    let researchId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;
      
      const bodyResult = parseAndValidateBody<EyeTrackingFormData>(event, validateEyeTrackingData);
      if ('statusCode' in bodyResult) return bodyResult;
      const configData = bodyResult.data;
      
      configData.researchId = researchId;

      structuredLog('info', `EyeTrackingController.${context}`, 'Actualizando configuración de eye tracking', { researchId });
      
      const result = await eyeTrackingService.updateByResearchId(researchId, configData, userId);
      
      structuredLog('info', `EyeTrackingController.${context}`, 'Configuración actualizada', { researchId, id: result.id });            
      return createResponse(200, {
          message: "Configuración de eye tracking actualizada exitosamente",
          data: result
      });
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Elimina una configuración de eye tracking
   */
  public async deleteEyeTracking(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    const context = 'deleteEyeTracking';
    let researchId: string | undefined;
    try {
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;

      structuredLog('info', `EyeTrackingController.${context}`, 'Eliminando configuración de eye tracking', { researchId });
      
      const existingConfig = await eyeTrackingService.getByResearchId(researchId);
      if (!existingConfig || !existingConfig.id) {
           structuredLog('error', `EyeTrackingController.${context}`, 'No se pudo obtener ID para eliminar', { researchId });
           return errorResponse('No se encontró la configuración para eliminar.', 404);
      }
      
      await eyeTrackingService.delete(existingConfig.id, userId);
      
      structuredLog('info', `EyeTrackingController.${context}`, 'Configuración eliminada', { researchId, id: existingConfig.id });                  
      return createResponse(204, null); 
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }
}

const controller = new EyeTrackingController();

const eyeTrackingRouteMap: RouteMap = {
  '/research/{researchId}/eye-tracking': {
    'GET': controller.getEyeTracking.bind(controller),
    'POST': controller.createEyeTracking.bind(controller),
    'PUT': controller.updateEyeTracking.bind(controller),
    'DELETE': controller.deleteEyeTracking.bind(controller)
  }
};

// Nueva exportación con el nombre estándar
export const mainHandler = createController(eyeTrackingRouteMap, {
    basePath: ''
}); 
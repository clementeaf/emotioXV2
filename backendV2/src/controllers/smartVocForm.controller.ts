import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SmartVOCFormService, SmartVOCError } from '../services/smartVocForm.service';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
import { ApiError } from '../utils/errors';
import { 
  validateUserId, 
  extractResearchId,
  parseAndValidateBody,
  ERROR_MESSAGES
} from '../utils/validation';
import { errorResponse, createResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { structuredLog } from '../utils/logging.util';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any, statusCode = 200): APIGatewayProxyResult => createResponse(statusCode, body);

/**
 * Controlador para manejar operaciones relacionadas con formularios SmartVOC
 */
export class SmartVOCFormController {
  private service: SmartVOCFormService;

  constructor() {
    this.service = new SmartVOCFormService();
  }

  /**
   * Maneja errores (ahora usa structuredLog)
   */
  private handleError(error: any, context: string): APIGatewayProxyResult {
    // Usar la utilidad compartida para loguear el error
    structuredLog('error', `SmartVOCFormController.${context}`, 'Error al procesar la solicitud', { 
        error: error instanceof Error ? { message: error.message, name: error.name } : error 
    });
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse(`Error interno del servidor al ${context}: ${error.message || 'error desconocido'}`, 500);
  }

  /**
   * Obtiene un formulario SmartVOC por ID de investigación (sin caché de controlador)
   * Ruta: GET /research/{researchId}/smart-voc
   */
  public async getSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getSmartVOCFormByResearchId';
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const validationError = validateUserId(userId);
      if (validationError) return validationError;
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      structuredLog('info', `SmartVOCFormController.${context}`, 'Obteniendo datos para investigación', { researchId: researchId }); 
      const form = await this.service.getByResearchId(researchId);
      
      if (!form) {
         structuredLog('info', `SmartVOCFormController.${context}`, 'Formulario no encontrado', { researchId: researchId }); 
         return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('Formulario SmartVOC para esta investigación'), 404);
      }
      
      structuredLog('info', `SmartVOCFormController.${context}`, 'Datos obtenidos', { researchId: researchId });
      return successResponse(form);

    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Crea un nuevo formulario SmartVOC (sin invalidación de caché del controlador)
   * Ruta: POST /research/{researchId}/smart-voc
   */
  public async createSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'createSmartVOCForm';
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const validationError = validateUserId(userId);
      if (validationError) return validationError;
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult; 
      const bodyResult = parseAndValidateBody<SmartVOCFormData>(event);
      if ('statusCode' in bodyResult) return bodyResult;
      const { data } = bodyResult;

      structuredLog('info', `SmartVOCFormController.${context}`, 'Intentando crear formulario', { researchId: researchId }); 
      const result = await this.service.create(data, researchId, userId);
      
      structuredLog('info', `SmartVOCFormController.${context}`, 'Formulario creado exitosamente', { formId: result.id, researchId: researchId }); 
      return successResponse(result, 201);

    } catch (error) {
      if (error instanceof ApiError && error.message.includes(SmartVOCError.ALREADY_EXISTS)) {
           structuredLog('warn', `SmartVOCFormController.${context}`, 'Intento de crear formulario duplicado', { researchId: (error as any)?.researchId || 'unknown' }); 
           return errorResponse(error.message, 409);
       }
      return this.handleError(error, context);
    }
  }

  /**
   * Actualiza un formulario SmartVOC existente por su ID (sin invalidación de caché del controlador)
   * Ruta: PUT /research/{researchId}/smart-voc/{formId}
   */
  public async updateSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'updateSmartVOCForm';
    let formId: string | undefined;
    let researchId: string | undefined;
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const validationError = validateUserId(userId);
      if (validationError) return validationError;
      researchId = event.pathParameters?.researchId;
      formId = event.pathParameters?.formId; 
      if (!researchId || !formId) {
        return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('researchId y formId en la ruta'), 400);
      }
      const bodyResult = parseAndValidateBody<Partial<SmartVOCFormData>>(event);
      if ('statusCode' in bodyResult) return bodyResult;
      const { data } = bodyResult;
      
      structuredLog('info', `SmartVOCFormController.${context}`, 'Intentando actualizar formulario', { formId: formId, researchId: researchId }); 
      const result = await this.service.update(formId, data, userId);

      structuredLog('info', `SmartVOCFormController.${context}`, 'Formulario actualizado exitosamente', { formId: formId, researchId: researchId });
      return successResponse(result, 200);

    } catch (error) {
      const logData = { formId: formId || 'unknown', researchId: researchId || 'unknown' };
      if (error instanceof ApiError && error.message.includes(SmartVOCError.NOT_FOUND)) {
           structuredLog('warn', `SmartVOCFormController.${context}`, 'Intento de actualizar formulario no encontrado', logData); 
           return errorResponse(error.message, 404);
       }
      return this.handleError(error, context); 
    }
  }

  /**
   * Elimina un formulario SmartVOC por su ID (sin invalidación de caché del controlador)
   * Ruta: DELETE /research/{researchId}/smart-voc/{formId}
   */
  public async deleteSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'deleteSmartVOCForm';
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const validationError = validateUserId(userId);
      if (validationError) return validationError;
      const researchId = event.pathParameters?.researchId;
      const formId = event.pathParameters?.formId; 
      if (!researchId || !formId) {
        return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('researchId y formId en la ruta'), 400);
      }

      structuredLog('info', `SmartVOCFormController.${context}`, 'Intentando eliminar formulario', { formId: formId, researchId: researchId }); 
      await this.service.delete(formId, userId);
      
      structuredLog('info', `SmartVOCFormController.${context}`, 'Formulario eliminado exitosamente', { formId: formId, researchId: researchId }); 
      return createResponse(204, null);

    } catch (error) {
       return this.handleError(error, context);
    }
  }

  /**
   * Mapa de rutas para el controlador SmartVOC
   */
  public routes(): Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> {
    return {
      'GET /research/{researchId}/smart-voc': this.getSmartVOCForm.bind(this),
      'POST /research/{researchId}/smart-voc': this.createSmartVOCForm.bind(this),
      'PUT /research/{researchId}/smart-voc/{formId}': this.updateSmartVOCForm.bind(this),
      'DELETE /research/{researchId}/smart-voc/{formId}': this.deleteSmartVOCForm.bind(this)
    };
  }
}

const controller = new SmartVOCFormController();

const smartVocRouteMap: RouteMap = {
  '/research/{researchId}/smart-voc': {
    'GET': controller.getSmartVOCForm.bind(controller),
    'POST': controller.createSmartVOCForm.bind(controller),
  },
  '/research/{researchId}/smart-voc/{formId}': {
    'PUT': controller.updateSmartVOCForm.bind(controller),
    'DELETE': controller.deleteSmartVOCForm.bind(controller)
  }
};

export const mainHandler = createController(smartVocRouteMap, {
  basePath: '', 
}); 
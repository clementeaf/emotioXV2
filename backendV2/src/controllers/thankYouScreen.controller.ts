import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { thankYouScreenService, ThankYouScreenError } from '../services/thankYouScreen.service';
import { ThankYouScreenFormData } from '../../../shared/interfaces/thank-you-screen.interface';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { structuredLog } from '../utils/logging.util';
import { ApiError } from '../utils/errors';
import { 
  validateUserId, 
  extractResearchId, 
  ERROR_MESSAGES, 
  parseAndValidateBody, 
  validateMultiple,
  validateScreenId,
  validateResearchId
} from '../utils/validation';
import { validateThankYouScreenData } from '../utils/validation';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

/**
 * Controlador para manejar operaciones relacionadas con pantallas de agradecimiento
 */
export class ThankYouScreenController {
  private service = thankYouScreenService;
  private cache: Map<string, { data: any; timestamp: number; researchId: string }> = new Map();
  private controllerName = 'ThankYouScreenController'; // Para logs

  constructor() {}

  /**
   * Maneja errores en las operaciones del controlador
   */
  private handleError(error: any, context: string, extraData?: Record<string, any>): APIGatewayProxyResult {
    structuredLog('error', `${this.controllerName}.${context}`, 'Error procesando la solicitud', { 
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
        ...extraData
    });
    
    if (error instanceof ApiError) {
        return createResponse(error.statusCode, { error: error.message });
    }    
    if (error.message?.includes(ThankYouScreenError.NOT_FOUND)) {
      return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La pantalla de agradecimiento'), 404);
    }
    if (error.message?.includes(ThankYouScreenError.PERMISSION_DENIED)) {
      return errorResponse(ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }
    if (error.message?.includes(ThankYouScreenError.INVALID_DATA) ||
        error.message?.includes(ThankYouScreenError.RESEARCH_REQUIRED)) {
      return errorResponse(error.message, 400);
    }
    
    return errorResponse(`Error interno del servidor en ${context}`, 500);
  }

  /**
   * Obtiene una pantalla de agradecimiento según el ID de investigación
   */
  public async getThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getThankYouScreen';
    let researchId: string | undefined;
    try {
      const isPublic = event.path.includes('/public/');
      let userId: string | undefined;
      
      if (!isPublic) {
        userId = event.requestContext.authorizer?.claims?.sub;
        const result = validateUserId(userId);
        if (result) return result;
      }

      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      researchId = idResult.researchId;
      
      /* --- INICIO: COMENTAR CACHÉ ---
      let cacheKey: string | undefined;
      let cachedEntry;
      
      if (!isPublic && userId) {
        cacheKey = `thankYouScreen_${researchId}_${userId}`;
        cachedEntry = this.cache.get(cacheKey);
        
        if (cachedEntry && (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL && cachedEntry.researchId === researchId) {
          structuredLog('info', `${this.controllerName}.${context}`, 'Datos recuperados de caché (TEMPORALMENTE DESHABILITADO)', { researchId });
          // return successResponse(cachedEntry.data); // <- Comentado
        }
      }
      --- FIN: COMENTAR CACHÉ --- */

      structuredLog('info', `${this.controllerName}.${context}`, 'Obteniendo datos para investigación (Caché deshabilitado)', { researchId, isPublic });
      const screen = await this.service.getByResearchId(researchId);
      
      if (isPublic) {
        if (!screen || !screen.isEnabled) {
          structuredLog('info', `${this.controllerName}.${context}`, 'Pantalla no encontrada o no habilitada para público', { researchId });
          return successResponse({ data: null, message: 'La pantalla de agradecimiento no está disponible' });
        }
        const participantView = {
          title: screen.title,
          message: screen.message,
          redirectUrl: screen.redirectUrl,
          isEnabled: screen.isEnabled
        };
        return successResponse({ data: participantView });
      }
      
      /* --- INICIO: COMENTAR CACHÉ ---
      if (!isPublic && screen && cacheKey) { // cacheKey podría ser undefined aquí
        // Asegurarse de que cacheKey se define incluso si el bloque if anterior se salta
        if (!cacheKey && userId) { 
            cacheKey = `thankYouScreen_${researchId}_${userId}`;
        }
        if (cacheKey) { // Doble chequeo por si userId no estaba definido
           this.cache.set(cacheKey, { data: screen, timestamp: Date.now(), researchId });
           structuredLog('info', `${this.controllerName}.${context}`, 'Datos guardados en caché (TEMPORALMENTE DESHABILITADO)', { researchId });
        }
      }
      --- FIN: COMENTAR CACHÉ --- */
      
      return successResponse(screen);
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Crea una pantalla de agradecimiento
   */
  public async createThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'createThankYouScreen';
    let researchId: string | undefined;
    let userId: string | undefined;
    try {
      userId = event.requestContext.authorizer?.claims?.sub;
      const researchResult = extractResearchId(event);
      
      const validationError = validateMultiple(
          validateUserId(userId),
          ('statusCode' in researchResult ? researchResult : null)
      );
      if (validationError) return validationError;

      if ('statusCode' in researchResult) return researchResult; 
      researchId = researchResult.researchId;

      const bodyResult = parseAndValidateBody<ThankYouScreenFormData>(event, validateThankYouScreenData);
      if ('statusCode' in bodyResult) return bodyResult;
      const screenData = bodyResult.data;
      
      structuredLog('info', `${this.controllerName}.${context}`, 'Creando pantalla de agradecimiento', { researchId });
      const result = await this.service.create(screenData, researchId, userId!);
      
      this.invalidateCache(researchId, userId!);
      structuredLog('info', `${this.controllerName}.${context}`, 'Creación completada', { researchId, screenId: result.id });
      
      return createResponse(201, result);
    } catch (error) {
      return this.handleError(error, context, { researchId });
    }
  }

  /**
   * Actualiza una pantalla de agradecimiento por su ID
   */
  public async updateThankYouScreenById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'updateThankYouScreenById';
    let researchId: string | undefined;
    let screenId: string | undefined;
    let userId: string | undefined;
    try {
      userId = event.requestContext.authorizer?.claims?.sub;
      researchId = event.pathParameters?.researchId;
      screenId = event.pathParameters?.screenId;
      
      const validationError = validateMultiple(
        validateUserId(userId),
        validateResearchId(researchId),
        validateScreenId(screenId)
      );
      if (validationError) return validationError;

      const bodyResult = parseAndValidateBody<ThankYouScreenFormData>(event, validateThankYouScreenData);
      if ('statusCode' in bodyResult) return bodyResult;
      const screenData = bodyResult.data;

      const currentResearchId = researchId!;
      const currentScreenId = screenId!;

      structuredLog('info', `${this.controllerName}.${context}`, 'Actualizando pantalla de agradecimiento por ID', { researchId: currentResearchId, screenId: currentScreenId });
      
      const result = await this.service.update(currentScreenId, screenData, userId!);
      
      this.invalidateCache(currentResearchId, userId!);
      structuredLog('info', `${this.controllerName}.${context}`, 'Actualización completada', { researchId: currentResearchId, screenId: result.id });
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, context, { researchId, screenId });
    }
  }

  /**
   * Elimina una pantalla de agradecimiento por su ID
   */
  public async deleteThankYouScreenById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'deleteThankYouScreenById';
    let researchId: string | undefined;
    let screenId: string | undefined;
    let userId: string | undefined;
    try {
      userId = event.requestContext.authorizer?.claims?.sub;
      researchId = event.pathParameters?.researchId;
      screenId = event.pathParameters?.screenId;
      
      const validationError = validateMultiple(
        validateUserId(userId),
        validateResearchId(researchId),
        validateScreenId(screenId)
      );
      if (validationError) return validationError;

      const currentResearchId = researchId!;
      const currentScreenId = screenId!;

      structuredLog('info', `${this.controllerName}.${context}`, 'Eliminando pantalla de agradecimiento por ID', { researchId: currentResearchId, screenId: currentScreenId });
      
      await this.service.delete(currentScreenId, userId!);
      
      this.invalidateCache(currentResearchId, userId!);
      structuredLog('info', `${this.controllerName}.${context}`, 'Eliminación completada', { researchId: currentResearchId, screenId: currentScreenId });
      
      return createResponse(204, null);
    } catch (error) {
      return this.handleError(error, context, { researchId, screenId });
    }
  }

  /**
   * Invalida la caché para una investigación específica
   */
  private invalidateCache(researchId: string, userId: string): void {
    const cacheKey = `thankYouScreen_${researchId}_${userId}`;
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      structuredLog('info', `${this.controllerName}.invalidateCache`, 'Caché invalidada', { researchId });
    }
  }
}

// Instanciar el controlador
const controller = new ThankYouScreenController();

// Definir el mapa de rutas para ThankYouScreen
const thankYouScreenRouteMap: RouteMap = {
  // Ruta base para GET por researchId y CREAR
  '/research/{researchId}/thank-you-screen': {
    'GET': controller.getThankYouScreen.bind(controller),
    'POST': controller.createThankYouScreen.bind(controller),
  },
  // Ruta específica con screenId para ACTUALIZAR y ELIMINAR
  '/research/{researchId}/thank-you-screen/{screenId}': {
    'PUT': controller.updateThankYouScreenById.bind(controller),
    'DELETE': controller.deleteThankYouScreenById.bind(controller),
  },
  // Ruta pública (sin cambios)
  '/public/research/{researchId}/thank-you-screen': {
     'GET': controller.getThankYouScreen.bind(controller)
  }
};

/**
 * Manejador principal para las rutas de ThankYouScreen
 */
export const mainHandler = createController(thankYouScreenRouteMap, {
  basePath: '', // No base path, rutas definidas en el mapa
  publicRoutes: [
    // ... existing code ...
  ]
});

export default mainHandler; 
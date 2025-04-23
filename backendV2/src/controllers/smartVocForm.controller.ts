import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SmartVOCFormService } from '../services/smartVocForm.service';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
import { 
  validateUserId, 
  extractResearchId,
  validateSmartVOCData,
  parseAndValidateBody,
  ERROR_MESSAGES
} from '../utils/validation';
import { errorResponse, createResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

// Cache simple para resultados frecuentes
interface CacheEntry {
  data: any;
  timestamp: number;
  researchId: string;
}

/**
 * Controlador para manejar operaciones relacionadas con formularios SmartVOC
 */
export class SmartVOCFormController {
  private service: SmartVOCFormService;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minuto en milisegundos

  constructor() {
    this.service = new SmartVOCFormService();
  }

  /**
   * Log estructurado con nivel, contexto y mensaje
   */
  private log(level: 'info' | 'error' | 'warn' | 'debug', context: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: `SmartVOCFormController.${context}`,
      message,
      ...(data && { data })
    };
    
    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Maneja errores en las operaciones del controlador
   */
  private handleError(error: any, context: string): APIGatewayProxyResult {
    this.log('error', context, 'Error al procesar la solicitud', { error });
    
    // Verificar si es un error de DynamoDB relacionado con recursos no encontrados
    if (error.name === 'ResourceNotFoundException') {
      return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('El formulario SmartVOC'), 404);
    }
    
    // Verificar si es un error de validación de datos
    if (error.name === 'ValidationError') {
      return errorResponse('Error de validación: ' + error.message, 400);
    }
    
    // Verificar si es un error de acceso denegado
    if (error.name === 'AccessDeniedException') {
      return errorResponse(ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }
    
    // Error genérico
    return errorResponse(`Error al ${context}: ${error.message || 'error desconocido'}`, 500);
  }

  /**
   * Obtiene un formulario SmartVOC según el ID de investigación
   */
  public async getSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const result = validateUserId(userId);
      if (result) return result;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar si tenemos una versión en caché válida
      const cacheKey = `smartVOC_${researchId}_${userId}`;
      const cachedEntry = this.cache.get(cacheKey);
      
      if (cachedEntry && 
          (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL && 
          cachedEntry.researchId === researchId) {
        this.log('info', 'getSmartVOCForm', 'Datos recuperados de caché', { researchId });
        return successResponse(cachedEntry.data);
      }

      // Si no hay caché o está expirado, obtener datos frescos
      this.log('info', 'getSmartVOCForm', 'Obteniendo datos para investigación', { researchId });
      const form = await this.service.getByResearchId(researchId);
      
      // Guardar en caché
      if (form) {
        this.cache.set(cacheKey, {
          data: form,
          timestamp: Date.now(),
          researchId
        });
      }
      
      return successResponse(form || { message: 'No se encontró un formulario SmartVOC para esta investigación' });
    } catch (error) {
      return this.handleError(error, 'obtener formulario SmartVOC');
    }
  }

  /**
   * Crea un formulario SmartVOC
   */
  public async createSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Parsear y validar cuerpo
      const bodyResult = parseAndValidateBody<SmartVOCFormData>(event, validateSmartVOCData);
      if ('statusCode' in bodyResult) return bodyResult;
      const { data } = bodyResult;
      
      // Asegurar que el researchId esté en el objeto de datos
      data.researchId = researchId;

      this.log('info', 'createSmartVOCForm', 'Creando formulario SmartVOC', { researchId });
      const result = await this.service.create(data);
      
      // Invalidar caché al crear
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'crear formulario SmartVOC');
    }
  }

  /**
   * Actualiza un formulario SmartVOC
   */
  public async updateSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Parsear y validar cuerpo
      const bodyResult = parseAndValidateBody<SmartVOCFormData>(event, validateSmartVOCData);
      if ('statusCode' in bodyResult) return bodyResult;
      const { data } = bodyResult;
      
      // Asegurar que el researchId esté en el objeto de datos
      data.researchId = researchId;

      this.log('info', 'updateSmartVOCForm', 'Actualizando formulario SmartVOC', { researchId });
      const result = await this.service.update(data);
      
      // Invalidar caché al actualizar
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'actualizar formulario SmartVOC');
    }
  }

  /**
   * Elimina un formulario SmartVOC
   */
  public async deleteSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;

      this.log('info', 'deleteSmartVOCForm', 'Eliminando formulario SmartVOC', { researchId });
      await this.service.delete(researchId);
      
      // Invalidar caché al eliminar
      this.invalidateCache(researchId, userId);
      
      return successResponse({ message: 'Formulario SmartVOC eliminado con éxito' });
    } catch (error) {
      return this.handleError(error, 'eliminar formulario SmartVOC');
    }
  }

  /**
   * Invalida la entrada de caché para un researchId específico
   */
  private invalidateCache(researchId: string, userId: string): void {
    const cacheKey = `smartVOC_${researchId}_${userId}`;
    this.cache.delete(cacheKey);
    this.log('debug', 'invalidateCache', 'Caché invalidado', { researchId });
  }

  /**
   * Mapa de rutas para el controlador SmartVOC
   */
  public routes(): Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> {
    return {
      'GET /research/{researchId}/smart-voc': this.getSmartVOCForm.bind(this),
      'POST /research/{researchId}/smart-voc': this.createSmartVOCForm.bind(this),
      'PUT /research/{researchId}/smart-voc': this.updateSmartVOCForm.bind(this),
      'DELETE /research/{researchId}/smart-voc': this.deleteSmartVOCForm.bind(this)
    };
  }
}

const controller = new SmartVOCFormController();

const smartVocRouteMap: RouteMap = {
  '/research/{researchId}/smart-voc': {
    'GET': controller.getSmartVOCForm.bind(controller),
    'POST': controller.createSmartVOCForm.bind(controller),
    'PUT': controller.updateSmartVOCForm.bind(controller),
    'DELETE': controller.deleteSmartVOCForm.bind(controller)
  }
};

export const smartVocFormHandler = createController(smartVocRouteMap, {
  basePath: '',  // Sin base path para permitir múltiples patrones de ruta
  // No hay rutas públicas, todas requieren autenticación
}); 
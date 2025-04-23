import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EyeTrackingService, EyeTrackingError } from '../services/eyeTracking.service';
import { EyeTrackingFormData } from '../models/eyeTracking.model';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { validateUserId, extractResearchId, ERROR_MESSAGES } from '../utils/validation';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

/**
 * Controlador para manejar operaciones relacionadas con eye tracking
 */
export class EyeTrackingController {
  private service: EyeTrackingService;
  private cache: Map<string, { data: any; timestamp: number; researchId: string }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minuto en milisegundos

  constructor() {
    this.service = new EyeTrackingService();
  }

  /**
   * Log estructurado con nivel, contexto y mensaje
   */
  private log(level: 'info' | 'error' | 'warn' | 'debug', context: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: `EyeTrackingController.${context}`,
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
    
    // Manejo de errores específicos de eye tracking
    if (error.message?.includes(EyeTrackingError.NOT_FOUND)) {
      return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de eye tracking'), 404);
    }

    if (error.message?.includes(EyeTrackingError.INVALID_DATA)) {
      return errorResponse('Error de validación: ' + error.message, 400);
    }

    if (error.message?.includes(EyeTrackingError.RESEARCH_REQUIRED)) {
      return errorResponse('Se requiere ID de investigación', 400);
    }

    if (error.message?.includes(EyeTrackingError.PERMISSION_DENIED)) {
      return errorResponse(ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }

    if (error.message?.includes(EyeTrackingError.DATABASE_ERROR)) {
      return errorResponse('Error de base de datos', 500);
    }
    
    // Error genérico
    return errorResponse(`Error al ${context}: ${error.message || 'error desconocido'}`, 500);
  }

  /**
   * Obtiene una configuración de eye tracking según el ID de investigación
   */
  public async getEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const result = validateUserId(userId);
      if (result) return result;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar si tenemos una versión en caché válida
      const cacheKey = `eyeTracking_${researchId}_${userId}`;
      const cachedEntry = this.cache.get(cacheKey);
      
      if (cachedEntry && 
          (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL && 
          cachedEntry.researchId === researchId) {
        this.log('info', 'getEyeTracking', 'Datos recuperados de caché', { researchId });
        return successResponse(cachedEntry.data);
      }

      // Si no hay caché o está expirado, obtener datos frescos
      this.log('info', 'getEyeTracking', 'Obteniendo datos para investigación', { researchId });
      const eyeTracking = await this.service.getByResearchId(researchId);
      
      // Guardar en caché
      if (eyeTracking) {
        this.cache.set(cacheKey, {
          data: eyeTracking,
          timestamp: Date.now(),
          researchId
        });
      }
      
      return successResponse(eyeTracking || { message: 'No se encontró una configuración de eye tracking para esta investigación' });
    } catch (error) {
      return this.handleError(error, 'obtener configuración de eye tracking');
    }
  }

  /**
   * Crea una configuración de eye tracking
   */
  public async createEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        this.log('error', 'createEyeTracking', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la configuración de eye tracking', 400);
      }
      
      // Parsear el cuerpo de la petición
      let configData: EyeTrackingFormData;
      try {
        configData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'createEyeTracking', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }
      
      // Asegurar que el researchId esté en el objeto de datos
      configData.researchId = researchId;

      this.log('info', 'createEyeTracking', 'Creando configuración de eye tracking', { researchId });
      const result = await this.service.create(configData, researchId, userId);
      
      // Invalidar caché al crear
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'crear configuración de eye tracking');
    }
  }

  /**
   * Actualiza una configuración de eye tracking
   */
  public async updateEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        this.log('error', 'updateEyeTracking', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para actualizar la configuración de eye tracking', 400);
      }
      
      // Parsear el cuerpo de la petición
      let configData: EyeTrackingFormData;
      try {
        configData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'updateEyeTracking', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }
      
      // Asegurar que el researchId esté en el objeto de datos
      configData.researchId = researchId;

      this.log('info', 'updateEyeTracking', 'Actualizando configuración de eye tracking', { researchId });
      const result = await this.service.updateByResearchId(researchId, configData, userId);
      
      // Invalidar caché al actualizar
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'actualizar configuración de eye tracking');
    }
  }

  /**
   * Elimina una configuración de eye tracking
   */
  public async deleteEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;

      this.log('info', 'deleteEyeTracking', 'Eliminando configuración de eye tracking', { researchId });
      
      // Obtener la configuración existente para conseguir su ID
      const existingConfig = await this.service.getByResearchId(researchId);
      if (!existingConfig || !existingConfig.id) {
        return errorResponse('No existe una configuración de eye tracking para eliminar', 404);
      }
      
      await this.service.delete(existingConfig.id, userId);
      
      // Invalidar caché al eliminar
      this.invalidateCache(researchId, userId);
      
      return successResponse({ message: 'Configuración de eye tracking eliminada con éxito' });
    } catch (error) {
      return this.handleError(error, 'eliminar configuración de eye tracking');
    }
  }

  /**
   * Invalida la entrada de caché para un researchId específico
   */
  private invalidateCache(researchId: string, userId: string): void {
    const cacheKey = `eyeTracking_${researchId}_${userId}`;
    this.cache.delete(cacheKey);
    this.log('debug', 'invalidateCache', 'Caché invalidado', { researchId });
  }

  /**
   * Mapa de rutas para el controlador de eye tracking
   */
  public routes(): Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> {
    return {
      // Ruta jerárquica para operaciones con eye tracking relacionadas con una investigación específica
      'GET /research/{researchId}/eye-tracking': this.getEyeTracking.bind(this),
      'POST /research/{researchId}/eye-tracking': this.createEyeTracking.bind(this),
      'PUT /research/{researchId}/eye-tracking': this.updateEyeTracking.bind(this),
      'DELETE /research/{researchId}/eye-tracking': this.deleteEyeTracking.bind(this)
    };
  }
}

// Instanciar el controlador
const controller = new EyeTrackingController();

// Definir el mapa de rutas para eye tracking
const eyeTrackingRouteMap: RouteMap = {
  // Ruta jerárquica para eye tracking asociado a investigación
  '/research/{researchId}/eye-tracking': {
    'GET': controller.getEyeTracking.bind(controller),
    'POST': controller.createEyeTracking.bind(controller),
    'PUT': controller.updateEyeTracking.bind(controller),
    'DELETE': controller.deleteEyeTracking.bind(controller)
  }
};

/**
 * Manejador principal para las rutas de eye tracking
 * 
 * Utiliza el decorador de controlador para manejar la autenticación y CORS automáticamente.
 * 
 * Estructura jerárquica:
 * - GET /research/{researchId}/eye-tracking : Obtiene la configuración de eye tracking de la investigación
 * - POST /research/{researchId}/eye-tracking : Crea una nueva configuración de eye tracking para la investigación
 * - PUT /research/{researchId}/eye-tracking : Actualiza la configuración de eye tracking de la investigación
 * - DELETE /research/{researchId}/eye-tracking : Elimina la configuración de eye tracking de la investigación
 */
export const eyeTrackingHandler = createController(eyeTrackingRouteMap, {
  basePath: ''  // Sin base path para permitir múltiples patrones de ruta
});

export default eyeTrackingHandler; 
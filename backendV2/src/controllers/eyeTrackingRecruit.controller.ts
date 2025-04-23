import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eyeTrackingRecruitService } from '../services/eyeTrackingRecruit.service';
import { 
  CreateEyeTrackingRecruitRequest 
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { validateUserId, extractResearchId, ERROR_MESSAGES } from '../utils/validation';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

/**
 * Controlador para manejar operaciones relacionadas con reclutamiento para eye tracking
 */
export class EyeTrackingRecruitController {
  private service = eyeTrackingRecruitService;
  private cache: Map<string, { data: any; timestamp: number; researchId: string }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minuto en milisegundos

  constructor() {}

  /**
   * Log estructurado con nivel, contexto y mensaje
   */
  private log(level: 'info' | 'error' | 'warn' | 'debug', context: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: `EyeTrackingRecruitController.${context}`,
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
    
    if (error.statusCode === 404) {
      return errorResponse(error.message || ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de reclutamiento'), 404);
    }
    
    if (error.statusCode === 400) {
      return errorResponse(error.message || 'Error de validación en la solicitud', 400);
    }
    
    if (error.statusCode === 403) {
      return errorResponse(error.message || ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }
    
    // Error genérico
    return errorResponse(`Error al ${context}: ${error.message || 'error desconocido'}`, 500);
  }

  /**
   * Obtiene la configuración de reclutamiento según el ID de investigación
   */
  public async getEyeTrackingRecruit(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      const result = validateUserId(userId);
      if (result) return result;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar si tenemos una versión en caché válida
      const cacheKey = `eyeTrackingRecruit_${researchId}_${userId}`;
      const cachedEntry = this.cache.get(cacheKey);
      
      if (cachedEntry && 
          (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL && 
          cachedEntry.researchId === researchId) {
        this.log('info', 'getEyeTrackingRecruit', 'Datos recuperados de caché', { researchId });
        return successResponse(cachedEntry.data);
      }

      // Si no hay caché o está expirado, obtener datos frescos
      this.log('info', 'getEyeTrackingRecruit', 'Obteniendo datos para investigación', { researchId });
      const config = await this.service.getConfigByResearchId(researchId);
      
      if (!config) {
        return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La configuración de reclutamiento'), 404);
      }
      
      // Obtener información adicional: estadísticas y enlaces activos
      const configId = config.id as string;
      const stats = await this.service.getStatsByConfigId(configId);
      const links = await this.service.getActiveLinks(configId);
      const participants = await this.service.getParticipantsByConfigId(configId);
      
      const fullData = {
        config,
        stats,
        links,
        participants
      };
      
      // Guardar en caché
      this.cache.set(cacheKey, {
        data: fullData,
        timestamp: Date.now(),
        researchId
      });
      
      return successResponse(fullData);
    } catch (error) {
      return this.handleError(error, 'obtener configuración de reclutamiento');
    }
  }

  /**
   * Crea una configuración de reclutamiento
   */
  public async createEyeTrackingRecruit(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
        this.log('error', 'createEyeTrackingRecruit', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la configuración de reclutamiento', 400);
      }
      
      // Parsear el cuerpo de la petición
      let configData: CreateEyeTrackingRecruitRequest;
      try {
        configData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'createEyeTrackingRecruit', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }

      this.log('info', 'createEyeTrackingRecruit', 'Creando configuración de reclutamiento', { researchId });
      const result = await this.service.createConfig(researchId, configData);
      
      // Invalidar caché al crear
      this.invalidateCache(researchId, userId);
      
      return successResponse({ config: result });
    } catch (error) {
      return this.handleError(error, 'crear configuración de reclutamiento');
    }
  }

  /**
   * Actualiza una configuración de reclutamiento
   */
  public async updateEyeTrackingRecruit(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
        this.log('error', 'updateEyeTrackingRecruit', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para actualizar la configuración de reclutamiento', 400);
      }
      
      // Parsear el cuerpo de la petición
      let updateData: any;
      try {
        updateData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'updateEyeTrackingRecruit', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }
      
      // Obtener la configuración existente para el researchId
      const existingConfig = await this.service.getConfigByResearchId(researchId);
      if (!existingConfig) {
        return errorResponse('No existe una configuración de reclutamiento para actualizar', 404);
      }

      // Asegurarnos que existingConfig.id es una string
      const configId = existingConfig.id as string;
      this.log('info', 'updateEyeTrackingRecruit', 'Actualizando configuración de reclutamiento', { researchId });
      const result = await this.service.updateConfig(configId, updateData);
      
      // Invalidar caché al actualizar
      this.invalidateCache(researchId, userId);
      
      return successResponse({ config: result });
    } catch (error) {
      return this.handleError(error, 'actualizar configuración de reclutamiento');
    }
  }

  /**
   * Elimina una configuración de reclutamiento
   */
  public async deleteEyeTrackingRecruit(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;

      this.log('info', 'deleteEyeTrackingRecruit', 'Eliminando configuración de reclutamiento', { researchId });
      
      // Obtener la configuración existente para conseguir su ID
      const existingConfig = await this.service.getConfigByResearchId(researchId);
      if (!existingConfig) {
        return errorResponse('No existe una configuración de reclutamiento para eliminar', 404);
      }
      
      // Asegurarnos que existingConfig.id es una string
      const configId = existingConfig.id as string;
      await this.service.deleteConfig(configId);
      
      // Invalidar caché al eliminar
      this.invalidateCache(researchId, userId);
      
      return successResponse({ message: 'Configuración de reclutamiento eliminada con éxito' });
    } catch (error) {
      return this.handleError(error, 'eliminar configuración de reclutamiento');
    }
  }

  /**
   * Invalida la entrada de caché para un researchId específico
   */
  private invalidateCache(researchId: string, userId: string): void {
    const cacheKey = `eyeTrackingRecruit_${researchId}_${userId}`;
    this.cache.delete(cacheKey);
    this.log('debug', 'invalidateCache', 'Caché invalidado', { researchId });
  }

  /**
   * Mapa de rutas para el controlador
   */
  public routes(): Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> {
    return {
      // Ruta jerárquica para operaciones con reclutamiento relacionadas con una investigación específica
      'GET /research/{researchId}/eye-tracking-recruit': this.getEyeTrackingRecruit.bind(this),
      'POST /research/{researchId}/eye-tracking-recruit': this.createEyeTrackingRecruit.bind(this),
      'PUT /research/{researchId}/eye-tracking-recruit': this.updateEyeTrackingRecruit.bind(this),
      'DELETE /research/{researchId}/eye-tracking-recruit': this.deleteEyeTrackingRecruit.bind(this)
    };
  }
}

// Instanciar el controlador
const controller = new EyeTrackingRecruitController();

// Definir el mapa de rutas para eye tracking recruit
const eyeTrackingRecruitRouteMap: RouteMap = {
  // Ruta jerárquica para eye tracking recruit asociado a investigación
  '/research/{researchId}/eye-tracking-recruit': {
    'GET': controller.getEyeTrackingRecruit.bind(controller),
    'POST': controller.createEyeTrackingRecruit.bind(controller),
    'PUT': controller.updateEyeTrackingRecruit.bind(controller),
    'DELETE': controller.deleteEyeTrackingRecruit.bind(controller)
  }
};

export const eyeTrackingRecruitHandler = createController(eyeTrackingRecruitRouteMap, {
  basePath: ''  // Sin base path para permitir múltiples patrones de ruta
});

export default eyeTrackingRecruitHandler; 
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { thankYouScreenService, ThankYouScreenError } from '../services/thankYouScreen.service';
import { ThankYouScreenFormData } from '../../../shared/interfaces/thank-you-screen.interface';
import { 
  createResponse, 
  errorResponse
} from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { validateUserId, extractResearchId, ERROR_MESSAGES } from '../utils/validation';

// Función auxiliar para crear respuestas exitosas
const successResponse = (body: any): APIGatewayProxyResult => createResponse(200, body);

/**
 * Controlador para manejar operaciones relacionadas con pantallas de agradecimiento
 */
export class ThankYouScreenController {
  private service = thankYouScreenService;
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
      context: `ThankYouScreenController.${context}`,
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
    
    // Mapear errores conocidos del servicio a códigos HTTP
    if (error.message?.includes(ThankYouScreenError.NOT_FOUND)) {
      return errorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND('La pantalla de agradecimiento'), 404);
    }

    if (error.message?.includes(ThankYouScreenError.INVALID_DATA) ||
        error.message?.includes(ThankYouScreenError.RESEARCH_REQUIRED)) {
      return errorResponse('Error de validación: ' + error.message, 400);
    }

    if (error.message?.includes(ThankYouScreenError.PERMISSION_DENIED)) {
      return errorResponse(ERROR_MESSAGES.AUTH.FORBIDDEN, 403);
    }
    
    // Error genérico
    return errorResponse(`Error al ${context}: ${error.message || 'error desconocido'}`, 500);
  }

  /**
   * Obtiene una pantalla de agradecimiento según el ID de investigación
   */
  public async getThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar si es una solicitud pública
      const isPublic = event.path.includes('/public/');
      
      // Para solicitudes no públicas, validar autenticación
      if (!isPublic) {
        const userId = event.requestContext.authorizer?.claims?.sub;
        const result = validateUserId(userId);
        if (result) return result;
      }

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;
      
      // Verificar si tenemos una versión en caché válida (solo para solicitudes autenticadas)
      let cacheKey;
      let cachedEntry;
      
      if (!isPublic) {
        const userId = event.requestContext.authorizer?.claims?.sub;
        cacheKey = `thankYouScreen_${researchId}_${userId}`;
        cachedEntry = this.cache.get(cacheKey);
        
        if (cachedEntry && 
            (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL && 
            cachedEntry.researchId === researchId) {
          this.log('info', 'getThankYouScreen', 'Datos recuperados de caché', { researchId });
          return successResponse(cachedEntry.data);
        }
      }

      // Si no hay caché o está expirado, obtener datos frescos
      this.log('info', 'getThankYouScreen', 'Obteniendo datos para investigación', { researchId, isPublic });
      const screen = await this.service.getByResearchId(researchId);
      
      // Si es una solicitud pública, verificar si está habilitada y filtrar campos
      if (isPublic) {
        if (!screen || !screen.isEnabled) {
          return successResponse({ 
            data: null,
            message: 'La pantalla de agradecimiento no está disponible'
          });
        }
        
        // Filtrar solo los campos necesarios para el participante
        const participantView = {
          title: screen.title,
          message: screen.message,
          redirectUrl: screen.redirectUrl,
          isEnabled: screen.isEnabled
        };
        
        return successResponse({ data: participantView });
      }
      
      // Para solicitudes autenticadas, guardar en caché
      if (!isPublic && screen && cacheKey) {
        this.cache.set(cacheKey, {
          data: screen,
          timestamp: Date.now(),
          researchId
        });
      }
      
      return successResponse(screen || { message: 'No se encontró una pantalla de agradecimiento para esta investigación' });
    } catch (error) {
      return this.handleError(error, 'obtener pantalla de agradecimiento');
    }
  }

  /**
   * Crea una pantalla de agradecimiento
   */
  public async createThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
        this.log('error', 'createThankYouScreen', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear la pantalla de agradecimiento', 400);
      }
      
      // Parsear el cuerpo de la petición
      let screenData: ThankYouScreenFormData;
      try {
        screenData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'createThankYouScreen', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }

      this.log('info', 'createThankYouScreen', 'Creando pantalla de agradecimiento', { researchId });
      const result = await this.service.create(screenData, researchId, userId);
      
      // Invalidar caché al crear
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'crear pantalla de agradecimiento');
    }
  }

  /**
   * Actualiza una pantalla de agradecimiento
   */
  public async updateThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
        this.log('error', 'updateThankYouScreen', 'No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para actualizar la pantalla de agradecimiento', 400);
      }
      
      // Parsear el cuerpo de la petición
      let screenData: ThankYouScreenFormData;
      try {
        screenData = JSON.parse(event.body);
      } catch (e) {
        this.log('error', 'updateThankYouScreen', 'Error al parsear JSON', { error: e });
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }

      this.log('info', 'updateThankYouScreen', 'Actualizando pantalla de agradecimiento', { researchId });
      const result = await this.service.updateByResearchId(researchId, screenData, userId);
      
      // Invalidar caché al actualizar
      this.invalidateCache(researchId, userId);
      
      return successResponse(result);
    } catch (error) {
      return this.handleError(error, 'actualizar pantalla de agradecimiento');
    }
  }

  /**
   * Elimina una pantalla de agradecimiento
   */
  public async deleteThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = event.requestContext.authorizer?.claims?.sub;
      
      // Validar múltiples condiciones juntas
      const validationError = validateUserId(userId);
      if (validationError) return validationError;

      // Extraer y validar el researchId
      const idResult = extractResearchId(event);
      if ('statusCode' in idResult) return idResult;
      const { researchId } = idResult;

      this.log('info', 'deleteThankYouScreen', 'Eliminando pantalla de agradecimiento', { researchId });
      
      // Obtener la pantalla existente para conseguir su ID
      const existingScreen = await this.service.getByResearchId(researchId);
      if (!existingScreen || !existingScreen.id) {
        return errorResponse('No existe una pantalla de agradecimiento para eliminar', 404);
      }
      
      await this.service.delete(existingScreen.id, userId);
      
      // Invalidar caché al eliminar
      this.invalidateCache(researchId, userId);
      
      return successResponse({ message: 'Pantalla de agradecimiento eliminada correctamente' });
    } catch (error) {
      return this.handleError(error, 'eliminar pantalla de agradecimiento');
    }
  }

  /**
   * Invalida la caché para una investigación específica
   */
  private invalidateCache(researchId: string, userId: string): void {
    const cacheKey = `thankYouScreen_${researchId}_${userId}`;
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.log('info', 'invalidateCache', 'Caché invalidada', { researchId });
    }
  }

  /**
   * Mapa de rutas para el controlador de pantallas de agradecimiento
   */
  public routes(): Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> {
    return {
      // Ruta jerárquica para operaciones con pantallas de agradecimiento relacionadas con una investigación específica
      'GET /research/{researchId}/thank-you-screen': this.getThankYouScreen.bind(this),
      'POST /research/{researchId}/thank-you-screen': this.createThankYouScreen.bind(this),
      'PUT /research/{researchId}/thank-you-screen': this.updateThankYouScreen.bind(this),
      'DELETE /research/{researchId}/thank-you-screen': this.deleteThankYouScreen.bind(this),
    };
  }
}

// Instanciar el controlador
const controller = new ThankYouScreenController();

// Definir el mapa de rutas para ThankYouScreen
const thankYouScreenRouteMap: RouteMap = {
  // Ruta jerárquica principal (autenticada)
  '/research/{researchId}/thank-you-screen': {
    'GET': controller.getThankYouScreen.bind(controller),
    'POST': controller.createThankYouScreen.bind(controller),
    'PUT': controller.updateThankYouScreen.bind(controller),
    'DELETE': controller.deleteThankYouScreen.bind(controller)
  },
  // Ruta pública (si aplica, podría necesitar un handler específico o bandera)
  '/public/research/{researchId}/thank-you-screen': {
     'GET': controller.getThankYouScreen.bind(controller) // Reutiliza el método que ya maneja 'isPublic'
  }
};

/**
 * Manejador principal para las rutas de ThankYouScreen
 */
export const thankYouScreenHandler = createController(thankYouScreenRouteMap, { basePath: '' });

export default thankYouScreenHandler; 
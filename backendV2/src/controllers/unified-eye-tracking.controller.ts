import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eyedidSDKService } from '../eye-tracking/eyedid-sdk.service';
import { ogamaIntegrationService } from '../eye-tracking/ogama-integration.service';
import { getCorsHeaders } from '../utils/cors';
import { z } from 'zod';
import type { 
  StartEyeTrackingParams, 
  StopEyeTrackingParams
} from '../../../shared/eye-tracking-types';

/**
 * Controlador Unificado para Eye Tracking
 * Combina Eyedid SDK (mobile) + Ogama (análisis avanzado)
 * Arquitectura híbrida optimizada
 */
class UnifiedEyeTrackingController {
  private readonly controllerName = 'UnifiedEyeTrackingController';

  constructor() {
    console.log(`[${this.controllerName}] Inicializando controlador unificado de Eye Tracking`);
  }

  /**
   * Inicia una sesión de eye tracking híbrida
   * POST /eye-tracking/start
   */
  async startEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'startEyeTracking';
    console.log(`[${this.controllerName}.${context}] Iniciando sesión híbrida de eye tracking`);

    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'Cuerpo de la petición requerido'
          })
        };
      }

      const requestBody = JSON.parse(event.body);
      
      const startEyeTrackingSchema = z.object({
        participantId: z.string().min(1).max(100),
        testId: z.string().uuid().optional(),
        config: z.object({
          deviceId: z.string().optional(),
          sampleRate: z.number().min(30).max(120).default(60),
          enableCalibration: z.boolean().default(true),
          calibrationPoints: z.number().min(3).max(16).default(9),
          trackingMode: z.enum(['screen', 'world']).default('screen'),
          smoothing: z.boolean().default(true),
          smoothingFactor: z.number().min(0).max(1).default(0.7),
          platform: z.enum(['ios', 'android', 'web', 'unity', 'windows']).default('web'),
          sdkVersion: z.string().default('1.0.0'),
          apiKey: z.string().optional(),
          enableRemoteTesting: z.boolean().default(true),
          enableHeatmaps: z.boolean().default(true),
          enableRealTimeInsights: z.boolean().default(true)
        }),
        areasOfInterest: z.array(z.object({
          id: z.string().uuid(),
          name: z.string().min(1).max(100),
          x: z.number().min(0),
          y: z.number().min(0),
          width: z.number().positive(),
          height: z.number().positive(),
          type: z.enum(['rectangle', 'circle', 'polygon']),
          points: z.array(z.object({
            x: z.number(),
            y: z.number()
          })).optional()
        })).optional(),
        useOgama: z.boolean().default(true)
      });

      const validatedRequest = startEyeTrackingSchema.parse(requestBody);

      const params: StartEyeTrackingParams = {
        participantId: validatedRequest.participantId,
        testId: validatedRequest.testId,
        config: validatedRequest.config,
        areasOfInterest: validatedRequest.areasOfInterest
      };

      // Iniciar con Eyedid SDK
      const result = await eyedidSDKService.startEyeTracking(params);

      // Si se solicita, iniciar análisis con Ogama
      if (validatedRequest.useOgama && result.success) {
        setTimeout(async () => {
          try {
            await ogamaIntegrationService.startOgamaAnalysis(
              result.data.sessionId, 
              validatedRequest.config.platform === 'web' ? 'theeyetribe' : 'eyedid'
            );
          } catch (error) {
            console.warn('[UnifiedEyeTrackingController] Error iniciando análisis Ogama:', error);
          }
        }, 2000);
      }

      return {
        statusCode: result.success ? 200 : 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify(result)
      };

    } catch (error: unknown) {
      console.error(`[${this.controllerName}.${context}] Error:`, error);
      
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'Datos de entrada inválidos',
            details: error.errors
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: `Error interno: ${error instanceof Error ? error.message : String(error)}`
        })
      };
    }
  }

  /**
   * Detiene una sesión de eye tracking híbrida
   * POST /eye-tracking/stop
   */
  async stopEyeTracking(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'stopEyeTracking';
    console.log(`[${this.controllerName}.${context}] Deteniendo sesión híbrida de eye tracking`);

    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'Cuerpo de la petición requerido'
          })
        };
      }

      const requestBody = JSON.parse(event.body);
      
      const stopEyeTrackingSchema = z.object({
        sessionId: z.string().uuid(),
        saveData: z.boolean().default(true),
        generateAnalysis: z.boolean().default(false),
        generateOgamaAnalysis: z.boolean().default(false)
      });

      const validatedRequest = stopEyeTrackingSchema.parse(requestBody);

      const params: StopEyeTrackingParams = {
        sessionId: validatedRequest.sessionId,
        saveData: validatedRequest.saveData,
        generateAnalysis: validatedRequest.generateAnalysis
      };

      // Detener con Eyedid SDK
      const result = await eyedidSDKService.stopEyeTracking(params);

      // Si se solicita, generar análisis con Ogama
      if (validatedRequest.generateOgamaAnalysis && result.success) {
        try {
          const ogamaResult = await ogamaIntegrationService.startOgamaAnalysis(
            validatedRequest.sessionId,
            'eyedid' // Detectar tipo de dispositivo
          );
          
          if (ogamaResult.success) {
            result.data = {
              ...result.data,
              ogamaAnalysis: ogamaResult.data
            };
          }
        } catch (error) {
          console.warn('[UnifiedEyeTrackingController] Error en análisis Ogama:', error);
        }
      }

      return {
        statusCode: result.success ? 200 : 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify(result)
      };

    } catch (error: unknown) {
      console.error(`[${this.controllerName}.${context}] Error:`, error);
      
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'Datos de entrada inválidos',
            details: error.errors
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: `Error interno: ${error instanceof Error ? error.message : String(error)}`
        })
      };
    }
  }

  /**
   * Genera saliency maps con Ogama
   * POST /eye-tracking/saliency
   */
  async generateSaliencyMaps(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'generateSaliencyMaps';
    console.log(`[${this.controllerName}.${context}] Generando saliency maps`);

    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'Cuerpo de la petición requerido'
          })
        };
      }

      const requestBody = JSON.parse(event.body);
      
      const saliencySchema = z.object({
        sessionId: z.string().uuid(),
        stimulusImage: z.string().url().optional(),
        algorithm: z.enum(['itti-koch', 'gbvs', 'aim', 'sun']).default('itti-koch')
      });

      const validatedRequest = saliencySchema.parse(requestBody);

      const result = await ogamaIntegrationService.generateSaliencyMaps(
        validatedRequest.sessionId,
        validatedRequest.stimulusImage
      );

      return {
        statusCode: result.success ? 200 : 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify(result)
      };

    } catch (error: unknown) {
      console.error(`[${this.controllerName}.${context}] Error:`, error);
      
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'Datos de entrada inválidos',
            details: error.errors
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: `Error interno: ${error instanceof Error ? error.message : String(error)}`
        })
      };
    }
  }

  /**
   * Obtiene estadísticas híbridas
   * GET /eye-tracking/stats
   */
  async getHybridStats(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getHybridStats';
    console.log(`[${this.controllerName}.${context}] Obteniendo estadísticas híbridas`);

    try {
      // Obtener estadísticas de Eyedid SDK
      const eyedidStats = eyedidSDKService.getActiveSessionsStats();
      
      // Obtener estado de Ogama
      const ogamaStatus = await ogamaIntegrationService.checkOgamaStatus();
      
      // Obtener dispositivos soportados
      const supportedDevices = ogamaIntegrationService.getSupportedDevices();

      const hybridStats = {
        eyedid: eyedidStats.data,
        ogama: ogamaStatus.data,
        supportedDevices: supportedDevices.data,
        timestamp: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: hybridStats,
          timestamp: new Date().toISOString()
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.controllerName}.${context}] Error:`, error);

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: `Error interno: ${error instanceof Error ? error.message : String(error)}`
        })
      };
    }
  }

  /**
   * Maneja peticiones OPTIONS para CORS
   */
  async handleOptions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: ''
    };
  }
}

// Exportar funciones para Lambda
export const startEyeTracking = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new UnifiedEyeTrackingController();
  return controller.startEyeTracking(event);
};

export const stopEyeTracking = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new UnifiedEyeTrackingController();
  return controller.stopEyeTracking(event);
};

export const generateSaliencyMaps = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new UnifiedEyeTrackingController();
  return controller.generateSaliencyMaps(event);
};

export const getHybridStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new UnifiedEyeTrackingController();
  return controller.getHybridStats(event);
};

export const handleOptions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new UnifiedEyeTrackingController();
  return controller.handleOptions(event);
};

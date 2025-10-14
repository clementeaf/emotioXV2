import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ogamaIntegrationService } from '../eye-tracking/ogama-integration.service';
import { getCorsHeaders } from '../utils/cors';
import { z } from 'zod';

/**
 * Controlador para integración con Ogama
 * Maneja análisis avanzado, saliency maps y compatibilidad multi-dispositivo
 * Open source y gratuito para análisis de eye tracking
 */
class OgamaIntegrationController {
  private readonly controllerName = 'OgamaIntegrationController';

  constructor() {
    console.log(`[${this.controllerName}] Inicializando controlador de Ogama Integration`);
  }

  /**
   * Inicia análisis con Ogama
   * POST /ogama/analyze
   */
  async startOgamaAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'startOgamaAnalysis';
    console.log(`[${this.controllerName}.${context}] Iniciando análisis con Ogama`);

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
      
      const ogamaAnalysisSchema = z.object({
        sessionId: z.string().uuid(),
        deviceType: z.enum(['theeyetribe', 'tobii', 'smi', 'eyedid', 'custom']).default('theeyetribe')
      });

      const validatedRequest = ogamaAnalysisSchema.parse(requestBody);

      const result = await ogamaIntegrationService.startOgamaAnalysis(
        validatedRequest.sessionId,
        validatedRequest.deviceType
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
   * Genera saliency maps con Ogama
   * POST /ogama/saliency
   */
  async generateSaliencyMaps(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'generateSaliencyMaps';
    console.log(`[${this.controllerName}.${context}] Generando saliency maps con Ogama`);

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
        algorithm: z.enum(['itti-koch', 'gbvs', 'aim', 'sun']).default('itti-koch'),
        parameters: z.object({
          centerBias: z.number().min(0).max(1).default(0.5),
          colorWeight: z.number().min(0).max(1).default(0.3),
          intensityWeight: z.number().min(0).max(1).default(0.3),
          orientationWeight: z.number().min(0).max(1).default(0.4)
        }).optional()
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
   * Analiza datos con múltiples dispositivos
   * POST /ogama/multi-device
   */
  async analyzeMultiDevice(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'analyzeMultiDevice';
    console.log(`[${this.controllerName}.${context}] Analizando múltiples dispositivos con Ogama`);

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
      
      const multiDeviceSchema = z.object({
        sessions: z.array(z.object({
          sessionId: z.string().uuid(),
          deviceType: z.enum(['theeyetribe', 'tobii', 'smi', 'eyedid', 'custom'])
        })).min(2).max(5)
      });

      const validatedRequest = multiDeviceSchema.parse(requestBody);

      const sessionIds = validatedRequest.sessions.map(s => s.sessionId);
      const deviceTypes = validatedRequest.sessions.map(s => s.deviceType);

      const result = await ogamaIntegrationService.analyzeMultiDevice(sessionIds, deviceTypes);

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
   * Obtiene dispositivos soportados por Ogama
   * GET /ogama/devices
   */
  async getSupportedDevices(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getSupportedDevices';
    console.log(`[${this.controllerName}.${context}] Obteniendo dispositivos soportados por Ogama`);

    try {
      const result = ogamaIntegrationService.getSupportedDevices();

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify(result)
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
   * Verifica el estado de Ogama
   * GET /ogama/status
   */
  async checkOgamaStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'checkOgamaStatus';
    console.log(`[${this.controllerName}.${context}] Verificando estado de Ogama`);

    try {
      const result = await ogamaIntegrationService.checkOgamaStatus();

      return {
        statusCode: result.success ? 200 : 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify(result)
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
export const startOgamaAnalysis = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new OgamaIntegrationController();
  return controller.startOgamaAnalysis(event);
};

export const generateSaliencyMaps = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new OgamaIntegrationController();
  return controller.generateSaliencyMaps(event);
};

export const analyzeMultiDevice = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new OgamaIntegrationController();
  return controller.analyzeMultiDevice(event);
};

export const getSupportedDevices = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new OgamaIntegrationController();
  return controller.getSupportedDevices(event);
};

export const checkOgamaStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new OgamaIntegrationController();
  return controller.checkOgamaStatus(event);
};

export const handleOptions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new OgamaIntegrationController();
  return controller.handleOptions(event);
};

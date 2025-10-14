import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pythonIATBridgeService } from '../bridge/python-iat-bridge.service';
import { iatAdvancedAnalysisService } from '../iat/iat-advanced-analysis.service';
import { iatService } from '../services/iat.service';
import { getCorsHeaders } from '../utils/cors';
import { z } from 'zod';

/**
 * Controlador para análisis IAT usando Python Bridge
 * Maneja endpoints que requieren procesamiento estadístico avanzado
 */

// Schema para validación de análisis IAT
const AnalyzeIATRequestSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido'),
  includeRawData: z.boolean().optional().default(false),
  analysisOptions: z.object({
    method: z.enum(['standard', 'improved', 'd600']).optional().default('standard'),
    errorHandling: z.enum(['exclude', 'include', 'replace']).optional().default('exclude'),
    confidenceLevel: z.number().min(0.5).max(0.99).optional().default(0.95)
  }).optional()
});

export class IATAnalysisController {
  private readonly serviceName = 'IATAnalysisController';

  /**
   * Analiza una sesión IAT usando Python bridge
   * POST /iat/analyze
   */
  async analyzeSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'analyzeSession';
    console.log(`[${this.serviceName}.${context}] Iniciando análisis de sesión IAT`);

    try {
      // Validar request body
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para el análisis',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedRequest = AnalyzeIATRequestSchema.parse(body);

      // Obtener sesión desde DynamoDB
      const session = await iatService.getSessionById(validatedRequest.sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Sesión IAT no encontrada',
            status: 404
          })
        };
      }

      // Verificar que la sesión esté completa
      if (session.status !== 'completed') {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'La sesión debe estar completada para realizar el análisis',
            status: 400
          })
        };
      }

      // Ejecutar análisis avanzado usando motor de análisis
      const analysisResult = await iatAdvancedAnalysisService.performAdvancedAnalysis(session);

      console.log(`[${this.serviceName}.${context}] Análisis IAT completado`, {
        sessionId: validatedRequest.sessionId,
        success: analysisResult.success
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: validatedRequest.sessionId,
            analysisResult: analysisResult.analysis,
            report: iatAdvancedAnalysisService.generateAnalysisReport(analysisResult.analysis),
            timestamp: new Date().toISOString()
          },
          message: 'Análisis IAT avanzado completado exitosamente'
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error en análisis IAT:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const statusCode = 500;

      return {
        statusCode,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: errorMessage,
          status: statusCode
        })
      };
    }
  }

  /**
   * Realiza análisis estadístico avanzado de una sesión
   * POST /iat/advanced-analysis
   */
  async performAdvancedAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'performAdvancedAnalysis';
    console.log(`[${this.serviceName}.${context}] Iniciando análisis estadístico avanzado`);

    try {
      // Validar request body
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para el análisis avanzado',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedRequest = AnalyzeIATRequestSchema.parse(body);

      // Obtener sesión desde DynamoDB
      const session = await iatService.getSessionById(validatedRequest.sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Sesión IAT no encontrada',
            status: 404
          })
        };
      }

      // Verificar que la sesión esté completa
      if (session.status !== 'completed') {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'La sesión debe estar completada para realizar el análisis avanzado',
            status: 400
          })
        };
      }

      // Ejecutar análisis estadístico avanzado
      const advancedAnalysis = await iatAdvancedAnalysisService.performAdvancedAnalysis(session);

      if (!advancedAnalysis.success) {
        return {
          statusCode: 500,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Error en análisis estadístico avanzado',
            details: advancedAnalysis.error,
            status: 500
          })
        };
      }

      console.log(`[${this.serviceName}.${context}] Análisis estadístico avanzado completado`, {
        sessionId: validatedRequest.sessionId,
        dScore: advancedAnalysis.analysis?.d_score
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: validatedRequest.sessionId,
            advancedAnalysis: advancedAnalysis.analysis,
            report: iatAdvancedAnalysisService.generateAnalysisReport(advancedAnalysis.analysis),
            timestamp: new Date().toISOString()
          },
          message: 'Análisis estadístico avanzado completado exitosamente'
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error en análisis avanzado:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const statusCode = 500;

      return {
        statusCode,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: errorMessage,
          status: statusCode
        })
      };
    }
  }

  /**
   * Verifica el estado del entorno Python
   * GET /iat/python-status
   */
  async getPythonStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getPythonStatus';
    console.log(`[${this.serviceName}.${context}] Verificando estado de Python`);

    try {
      const isPythonAvailable = await pythonIATBridgeService.verifyPythonEnvironment();

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            pythonAvailable: isPythonAvailable,
            bridgeStatus: isPythonAvailable ? 'ready' : 'unavailable',
            timestamp: new Date().toISOString()
          }
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error verificando Python:`, error);
      
      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            pythonAvailable: false,
            bridgeStatus: 'error',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          }
        })
      };
    }
  }
}

// Exportar funciones para uso en routing
export const analyzeSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATAnalysisController();
  return controller.analyzeSession(event);
};

export const performAdvancedAnalysis = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATAnalysisController();
  return controller.performAdvancedAnalysis(event);
};

export const getPythonStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATAnalysisController();
  return controller.getPythonStatus(event);
};

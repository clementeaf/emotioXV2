import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { iatPerformanceService } from '../iat/iat-performance.service';
import { iatOptimizedService } from '../services/iat-optimized.service';
import { getCorsHeaders } from '../utils/cors';
import { z } from 'zod';

/**
 * Controlador para optimización de rendimiento IAT
 * Maneja endpoints relacionados con análisis de alto rendimiento
 */

// Schema para validación de análisis optimizado
const OptimizedAnalysisRequestSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido'),
  optimizationLevel: z.enum(['low', 'medium', 'high']).optional().default('high'),
  enableCache: z.boolean().optional().default(true),
  parallelProcessing: z.boolean().optional().default(true)
});

export class IATPerformanceController {
  private readonly serviceName = 'IATPerformanceController';

  /**
   * Realiza análisis IAT optimizado
   * POST /iat/optimized-analysis
   */
  async performOptimizedAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'performOptimizedAnalysis';
    console.log(`[${this.serviceName}.${context}] Iniciando análisis IAT optimizado`);

    try {
      // Validar request body
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para el análisis optimizado',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedRequest = OptimizedAnalysisRequestSchema.parse(body);

      // Obtener sesión desde servicio optimizado
      const session = await iatOptimizedService.getSessionById(validatedRequest.sessionId);
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
            error: 'La sesión debe estar completada para realizar el análisis optimizado',
            status: 400
          })
        };
      }

      // Ejecutar análisis optimizado
      const optimizedAnalysis = await iatPerformanceService.performOptimizedAnalysis(session);

      if (!optimizedAnalysis.success) {
        return {
          statusCode: 500,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Error en análisis optimizado',
            details: optimizedAnalysis.error,
            status: 500
          })
        };
      }

      console.log(`[${this.serviceName}.${context}] Análisis optimizado completado`, {
        sessionId: validatedRequest.sessionId,
        processingTime: optimizedAnalysis.performance_metrics?.processing_time,
        optimizationLevel: validatedRequest.optimizationLevel
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: validatedRequest.sessionId,
            analysis: optimizedAnalysis.analysis,
            performanceMetrics: optimizedAnalysis.performance_metrics,
            optimizationApplied: optimizedAnalysis.optimization_applied,
            timestamp: new Date().toISOString()
          },
          message: 'Análisis IAT optimizado completado exitosamente'
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error en análisis optimizado:`, error);
      
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
   * Obtiene estadísticas de rendimiento del sistema
   * GET /iat/performance-stats
   */
  async getPerformanceStats(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getPerformanceStats';
    console.log(`[${this.serviceName}.${context}] Obteniendo estadísticas de rendimiento`);

    try {
      // Obtener estadísticas de servicios
      const performanceStats = iatPerformanceService.getPerformanceStats();
      const cacheStats = iatOptimizedService.getCacheStats();

      // Verificar estado del optimizador
      const optimizerAvailable = await iatPerformanceService.verifyOptimizer();

      const stats = {
        system: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        performance: performanceStats,
        cache: cacheStats,
        optimizer: {
          available: optimizerAvailable,
          status: optimizerAvailable ? 'ready' : 'unavailable'
        },
        optimization: {
          level: 'high',
          parallelProcessing: true,
          caching: true,
          batchOperations: true
        }
      };

      console.log(`[${this.serviceName}.${context}] Estadísticas obtenidas exitosamente`);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: stats
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error obteniendo estadísticas:`, error);
      
      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            system: {
              timestamp: new Date().toISOString(),
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              cpu: process.cpuUsage()
            },
            performance: {},
            cache: {},
            optimizer: {
              available: false,
              status: 'error'
            },
            optimization: {
              level: 'none',
              parallelProcessing: false,
              caching: false,
              batchOperations: false
            }
          }
        })
      };
    }
  }

  /**
   * Limpia cache del sistema
   * POST /iat/performance/clean-cache
   */
  async cleanCache(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'cleanCache';
    console.log(`[${this.serviceName}.${context}] Limpiando cache del sistema`);

    try {
      // Limpiar cache de servicios
      iatPerformanceService.cleanExpiredCache();
      iatOptimizedService.cleanExpiredCache();

      console.log(`[${this.serviceName}.${context}] Cache limpiado exitosamente`);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Cache del sistema limpiado exitosamente',
          timestamp: new Date().toISOString()
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error limpiando cache:`, error);
      
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
   * Obtiene sesiones en lote optimizado
   * POST /iat/performance/batch-sessions
   */
  async getBatchSessions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getBatchSessions';
    console.log(`[${this.serviceName}.${context}] Obteniendo sesiones en lote`);

    try {
      // Validar request body
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren IDs de sesiones',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const { sessionIds } = body;

      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere un array de IDs de sesiones',
            status: 400
          })
        };
      }

      // Obtener sesiones en lote
      const sessions = await iatOptimizedService.getSessionsBatch(sessionIds);

      console.log(`[${this.serviceName}.${context}] ${sessions.length} sesiones obtenidas en lote`);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            sessions,
            totalCount: sessions.length,
            requestedCount: sessionIds.length
          }
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error obteniendo sesiones en lote:`, error);
      
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
   * Obtiene sesiones por participante con paginación
   * GET /iat/performance/participant/{participantId}/sessions
   */
  async getParticipantSessions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getParticipantSessions';
    console.log(`[${this.serviceName}.${context}] Obteniendo sesiones por participante`);

    try {
      const participantId = event.pathParameters?.participantId;
      if (!participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de participante requerido',
            status: 400
          })
        };
      }

      // Parámetros de consulta
      const limit = parseInt(event.queryStringParameters?.limit || '50');
      const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey 
        ? JSON.parse(decodeURIComponent(event.queryStringParameters.lastEvaluatedKey))
        : undefined;

      // Obtener sesiones con paginación
      const result = await iatOptimizedService.getSessionsByParticipant(
        participantId, 
        limit, 
        lastEvaluatedKey
      );

      console.log(`[${this.serviceName}.${context}] ${result.sessions.length} sesiones obtenidas para participante`);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            sessions: result.sessions,
            totalCount: result.sessions.length,
            lastEvaluatedKey: result.lastEvaluatedKey,
            hasMore: !!result.lastEvaluatedKey
          }
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error obteniendo sesiones por participante:`, error);
      
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
}

// Exportar funciones para uso en routing
export const performOptimizedAnalysis = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATPerformanceController();
  return controller.performOptimizedAnalysis(event);
};

export const getPerformanceStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATPerformanceController();
  return controller.getPerformanceStats(event);
};

export const cleanCache = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATPerformanceController();
  return controller.cleanCache(event);
};

export const getBatchSessions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATPerformanceController();
  return controller.getBatchSessions(event);
};

export const getParticipantSessions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATPerformanceController();
  return controller.getParticipantSessions(event);
};

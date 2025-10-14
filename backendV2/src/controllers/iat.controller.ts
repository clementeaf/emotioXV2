import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getCorsHeaders } from '../middlewares/cors';
import { iatService } from '../services/iat.service';
import { structuredLog } from '../utils/logging.util';
import { toApplicationError } from '../types/errors';

/**
 * @fileoverview Controlador IAT para endpoints HTTP
 * @description Maneja todas las operaciones HTTP para Implicit Association Test
 * @version 1.0.0
 * @author EmotioXV2 Team
 */

// ======================================================================
// 🎯 ESQUEMAS DE VALIDACIÓN ZOD
// ======================================================================

/**
 * Esquema para crear configuración de prueba IAT
 */
const CreateIATTestConfigSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Versión debe seguir formato semántico'),
  categories: z.object({
    left: z.object({
      label: z.string().min(1, 'Etiqueta izquierda requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    }),
    right: z.object({
      label: z.string().min(1, 'Etiqueta derecha requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    })
  }),
  attributes: z.object({
    left: z.object({
      label: z.string().min(1, 'Etiqueta izquierda requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    }),
    right: z.object({
      label: z.string().min(1, 'Etiqueta derecha requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    })
  }),
  settings: z.object({
    maxResponseTime: z.number().min(1000, 'Tiempo máximo debe ser al menos 1000ms'),
    minResponseTime: z.number().min(100, 'Tiempo mínimo debe ser al menos 100ms'),
    errorPenalty: z.number().min(0, 'Penalización no puede ser negativa'),
    feedbackEnabled: z.boolean(),
    instructions: z.object({
      welcome: z.string().min(1, 'Instrucción de bienvenida requerida'),
      practice: z.string().min(1, 'Instrucción de práctica requerida'),
      test: z.string().min(1, 'Instrucción de prueba requerida'),
      completion: z.string().min(1, 'Instrucción de finalización requerida'),
      error: z.string().min(1, 'Instrucción de error requerida')
    }),
    timing: z.object({
      stimulusDuration: z.number().min(0),
      interTrialInterval: z.number().min(0),
      feedbackDuration: z.number().min(0),
      blockBreakDuration: z.number().min(0)
    })
  }),
  createdBy: z.string().min(1, 'Creador requerido'),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  metadata: z.object({
    author: z.string().min(1, 'Autor requerido'),
    language: z.string().min(2, 'Idioma requerido'),
    targetAudience: z.string().min(1, 'Audiencia objetivo requerida'),
    researchPurpose: z.string().min(1, 'Propósito de investigación requerido'),
    ethicalApproval: z.boolean()
  }).optional()
});

/**
 * Esquema para crear sesión IAT
 */
const CreateIATSessionSchema = z.object({
  testId: z.string().uuid('Test ID debe ser un UUID válido'),
  participantId: z.string().uuid('Participant ID debe ser un UUID válido'),
  status: z.enum(['not-started', 'instructions', 'practice', 'test', 'completed', 'abandoned', 'error']).optional(),
  currentBlock: z.number().int().min(0).optional(),
  currentTrial: z.number().int().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
  startTime: z.string().datetime().optional(),
  lastActivity: z.string().datetime().optional(),
  estimatedCompletion: z.string().datetime().optional(),
  testConfig: z.any(), // Se validará en el servicio
  responses: z.array(z.any()).optional()
});

/**
 * Esquema para actualizar sesión IAT
 */
const UpdateIATSessionSchema = z.object({
  status: z.enum(['not-started', 'instructions', 'practice', 'test', 'completed', 'abandoned', 'error']).optional(),
  progress: z.number().min(0).max(100).optional(),
  currentBlock: z.number().int().min(0).optional(),
  currentTrial: z.number().int().min(0).optional()
});

/**
 * Esquema para agregar respuesta a sesión
 */
const AddResponseSchema = z.object({
  trialId: z.string().uuid('Trial ID debe ser un UUID válido'),
  response: z.enum(['left', 'right']),
  responseTime: z.number().min(0),
  accuracy: z.boolean(),
  timestamp: z.string().datetime(),
  deviceInfo: z.object({
    userAgent: z.string(),
    screenResolution: z.object({
      width: z.number().int().min(1),
      height: z.number().int().min(1)
    }),
    inputMethod: z.enum(['mouse', 'touch', 'keyboard']),
    browserInfo: z.object({
      name: z.string(),
      version: z.string()
    })
  })
});

/**
 * Esquema para guardar resultados IAT
 */
const SaveIATResultsSchema = z.object({
  testId: z.string().uuid('Test ID debe ser un UUID válido'),
  sessionId: z.string().uuid('Session ID debe ser un UUID válido'),
  participantId: z.string().uuid('Participant ID debe ser un UUID válido'),
  completedAt: z.string().datetime(),
  totalDuration: z.number().min(0),
  dScore: z.number(),
  dScoreInterpretation: z.enum(['no-preference', 'slight-preference', 'moderate-preference', 'strong-preference']),
  blockResults: z.array(z.any()),
  errorAnalysis: z.object({
    totalErrors: z.number().int().min(0),
    errorRate: z.number().min(0).max(1),
    errorPattern: z.enum(['random', 'systematic', 'mixed']),
    correctionTime: z.number().min(0),
    confidence: z.number().min(0).max(1),
    learningEffect: z.boolean()
  }),
  performanceMetrics: z.object({
    overallAccuracy: z.number().min(0).max(1),
    speedAccuracy: z.number().min(0).max(1),
    consistency: z.number().min(0).max(1),
    attention: z.number().min(0).max(1),
    fatigue: z.number().min(0).max(1),
    engagement: z.number().min(0).max(1)
  }),
  rawData: z.array(z.any())
});

// ======================================================================
// 🎯 CONTROLADOR IAT
// ======================================================================

/**
 * Controlador para operaciones IAT
 */
export class IATController {
  private readonly serviceName = 'IATController';

  /**
   * Crea una nueva configuración de prueba IAT
   */
  async createTestConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'createTestConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Iniciando creación de configuración IAT');

    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para crear la configuración',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedData = CreateIATTestConfigSchema.parse(body);

      const testConfig = await iatService.createTestConfig({
        ...validatedData,
        status: validatedData.status || 'draft'
      });

      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración IAT creada exitosamente', { id: testConfig.id });

      return {
        statusCode: 201,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: testConfig,
          message: 'Configuración IAT creada exitosamente'
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error creando configuración IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene una configuración de prueba por ID
   */
  async getTestConfigById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getTestConfigById';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo configuración IAT');

    try {
      const testId = event.pathParameters?.id;
      if (!testId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de configuración requerido',
            status: 400
          })
        };
      }

      const testConfig = await iatService.getTestConfigById(testId);
      if (!testConfig) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Configuración no encontrada',
            status: 404
          })
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: testConfig
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error obteniendo configuración IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene configuraciones por creador
   */
  async getTestConfigsByCreator(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getTestConfigsByCreator';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo configuraciones por creador');

    try {
      const createdBy = event.queryStringParameters?.createdBy;
      if (!createdBy) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Parámetro createdBy requerido',
            status: 400
          })
        };
      }

      const configs = await iatService.getTestConfigsByCreator(createdBy);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: configs,
          count: configs.length
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error obteniendo configuraciones por creador', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Actualiza una configuración de prueba
   */
  async updateTestConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'updateTestConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando configuración IAT');

    try {
      const testId = event.pathParameters?.id;
      if (!testId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de configuración requerido',
            status: 400
          })
        };
      }

      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para actualizar',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedData = CreateIATTestConfigSchema.partial().parse(body);

      const updatedConfig = await iatService.updateTestConfig(testId, validatedData);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: updatedConfig,
          message: 'Configuración actualizada exitosamente'
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error actualizando configuración IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Crea una nueva sesión IAT
   */
  async createSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'createSession';
    structuredLog('info', `${this.serviceName}.${context}`, 'Iniciando creación de sesión IAT');

    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para crear la sesión',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedData = CreateIATSessionSchema.parse(body);

      if (!validatedData.testConfig) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'testConfig es requerido',
            status: 400
          })
        };
      }

      const session = await iatService.createSession({
        ...validatedData,
        status: validatedData.status || 'not-started',
        currentBlock: validatedData.currentBlock || 0,
        currentTrial: validatedData.currentTrial || 0,
        progress: validatedData.progress || 0,
        startTime: validatedData.startTime || new Date().toISOString(),
        lastActivity: validatedData.lastActivity || new Date().toISOString(),
        responses: validatedData.responses || [],
        testConfig: validatedData.testConfig
      });

      structuredLog('info', `${this.serviceName}.${context}`, 'Sesión IAT creada exitosamente', { sessionId: session.sessionId });

      return {
        statusCode: 201,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: session,
          message: 'Sesión IAT creada exitosamente'
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error creando sesión IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene una sesión por ID
   */
  async getSessionById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getSessionById';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo sesión IAT');

    try {
      const sessionId = event.pathParameters?.id;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de sesión requerido',
            status: 400
          })
        };
      }

      const session = await iatService.getSessionById(sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Sesión no encontrada',
            status: 404
          })
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: session
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error obteniendo sesión IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Actualiza el estado de una sesión
   */
  async updateSessionStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'updateSessionStatus';
    structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando estado de sesión IAT');

    try {
      const sessionId = event.pathParameters?.id;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de sesión requerido',
            status: 400
          })
        };
      }

      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para actualizar',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedData = UpdateIATSessionSchema.parse(body);

      const updatedSession = await iatService.updateSessionStatus(
        sessionId,
        validatedData.status || 'not-started',
        validatedData.progress
      );

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: updatedSession,
          message: 'Estado de sesión actualizado exitosamente'
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error actualizando estado de sesión IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Agrega una respuesta a una sesión
   */
  async addResponseToSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'addResponseToSession';
    structuredLog('info', `${this.serviceName}.${context}`, 'Agregando respuesta a sesión IAT');

    try {
      const sessionId = event.pathParameters?.id;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de sesión requerido',
            status: 400
          })
        };
      }

      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos de respuesta',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedData = AddResponseSchema.parse(body);

      const updatedSession = await iatService.addResponseToSession(sessionId, validatedData);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: updatedSession,
          message: 'Respuesta agregada exitosamente'
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error agregando respuesta a sesión IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Guarda resultados completos de IAT
   */
  async saveResults(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'saveResults';
    structuredLog('info', `${this.serviceName}.${context}`, 'Guardando resultados IAT');

    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos de resultados',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedData = SaveIATResultsSchema.parse(body);

      const results = await iatService.saveResults(validatedData);

      structuredLog('info', `${this.serviceName}.${context}`, 'Resultados IAT guardados exitosamente', { resultId: results.resultId });

      return {
        statusCode: 201,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: results,
          message: 'Resultados guardados exitosamente'
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error guardando resultados IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene resultados por ID
   */
  async getResultsById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getResultsById';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo resultados IAT');

    try {
      const resultId = event.pathParameters?.id;
      if (!resultId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de resultado requerido',
            status: 400
          })
        };
      }

      const results = await iatService.getResultsById(resultId);
      if (!results) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Resultados no encontrados',
            status: 404
          })
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: results
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error obteniendo resultados IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene resultados por participante
   */
  async getResultsByParticipant(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getResultsByParticipant';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo resultados por participante');

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

      const results = await iatService.getResultsByParticipant(participantId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: results,
          count: results.length
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error obteniendo resultados por participante', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene estadísticas generales de IAT
   */
  async getStatistics(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getStatistics';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo estadísticas IAT');

    try {
      const statistics = await iatService.getIATStatistics();

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: statistics
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error obteniendo estadísticas IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }

  /**
   * Elimina una sesión y todos sus datos relacionados
   */
  async deleteSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'deleteSession';
    structuredLog('info', `${this.serviceName}.${context}`, 'Eliminando sesión IAT y datos relacionados');

    try {
      const sessionId = event.pathParameters?.id;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de sesión requerido',
            status: 400
          })
        };
      }

      await iatService.deleteSessionAndRelatedData(sessionId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Sesión y datos relacionados eliminados exitosamente'
        })
      };
    } catch (error: unknown) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error eliminando sesión IAT', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error interno del servidor',
          details: toApplicationError(error).message,
          status: 500
        })
      };
    }
  }
}

// ======================================================================
// 🎯 HANDLERS DE LAMBDA
// ======================================================================

/**
 * Handler para crear configuración de prueba IAT
 */
export const createTestConfig = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.createTestConfig(event);
};

/**
 * Handler para obtener configuración de prueba por ID
 */
export const getTestConfigById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.getTestConfigById(event);
};

/**
 * Handler para obtener configuraciones por creador
 */
export const getTestConfigsByCreator = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.getTestConfigsByCreator(event);
};

/**
 * Handler para actualizar configuración de prueba
 */
export const updateTestConfig = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.updateTestConfig(event);
};

/**
 * Handler para crear sesión IAT
 */
export const createSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.createSession(event);
};

/**
 * Handler para obtener sesión por ID
 */
export const getSessionById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.getSessionById(event);
};

/**
 * Handler para actualizar estado de sesión
 */
export const updateSessionStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.updateSessionStatus(event);
};

/**
 * Handler para agregar respuesta a sesión
 */
export const addResponseToSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.addResponseToSession(event);
};

/**
 * Handler para guardar resultados IAT
 */
export const saveResults = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.saveResults(event);
};

/**
 * Handler para obtener resultados por ID
 */
export const getResultsById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.getResultsById(event);
};

/**
 * Handler para obtener resultados por participante
 */
export const getResultsByParticipant = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.getResultsByParticipant(event);
};

/**
 * Handler para obtener estadísticas IAT
 */
export const getStatistics = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.getStatistics(event);
};

/**
 * Handler para eliminar sesión IAT
 */
export const deleteSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATController();
  return controller.deleteSession(event);
};

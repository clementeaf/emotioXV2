import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { spawn } from 'child_process';
import { iatService } from '../services/iat.service';
import { getCorsHeaders } from '../utils/cors';
import { z } from 'zod';

/**
 * Controlador para ejecución de pruebas IAT
 * Maneja la lógica completa de pruebas de asociación implícita
 */

// Schema para validación de inicio de sesión
const StartTestSessionSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido'),
  participantId: z.string().min(1, 'ID de participante requerido'),
  testConfigId: z.string().uuid('ID de configuración inválido')
});

// Schema para validación de respuesta
const ProcessResponseSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido'),
  trialNumber: z.number().int().min(1, 'Número de trial debe ser positivo'),
  blockNumber: z.number().int().min(1, 'Número de bloque debe ser positivo'),
  stimulus: z.string().min(1, 'Estímulo requerido'),
  response: z.enum(['left', 'right'], { errorMap: () => ({ message: 'Respuesta debe ser left o right' }) }),
  responseTime: z.number().int().min(0, 'Tiempo de respuesta debe ser no negativo'),
  correct: z.boolean()
});

export class IATTestExecutionController {
  private readonly serviceName = 'IATTestExecutionController';
  private readonly pythonPath: string;
  private readonly engineScriptPath: string;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.engineScriptPath = process.env.IAT_ENGINE_SCRIPT || 
      `${__dirname}/../iat/iat-test-engine.py`;
  }

  /**
   * Inicia una nueva sesión de prueba IAT
   * POST /iat/test/start
   */
  async startTestSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'startTestSession';
    console.log(`[${this.serviceName}.${context}] Iniciando sesión de prueba IAT`);

    try {
      // Validar request body
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para iniciar la sesión',
            status: 400
          })
        };
      }

      const body = JSON.parse(event.body);
      const validatedRequest = StartTestSessionSchema.parse(body);

      // Obtener configuración de prueba
      const testConfig = await iatService.getTestConfigById(validatedRequest.testConfigId);
      if (!testConfig) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Configuración de prueba no encontrada',
            status: 404
          })
        };
      }

      // Iniciar sesión en el motor IAT Python
      const sessionData = await this.executePythonEngine({
        action: 'start_session',
        session_id: validatedRequest.sessionId,
        participant_id: validatedRequest.participantId,
        test_config: testConfig
      });

      // Crear sesión en DynamoDB
      const session = await iatService.createSession({
        participantId: validatedRequest.participantId,
        testId: testConfig.id,
        testConfig: testConfig,
        status: 'not-started',
        currentBlock: 1,
        currentTrial: 1,
        progress: 0.0,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        responses: [],
      });

      console.log(`[${this.serviceName}.${context}] Sesión IAT iniciada exitosamente`, {
        sessionId: validatedRequest.sessionId,
        totalBlocks: (sessionData as { total_blocks?: number }).total_blocks
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: session.sessionId,
            participantId: session.participantId,
            testConfig: {
              id: testConfig.id,
              name: testConfig.name,
              description: testConfig.description
            },
            blocks: sessionData.blocks,
            totalBlocks: sessionData.total_blocks,
            currentBlock: session.currentBlock,
            currentTrial: session.currentTrial,
            progress: session.progress,
            startTime: session.startTime
          },
          message: 'Sesión IAT iniciada exitosamente'
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error iniciando sesión IAT:`, error);
      
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
   * Procesa una respuesta del participante
   * POST /iat/test/response
   */
  async processResponse(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'processResponse';
    console.log(`[${this.serviceName}.${context}] Procesando respuesta IAT`);

    try {
      // Validar request body
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
      const validatedRequest = ProcessResponseSchema.parse(body);

      // Verificar que la sesión existe
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

      // Verificar que la sesión está activa
      if (session.status === 'completed' || session.status === 'abandoned') {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'La sesión no está activa',
            status: 400
          })
        };
      }

      // Procesar respuesta en el motor IAT Python
      const responseResult = await this.executePythonEngine({
        action: 'process_response',
        response: {
          trial_number: validatedRequest.trialNumber,
          block_number: validatedRequest.blockNumber,
          stimulus: validatedRequest.stimulus,
          response: validatedRequest.response,
          response_time: validatedRequest.responseTime,
          correct: validatedRequest.correct
        }
      });


      // Actualizar sesión con la nueva respuesta
      const responseData = responseResult as { is_last_response?: boolean; progress?: number };
      const updatedSession = await iatService.updateSessionStatus(
        validatedRequest.sessionId,
        responseData.is_last_response ? 'completed' : 'test',
        responseData.progress || 0.0
      );

      console.log(`[${this.serviceName}.${context}] Respuesta procesada exitosamente`, {
        sessionId: validatedRequest.sessionId,
        correct: validatedRequest.correct,
        isLastResponse: responseResult.is_last_response
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            responseId: responseResult.response_id,
            correct: responseResult.correct,
            isLastResponse: responseResult.is_last_response,
            progress: responseResult.progress,
            currentBlock: updatedSession.currentBlock,
            currentTrial: updatedSession.currentTrial,
            sessionStatus: updatedSession.status,
            nextStimulus: responseResult.next_stimulus
          },
          message: 'Respuesta procesada exitosamente'
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error procesando respuesta IAT:`, error);
      
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
   * Obtiene el estado actual de una sesión
   * GET /iat/test/session/{sessionId}
   */
  async getSessionStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const context = 'getSessionStatus';
    console.log(`[${this.serviceName}.${context}] Obteniendo estado de sesión IAT`);

    try {
      const sessionId = event.pathParameters?.sessionId;
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

      // Obtener sesión desde DynamoDB
      const session = await iatService.getSessionById(sessionId);
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

      console.log(`[${this.serviceName}.${context}] Estado de sesión obtenido`, {
        sessionId,
        status: session.status,
        progress: session.progress
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: session.sessionId,
            participantId: session.participantId,
            status: session.status,
            currentBlock: session.currentBlock,
            currentTrial: session.currentTrial,
            progress: session.progress,
            startTime: session.startTime,
            lastActivity: session.lastActivity,
            totalResponses: session.responses?.length || 0
          }
        })
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error obteniendo estado de sesión:`, error);
      
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
   * Ejecuta el motor Python IAT y retorna el resultado
   */
  private async executePythonEngine(inputData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const context = 'executePythonEngine';
    
    return new Promise((resolve, reject) => {
      console.log(`[${this.serviceName}.${context}] Ejecutando motor Python IAT`);

      // Crear proceso Python
      const pythonProcess = spawn(this.pythonPath, [this.engineScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      // Capturar salida estándar
      pythonProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Capturar errores
      pythonProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Manejar finalización del proceso
      pythonProcess.on('close', (code: number) => {
        if (code !== 0) {
          console.error(`[${this.serviceName}.${context}] Python IAT Engine failed:`, {
            code,
            stderr
          });
          reject(new Error(`Python IAT Engine failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          console.log(`[${this.serviceName}.${context}] Python IAT Engine completed:`, {
            success: result.success
          });
          resolve(result);
        } catch (parseError: unknown) {
          console.error(`[${this.serviceName}.${context}] Error parsing Python output:`, {
            error: parseError,
            stdout
          });
          reject(new Error(`Error parsing Python output: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
        }
      });

      // Manejar errores del proceso
      pythonProcess.on('error', (error: Error) => {
        console.error(`[${this.serviceName}.${context}] Python IAT Engine process error:`, error);
        reject(new Error(`Python IAT Engine process error: ${error.message}`));
      });

      // Enviar datos a Python
      try {
        const inputJson = JSON.stringify(inputData);
        pythonProcess.stdin?.write(inputJson);
        pythonProcess.stdin?.end();
      } catch (writeError: unknown) {
        console.error(`[${this.serviceName}.${context}] Error writing to Python stdin:`, {
          error: writeError
        });
        reject(new Error(`Error writing to Python: ${writeError instanceof Error ? writeError.message : String(writeError)}`));
      }
    });
  }
}

// Exportar funciones para uso en routing
export const startTestSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATTestExecutionController();
  return controller.startTestSession(event);
};

export const processResponse = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATTestExecutionController();
  return controller.processResponse(event);
};

export const getSessionStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new IATTestExecutionController();
  return controller.getSessionStatus(event);
};

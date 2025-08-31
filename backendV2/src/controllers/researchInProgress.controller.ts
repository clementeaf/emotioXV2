import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { moduleResponseService } from '../services/moduleResponse.service';
import { participantService } from '../services/participant.service';
import { structuredLog } from '../utils/logging.util';

/**
 * Controlador para Research In Progress
 * Maneja endpoints para monitorear el progreso de investigaciones
 */
export class ResearchInProgressController {

  /**
   * Obtener participantes con estados para un research
   */
  async getParticipantsWithStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener todas las respuestas del research
      const allResponses = await moduleResponseService.getResponsesByResearch(researchId);

      // Obtener todos los participantes
      const allParticipants = await participantService.findAll();

      // Crear mapa de participantes por research
      const participantsWithStatus = allParticipants.map(participant => {
        // Buscar respuestas de este participante en este research
        const participantResponses = allResponses.find(
          response => response.participantId === participant.id
        );

        // Determinar estado basado en las respuestas
        let status = 'Por iniciar';
        let progress = 0;
        let lastActivity = null;
        let duration = null;

        if (participantResponses) {
          const responses = participantResponses.responses || [];

          // Verificar si completó thank_you_screen
          const hasCompleted = responses.some(r => r.questionKey === 'thank_you_screen');

          if (hasCompleted) {
            status = 'Completado';
            progress = 100;
          } else if (responses.length > 0) {
            status = 'En proceso';

            // 🎯 CALCULAR PROGRESO BASADO EN RESPUESTAS REALES
            const responseTypes = responses.map(r => r.questionKey);
            let calculatedProgress = 0;

            // 🎯 MAPA DE PROGRESO POR TIPO DE RESPUESTA
            const progressMap: Record<string, number> = {
              'demographics': 20,      // 20% por demográficos
              'welcome_screen': 40,    // 40% por pantalla de bienvenida
              'eye_tracking': 60,      // 60% por eye tracking
              'smart_voc': 80,         // 80% por smart VOC
              'cognitive_task': 90,    // 90% por tarea cognitiva
              'thank_you_screen': 100  // 100% por pantalla de agradecimiento
            };

            // 🎯 CALCULAR PROGRESO BASADO EN RESPUESTAS ENVIADAS
            if (responseTypes.length > 0) {
              const maxProgress = Math.max(...responseTypes.map(type => progressMap[type] || 0));
              calculatedProgress = maxProgress;
            }

            progress = calculatedProgress;

            structuredLog('info', 'ResearchInProgressController.getParticipantsWithStatus', 'Progreso calculado para participante', {
              participantId: participant.id,
              responseTypes,
              calculatedProgress,
              progress
            });
          }

          // Calcular última actividad
          if (responses.length > 0) {
            const lastResponse = responses[responses.length - 1];
            lastActivity = lastResponse.timestamp;

            // Calcular duración si hay múltiples respuestas
            if (responses.length > 1) {
              const firstResponse = responses[0];
              const lastResponseTime = new Date(lastResponse.timestamp).getTime();
              const firstResponseTime = new Date(firstResponse.timestamp).getTime();
              const durationMs = lastResponseTime - firstResponseTime;
              duration = Math.round(durationMs / (1000 * 60)); // En minutos
            }
          }
        }

        return {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          status,
          progress,
          duration: duration ? `${duration} min` : '--',
          lastActivity: lastActivity ? this.formatLastActivity(lastActivity) : 'No iniciado'
        };
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: participantsWithStatus,
          status: 200
        })
      };
    } catch (error: any) {
      structuredLog('error', 'ResearchInProgressController.getParticipantsWithStatus', 'Error al obtener participantes con estados', { error });
      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener participantes con estados',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener métricas de overview para un research
   */
  async getOverviewMetrics(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener todas las respuestas del research
      const allResponses = await moduleResponseService.getResponsesByResearch(researchId);

      // Obtener todos los participantes
      const allParticipants = await participantService.findAll();

      // Calcular métricas
      const totalParticipants = allParticipants.length;
      const completedParticipants = allResponses.filter(
        response => response.responses?.some(r => r.questionKey === 'thank_you_screen')
      ).length;
      const inProgressParticipants = allResponses.filter(
        response => {
          const responses = response.responses || [];
          return responses.length > 0 && !responses.some(r => r.questionKey === 'thank_you_screen');
        }
      ).length;
      const pendingParticipants = totalParticipants - completedParticipants - inProgressParticipants;

      // Calcular tiempo promedio
      let totalDuration = 0;
      let completedWithDuration = 0;

      allResponses.forEach(response => {
        const responses = response.responses || [];
        if (responses.length > 1) {
          const firstResponse = responses[0];
          const lastResponse = responses[responses.length - 1];
          const durationMs = new Date(lastResponse.timestamp).getTime() - new Date(firstResponse.timestamp).getTime();
          totalDuration += durationMs;
          completedWithDuration++;
        }
      });

      const averageDuration = completedWithDuration > 0 ? totalDuration / completedWithDuration : 0;
      const averageMinutes = Math.floor(averageDuration / (1000 * 60));
      const averageSeconds = Math.floor((averageDuration % (1000 * 60)) / 1000);

      // Obtener última actividad
      let lastActivity = null;
      if (allResponses.length > 0) {
        const allTimestamps = allResponses.flatMap(r => r.responses?.map(resp => resp.timestamp) || []);
        if (allTimestamps.length > 0) {
          const latestTimestamp = Math.max(...allTimestamps.map(t => new Date(t).getTime()));
          lastActivity = this.formatLastActivity(new Date(latestTimestamp).toISOString());
        }
      }

      const metrics = {
        status: {
          value: 'Activa',
          description: 'Los participantes pueden acceder',
          icon: 'chart-line'
        },
        participants: {
          value: totalParticipants.toString(),
          description: `${completedParticipants} respuestas completadas`,
          icon: 'users'
        },
        completionRate: {
          value: totalParticipants > 0 ? `${Math.round((completedParticipants / totalParticipants) * 100)}%` : '0%',
          description: `${pendingParticipants} pendientes`,
          icon: 'check-circle'
        },
        averageTime: {
          value: averageDuration > 0 ? `${averageMinutes} min ${averageSeconds} seg` : '--',
          description: lastActivity ? `Última actividad: ${lastActivity}` : 'Sin actividad',
          icon: 'clock'
        }
      };

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: metrics,
          status: 200
        })
      };
    } catch (error: any) {
      structuredLog('error', 'ResearchInProgressController.getOverviewMetrics', 'Error al obtener métricas de overview', { error });
      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener métricas de overview',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener participantes por research
   */
  async getParticipantsByResearch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener todas las respuestas del research
      const allResponses = await moduleResponseService.getResponsesByResearch(researchId);

      // Obtener todos los participantes
      const allParticipants = await participantService.findAll();

      // Filtrar participantes que han participado en este research
      const researchParticipants = allParticipants.filter(participant => {
        return allResponses.some(response => response.participantId === participant.id);
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: researchParticipants,
          status: 200
        })
      };
    } catch (error: any) {
      structuredLog('error', 'ResearchInProgressController.getParticipantsByResearch', 'Error al obtener participantes por research', { error });
      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener participantes por research',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Eliminar participante específico de una investigación
   */
  async deleteParticipant(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;
      const participantId = event.pathParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'researchId y participantId son requeridos'
          })
        };
      }

      // 🎯 ELIMINAR PARTICIPANTE DE DYNAMODB
      const deleteData = {
        researchId,
        participantId,
        deletedAt: new Date().toISOString(),
        deletedBy: 'admin', // TODO: Obtener del token de autenticación
        reason: 'Manual deletion from dashboard'
      };

      // 🎯 INTENTAR ELIMINAR REGISTROS RELACIONADOS
      try {
        // Intentar método original primero
        await participantService.deleteParticipantData(researchId, participantId);
        structuredLog('info', 'ResearchInProgressController.deleteParticipant', 'Eliminación exitosa usando método original', { researchId, participantId });
      } catch (error) {
        structuredLog('warn', 'ResearchInProgressController.deleteParticipant', 'Error con método original, intentando método simple', { error, researchId, participantId });
        // Si falla el método original, usar el método simple
        await participantService.deleteParticipantDataSimple(researchId, participantId);
        structuredLog('info', 'ResearchInProgressController.deleteParticipant', 'Eliminación exitosa usando método simple', { researchId, participantId });
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Participante eliminado correctamente',
          data: {
            researchId,
            participantId,
            deletedAt: deleteData.deletedAt
          }
        })
      };

    } catch (error) {
      structuredLog('error', 'ResearchInProgressController.deleteParticipant', 'Error eliminando participante', { error });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Obtener detalles completos de un participante específico
   */
  async getParticipantDetails(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;
      const participantId = event.pathParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId y participantId',
            status: 400
          })
        };
      }

      // Obtener el participante
      const participant = await participantService.findById(participantId);
      if (!participant) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Participante no encontrado',
            status: 404
          })
        };
      }

      // Obtener respuestas del participante en este research
      const participantResponses = await moduleResponseService.getResponsesForParticipant(researchId, participantId);

      // Determinar estado y progreso
      let status = 'Por iniciar';
      let progress = 0;
      let startTime = null;
      let endTime = null;
      let totalDuration = 0;
      let responses: any[] = [];
      let deviceInfo = null;
      let location = null;

      if (participantResponses && participantResponses.responses) {
        responses = participantResponses.responses;

        if (responses.length > 0) {
          // Calcular progreso basado en número de respuestas
          progress = Math.min((responses.length / 5) * 100, 90); // Estimación

          // Verificar si completó
          const hasCompleted = responses.some(r => r.questionKey === 'thank_you_screen');
          if (hasCompleted) {
            status = 'Completado';
            progress = 100;
          } else if (responses.length > 0) {
            status = 'En proceso';
          }

          // Calcular tiempos
          const sortedResponses = responses.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          startTime = sortedResponses[0].timestamp;
          endTime = sortedResponses[sortedResponses.length - 1].timestamp;

          // Calcular duración total
          if (responses.length > 1) {
            const start = new Date(startTime).getTime();
            const end = new Date(endTime).getTime();
            totalDuration = Math.round((end - start) / 1000); // En segundos
          }

          // Extraer información de dispositivo y ubicación de las respuestas reales
          const firstResponse = responses[0];
          if (firstResponse.deviceInfo) {
            deviceInfo = firstResponse.deviceInfo;
          }
          if (firstResponse.location) {
            location = firstResponse.location;
          }
        }
      }

      // Si no hay datos reales, usar valores por defecto más apropiados
      if (!deviceInfo) {
        deviceInfo = {
          type: 'desktop' as const,
          browser: 'N/A',
          os: 'N/A',
          screenSize: 'N/A'
        };
      }

      if (!location) {
        location = {
          country: 'Chile',
          city: 'Valparaíso',
          ip: 'N/A'
        };
      }

      const participantDetails = {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        status,
        progress,
        startTime,
        endTime,
        totalDuration,
        deviceInfo,
        location,
        responses: responses.map(r => ({
          questionKey: r.questionKey,
          questionText: this.getQuestionText(r.questionKey),
          response: r.response,
          timestamp: r.timestamp,
          duration: r.duration || 0
        })),
        disqualificationReason: null,
        isDisqualified: false
      };

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: participantDetails,
          status: 200
        })
      };
    } catch (error: any) {
      structuredLog('error', 'ResearchInProgressController.getParticipantDetails', 'Error al obtener detalles del participante', { error });
      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener detalles del participante',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Formatear última actividad
   */
  private formatLastActivity(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Hace menos de 1 minuto';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    }
  }

  /**
   * Obtener texto de pregunta por clave
   */
  private getQuestionText(questionKey: string): string {
    const questionTexts: Record<string, string> = {
      'welcome_screen': 'Pantalla de bienvenida',
      'smart_voc_question_1': '¿Qué piensas sobre este producto?',
      'smart_voc_question_2': '¿Cómo mejorarías este servicio?',
      'cognitive_task_1': 'Tarea cognitiva 1',
      'cognitive_task_2': 'Tarea cognitiva 2',
      'eye_tracking_calibration': 'Calibración de eye tracking',
      'eye_tracking_task': 'Tarea de eye tracking',
      'thank_you_screen': 'Pantalla de agradecimiento'
    };

    return questionTexts[questionKey] || questionKey;
  }
}

// Instancia del controlador
const controller = new ResearchInProgressController();

/**
 * Handler principal para las rutas de Research In Progress
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Manejar preflight CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: ''
      };
    }

    const path = event.path.toLowerCase();
    const method = event.httpMethod;

    structuredLog('info', 'ResearchInProgressHandler', 'Procesando request', { method, path });

    // Enrutar según el método y path
    if (method === 'GET' && path.match(/^\/research\/[^\/]+\/participants\/status$/)) {
      structuredLog('info', 'ResearchInProgressHandler', 'Ejecutando getParticipantsWithStatus');
      return controller.getParticipantsWithStatus(event);
    } else if (method === 'GET' && path.match(/^\/research\/[^\/]+\/metrics$/)) {
      structuredLog('info', 'ResearchInProgressHandler', 'Ejecutando getOverviewMetrics');
      return controller.getOverviewMetrics(event);
    } else if (method === 'GET' && path.match(/^\/research\/[^\/]+\/participants\/[^\/]+$/)) {
      structuredLog('info', 'ResearchInProgressHandler', 'Ejecutando getParticipantDetails');
      return controller.getParticipantDetails(event);
    } else if (method === 'GET' && path.match(/^\/research\/[^\/]+\/participants$/)) {
      structuredLog('info', 'ResearchInProgressHandler', 'Ejecutando getParticipantsByResearch');
      return controller.getParticipantsByResearch(event);
    } else if (method === 'DELETE' && path.match(/^\/research\/[^\/]+\/participants\/[^\/]+$/)) {
      structuredLog('info', 'ResearchInProgressHandler', 'Ejecutando deleteParticipant');
      return controller.deleteParticipant(event);
    }

    // Ruta no encontrada
    structuredLog('warn', 'ResearchInProgressHandler', 'Ruta/Método no manejado', { method, path });
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Recurso no encontrado', status: 404 })
    };
  } catch (error: any) {
    structuredLog('error', 'ResearchInProgressHandler', 'Error en researchInProgressHandler', { error });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Error interno del servidor',
        status: 500
      })
    };
  }
};
export const handler = mainHandler;

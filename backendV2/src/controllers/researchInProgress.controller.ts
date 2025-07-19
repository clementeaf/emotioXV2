import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { moduleResponseService } from '../services/moduleResponse.service';
import { participantService } from '../services/participant.service';

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
            progress = Math.min((responses.length / 5) * 100, 90); // Estimación basada en número de respuestas
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
      console.error('Error al obtener participantes con estados:', error);
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
      console.error('Error al obtener métricas de overview:', error);
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
      console.error('Error al obtener participantes por research:', error);
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

    // Enrutar según el método y path
    if (method === 'GET' && path.match(/^\/research\/[^\/]+\/participants\/status$/)) {
      return controller.getParticipantsWithStatus(event);
    } else if (method === 'GET' && path.match(/^\/research\/[^\/]+\/metrics$/)) {
      return controller.getOverviewMetrics(event);
    } else if (method === 'GET' && path.match(/^\/research\/[^\/]+\/participants$/)) {
      return controller.getParticipantsByResearch(event);
    }

    // Ruta no encontrada
    console.log('[ResearchInProgressHandler] Ruta/Método no manejado:', { method, path });
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Recurso no encontrado', status: 404 })
    };
  } catch (error: any) {
    console.error('Error en researchInProgressHandler:', error);
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

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { MonitoringEvent } from '../../../shared/interfaces/websocket-events.interface';
import { structuredLog } from '../utils/logging.util';

/**
 * Controlador para manejar eventos de monitoreo en tiempo real
 */
export class MonitoringController {
  private readonly controllerName = 'MonitoringController';

  /**
   * Maneja eventos de monitoreo desde public-tests
   */
  async handleMonitoringEvent(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const contextName = 'handleMonitoringEvent';

    try {
      const body = JSON.parse(event.body || '{}');
      const monitoringEvent: MonitoringEvent = body;

      structuredLog('info', `${this.controllerName}.${contextName}`, 'Evento de monitoreo recibido', {
        eventType: monitoringEvent.type,
        researchId: monitoringEvent.data?.researchId,
        participantId: monitoringEvent.data?.participantId
      });

      // 🎯 PROCESAR EVENTO SEGÚN TIPO
      switch (monitoringEvent.type) {
        case 'PARTICIPANT_LOGIN':
          await this.handleParticipantLogin(monitoringEvent.data);
          break;
        case 'PARTICIPANT_STEP':
          await this.handleParticipantStep(monitoringEvent.data);
          break;
        case 'PARTICIPANT_DISQUALIFIED':
          await this.handleParticipantDisqualified(monitoringEvent.data);
          break;
        case 'PARTICIPANT_QUOTA_EXCEEDED':
          await this.handleParticipantQuotaExceeded(monitoringEvent.data);
          break;
        case 'PARTICIPANT_COMPLETED':
          await this.handleParticipantCompleted(monitoringEvent.data);
          break;
        case 'PARTICIPANT_ERROR':
          await this.handleParticipantError(monitoringEvent.data);
          break;
        default:
          structuredLog('warn', `${this.controllerName}.${contextName}`, 'Evento no manejado', {
            eventType: monitoringEvent.type
          });
      }

      // 🎯 BROADCAST A TODOS LOS CLIENTES CONECTADOS
      await this.broadcastToDashboard(monitoringEvent);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Evento procesado correctamente'
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${contextName}`, 'Error procesando evento de monitoreo', { error });
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Maneja login de participante
   */
  private async handleParticipantLogin(data: any): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantLogin`, 'Participante inició sesión', {
      researchId: data.researchId,
      participantId: data.participantId,
      email: data.email
    });

    // 🎯 GUARDAR EN DYNAMODB PARA HISTORIAL
    // TODO: Implementar guardado en DynamoDB
  }

  /**
   * Maneja progreso de step
   */
  private async handleParticipantStep(data: any): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantStep`, 'Participante avanzó de step', {
      researchId: data.researchId,
      participantId: data.participantId,
      stepName: data.stepName,
      progress: data.progress
    });

    // 🎯 ACTUALIZAR PROGRESO EN DYNAMODB
    // TODO: Implementar actualización en DynamoDB
  }

  /**
   * Maneja descalificación de participante
   */
  private async handleParticipantDisqualified(data: any): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantDisqualified`, 'Participante descalificado', {
      researchId: data.researchId,
      participantId: data.participantId,
      reason: data.reason,
      disqualificationType: data.disqualificationType
    });

    // 🎯 GUARDAR DESCALIFICACIÓN EN DYNAMODB
    // TODO: Implementar guardado en DynamoDB
  }

  /**
   * Maneja exceso de cuota
   */
  private async handleParticipantQuotaExceeded(data: any): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantQuotaExceeded`, 'Participante excedió cuota', {
      researchId: data.researchId,
      participantId: data.participantId,
      quotaType: data.quotaType,
      quotaValue: data.quotaValue,
      currentCount: data.currentCount,
      maxQuota: data.maxQuota
    });

    // 🎯 GUARDAR EXCESO DE CUOTA EN DYNAMODB
    // TODO: Implementar guardado en DynamoDB
  }

  /**
   * Maneja completación de participante
   */
  private async handleParticipantCompleted(data: any): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantCompleted`, 'Participante completó investigación', {
      researchId: data.researchId,
      participantId: data.participantId,
      totalDuration: data.totalDuration,
      responsesCount: data.responsesCount
    });

    // 🎯 GUARDAR COMPLETACIÓN EN DYNAMODB
    // TODO: Implementar guardado en DynamoDB
  }

  /**
   * Maneja error de participante
   */
  private async handleParticipantError(data: any): Promise<void> {
    structuredLog('error', `${this.controllerName}.handleParticipantError`, 'Error de participante', {
      researchId: data.researchId,
      participantId: data.participantId,
      error: data.error,
      stepName: data.stepName
    });

    // 🎯 GUARDAR ERROR EN DYNAMODB
    // TODO: Implementar guardado en DynamoDB
  }

  /**
   * Broadcast evento a todos los dashboards conectados
   */
  private async broadcastToDashboard(event: MonitoringEvent): Promise<void> {
    try {
      // 🎯 OBTENER CONEXIONES ACTIVAS PARA LA INVESTIGACIÓN
      const researchId = event.data?.researchId;
      if (!researchId) {
        structuredLog('warn', `${this.controllerName}.broadcastToDashboard`, 'No hay researchId en evento');
        return;
      }

      // 🎯 BUSCAR CONEXIONES WEBSOCKET ACTIVAS
      // TODO: Implementar búsqueda de conexiones activas
      // Por ahora, solo log del evento
      structuredLog('info', `${this.controllerName}.broadcastToDashboard`, 'Broadcasting evento', {
        eventType: event.type,
        researchId,
        participantId: event.data?.participantId
      });

    } catch (error) {
      structuredLog('error', `${this.controllerName}.broadcastToDashboard`, 'Error en broadcast', { error });
    }
  }

  /**
   * Suscribe dashboard a eventos de investigación
   */
  async subscribeToResearch(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const contextName = 'subscribeToResearch';

    try {
      const body = JSON.parse(event.body || '{}');
      const { researchId } = body;

      if (!researchId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: 'researchId es requerido'
          })
        };
      }

      structuredLog('info', `${this.controllerName}.${contextName}`, 'Dashboard suscrito a investigación', {
        researchId,
        connectionId: event.requestContext.connectionId
      });

      // 🎯 GUARDAR SUSCRIPCIÓN
      // TODO: Implementar guardado de suscripción

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Suscrito correctamente'
        })
      };

    } catch (error) {
      structuredLog('error', `${this.controllerName}.${contextName}`, 'Error en suscripción', { error });
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        })
      };
    }
  }
}

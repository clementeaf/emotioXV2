// import { APIGatewayProxyEvent } from 'aws-lambda';
import { APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { APIGatewayEventWebsocketRequestContext } from '../types/websocket';
import { webSocketService } from '../services/websocket.service';

interface WebSocketEvent {
  requestContext: APIGatewayEventWebsocketRequestContext;
  headers?: { [name: string]: string };
  multiValueHeaders?: { [name: string]: string[] };
  body: string | null;
  isBase64Encoded?: boolean;
  pathParameters?: { [name: string]: string } | null;
  queryStringParameters?: { [name: string]: string } | null;
  multiValueQueryStringParameters?: { [name: string]: string[] } | null;
  stageVariables?: { [name: string]: string } | null;
  resource?: string;
  path?: string;
  httpMethod?: string;
}

export class WebSocketController {
  /**
   * Helper para crear evento WebSocket y hacer broadcast
   */
  private async broadcastEvent(
    researchId: string,
    eventType: string,
    participantId: string,
    metadata: Record<string, unknown>
  ): Promise<number> {
    try {
      const wsEvent = {
        type: 'status_update' as const,
        data: {
          timestamp: new Date().toISOString(),
          message: eventType,
          participantId,
          sessionId: researchId,
          metadata: metadata as unknown as Record<string, string | number | boolean>
        }
      };

      const successfulBroadcasts = await webSocketService.broadcastToResearch(researchId, wsEvent);

      console.log(`[WebSocketController] ✅ ${eventType} broadcast al dashboard:`, {
        researchId,
        participantId,
        successfulBroadcasts
      });

      return successfulBroadcasts;
    } catch (error) {
      console.error(`[WebSocketController] ❌ Error en broadcast de ${eventType}:`, error);
      return 0;
    }
  }

  /**
   * Maneja la conexión inicial del WebSocket
   */
  async handleConnect(event: WebSocketEvent): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const routeKey = event.requestContext.routeKey;

    console.log('[WebSocketController] ✅ Conexión establecida:', {
      connectionId,
      routeKey,
      domainName: event.requestContext.domainName,
      stage: event.requestContext.stage
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Connected successfully',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja la desconexión del WebSocket
   */
  async handleDisconnect(event: WebSocketEvent): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;

    console.log('[WebSocketController] ❌ Conexión cerrada:', {
      connectionId,
      timestamp: new Date().toISOString()
    });

    // Limpiar registro de conexión
    try {
      await webSocketService.unregisterConnection(connectionId);
      console.log('[WebSocketController] ✅ Conexión eliminada del registro:', connectionId);
    } catch (error) {
      console.error('[WebSocketController] ❌ Error eliminando conexión:', error);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Disconnected successfully',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja mensajes del WebSocket
   */
  async handleMessage(event: WebSocketEvent): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const body = event.body ? JSON.parse(event.body) : {};

    console.log('[WebSocketController] 📨 Mensaje recibido:', {
      connectionId,
      messageType: body.type,
      timestamp: new Date().toISOString()
    });

    // 🎯 MANEJAR DIFERENTES TIPOS DE MENSAJES
    switch (body.type) {
      case 'MONITORING_CONNECT':
        return this.handleMonitoringConnect(event, body);

      case 'PARTICIPANT_LOGIN':
        return this.handleParticipantLogin(event, body);

      case 'PARTICIPANT_STEP':
        return this.handleParticipantStep(event, body);

      case 'PARTICIPANT_DISQUALIFIED':
        return this.handleParticipantDisqualified(event, body);

      case 'PARTICIPANT_QUOTA_EXCEEDED':
        return this.handleParticipantQuotaExceeded(event, body);

      case 'PARTICIPANT_RESPONSE_SAVED':
        return this.handleParticipantResponseSaved(event, body);

      case 'PARTICIPANT_COMPLETED':
        return this.handleParticipantCompleted(event, body);

      case 'PARTICIPANT_ERROR':
        return this.handleParticipantError(event, body);

      default:
        console.log('[WebSocketController] ⚠️ Tipo de mensaje no reconocido:', body.type);
        return {
          statusCode: 200,
          headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
          body: JSON.stringify({
            message: 'Message received',
            connectionId,
            timestamp: new Date().toISOString()
          })
        };
    }
  }

  /**
   * Maneja evento de conexión de monitoreo
   */
  private async handleMonitoringConnect(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const researchId = (data.data as Record<string, unknown>)?.researchId as string;

    console.log('[WebSocketController] 🎯 MONITORING_CONNECT:', {
      connectionId,
      researchId,
      timestamp: (data.data as Record<string, unknown>)?.timestamp
    });

    // Registrar conexión para monitoreo
    if (researchId) {
      try {
        await webSocketService.registerConnection(connectionId, researchId);
        console.log('[WebSocketController] ✅ Conexión registrada para monitoreo:', {
          connectionId,
          researchId
        });
      } catch (error) {
        console.error('[WebSocketController] ❌ Error registrando conexión:', error);
      }
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Monitoring connection established',
        connectionId,
        researchId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de login de participante
   */
  private async handleParticipantLogin(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const dataPayload = data.data as Record<string, unknown>;
    const researchId = dataPayload?.researchId as string;

    console.log('[WebSocketController] 👤 PARTICIPANT_LOGIN:', {
      connectionId,
      researchId,
      participantId: dataPayload?.participantId,
      email: dataPayload?.email
    });

    // 🎯 BROADCAST AL DASHBOARD
    if (researchId && dataPayload?.participantId) {
      await this.broadcastEvent(researchId, 'PARTICIPANT_LOGIN', dataPayload.participantId as string, dataPayload);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Participant login recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de paso de participante
   */
  private async handleParticipantStep(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const dataPayload = data.data as Record<string, unknown>;
    const researchId = dataPayload?.researchId as string;

    console.log('[WebSocketController] 📊 PARTICIPANT_STEP:', {
      connectionId,
      researchId,
      participantId: dataPayload?.participantId,
      stepName: dataPayload?.stepName,
      progress: dataPayload?.progress
    });

    // 🎯 BROADCAST AL DASHBOARD
    if (researchId && dataPayload?.participantId) {
      await this.broadcastEvent(researchId, 'PARTICIPANT_STEP', dataPayload.participantId as string, dataPayload);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Participant step recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de descalificación de participante
   */
  private async handleParticipantDisqualified(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const dataPayload = data.data as Record<string, unknown>;
    const researchId = dataPayload?.researchId as string;

    console.log('[WebSocketController] 🚫 PARTICIPANT_DISQUALIFIED:', {
      connectionId,
      researchId,
      participantId: dataPayload?.participantId,
      reason: dataPayload?.reason,
      disqualificationType: dataPayload?.disqualificationType
    });

    // 🎯 BROADCAST AL DASHBOARD
    if (researchId && dataPayload?.participantId) {
      await this.broadcastEvent(researchId, 'PARTICIPANT_DISQUALIFIED', dataPayload.participantId as string, dataPayload);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Participant disqualification recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de cuota excedida
   */
  private async handleParticipantQuotaExceeded(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const dataPayload = data.data as Record<string, unknown>;
    const researchId = dataPayload?.researchId as string;

    console.log('[WebSocketController] 📈 PARTICIPANT_QUOTA_EXCEEDED:', {
      connectionId,
      researchId,
      participantId: dataPayload?.participantId,
      quotaType: dataPayload?.quotaType,
      quotaValue: dataPayload?.quotaValue
    });

    // 🎯 BROADCAST AL DASHBOARD
    if (researchId && dataPayload?.participantId) {
      await this.broadcastEvent(researchId, 'PARTICIPANT_QUOTA_EXCEEDED', dataPayload.participantId as string, dataPayload);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Participant quota exceeded recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de completación de participante
   */
  private async handleParticipantCompleted(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const dataPayload = data.data as Record<string, unknown>;
    const researchId = dataPayload?.researchId as string;

    console.log('[WebSocketController] ✅ PARTICIPANT_COMPLETED:', {
      connectionId,
      researchId,
      participantId: dataPayload?.participantId,
      totalDuration: dataPayload?.totalDuration,
      responsesCount: dataPayload?.responsesCount
    });

    // 🎯 BROADCAST AL DASHBOARD
    if (researchId && dataPayload?.participantId) {
      await this.broadcastEvent(researchId, 'PARTICIPANT_COMPLETED', dataPayload.participantId as string, dataPayload);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Participant completion recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de error de participante
   */
  private async handleParticipantError(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const dataPayload = data.data as Record<string, unknown>;
    const researchId = dataPayload?.researchId as string;

    console.log('[WebSocketController] ❌ PARTICIPANT_ERROR:', {
      connectionId,
      researchId,
      participantId: dataPayload?.participantId,
      error: dataPayload?.error,
      stepName: dataPayload?.stepName
    });

    // 🎯 BROADCAST AL DASHBOARD
    if (researchId && dataPayload?.participantId) {
      await this.broadcastEvent(researchId, 'PARTICIPANT_ERROR', dataPayload.participantId as string, dataPayload);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Participant error recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de respuesta guardada
   */
  private async handleParticipantResponseSaved(event: WebSocketEvent, data: Record<string, unknown>): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;
    const dataPayload = data.data as Record<string, unknown>;
    const researchId = dataPayload?.researchId as string;

    console.log('[WebSocketController] 💾 PARTICIPANT_RESPONSE_SAVED:', {
      connectionId,
      researchId: researchId,
      participantId: dataPayload?.participantId,
      questionKey: dataPayload?.questionKey,
      stepNumber: dataPayload?.stepNumber,
      totalSteps: dataPayload?.totalSteps,
      progress: dataPayload?.progress
    });

    // 🎯 BROADCAST AL DASHBOARD - PROGRESO EN TIEMPO REAL
    if (researchId && dataPayload?.participantId) {
      const stepData = {
        ...dataPayload,
        stepName: dataPayload.questionKey,
        stepNumber: dataPayload.stepNumber,
        totalSteps: dataPayload.totalSteps,
        progress: dataPayload.progress
      };
      await this.broadcastEvent(researchId, 'PARTICIPANT_STEP', dataPayload.participantId as string, stepData);
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        message: 'Participant response saved recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }
}

// Instancia del controlador
const controller = new WebSocketController();

/**
 * Handler principal para WebSocket
 */
export const handler = async (event: WebSocketEvent): Promise<APIGatewayProxyResult> => {
  const routeKey = event.requestContext.routeKey;

  console.log('[WebSocketHandler] 🔌 Procesando WebSocket:', {
    routeKey,
    connectionId: event.requestContext.connectionId,
    timestamp: new Date().toISOString()
  });

  try {
    switch (routeKey) {
      case '$connect':
        return controller.handleConnect(event);

      case '$disconnect':
        return controller.handleDisconnect(event);

      case '$default':
        return controller.handleMessage(event);

      default:
        console.log('[WebSocketHandler] ⚠️ Ruta no manejada:', routeKey);
        return {
          statusCode: 200,
          headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
          body: JSON.stringify({
            message: 'Route not handled',
            routeKey,
            timestamp: new Date().toISOString()
          })
        };
    }
  } catch (error) {
    console.error('[WebSocketHandler] ❌ Error procesando WebSocket:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event as unknown as import('aws-lambda').APIGatewayProxyEvent),
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { APIGatewayEventWebsocketRequestContext } from '../types/websocket';

interface WebSocketEvent extends APIGatewayProxyEvent {
  requestContext: APIGatewayEventWebsocketRequestContext;
}

export class WebSocketController {
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
      headers: getCorsHeaders(event),
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

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
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

      default:
        console.log('[WebSocketController] ⚠️ Tipo de mensaje no reconocido:', body.type);
        return {
          statusCode: 200,
          headers: getCorsHeaders(event),
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
  private async handleMonitoringConnect(event: WebSocketEvent, data: any): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;

    console.log('[WebSocketController] 🎯 MONITORING_CONNECT:', {
      connectionId,
      researchId: data.data?.researchId,
      timestamp: data.data?.timestamp
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        message: 'Monitoring connection established',
        connectionId,
        researchId: data.data?.researchId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de login de participante
   */
  private async handleParticipantLogin(event: WebSocketEvent, data: any): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;

    console.log('[WebSocketController] 👤 PARTICIPANT_LOGIN:', {
      connectionId,
      researchId: data.data?.researchId,
      participantId: data.data?.participantId,
      email: data.data?.email
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
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
  private async handleParticipantStep(event: WebSocketEvent, data: any): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;

    console.log('[WebSocketController] 📊 PARTICIPANT_STEP:', {
      connectionId,
      researchId: data.data?.researchId,
      participantId: data.data?.participantId,
      stepName: data.data?.stepName,
      progress: data.data?.progress
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
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
  private async handleParticipantDisqualified(event: WebSocketEvent, data: any): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;

    console.log('[WebSocketController] 🚫 PARTICIPANT_DISQUALIFIED:', {
      connectionId,
      researchId: data.data?.researchId,
      participantId: data.data?.participantId,
      reason: data.data?.reason,
      disqualificationType: data.data?.disqualificationType
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
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
  private async handleParticipantQuotaExceeded(event: WebSocketEvent, data: any): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;

    console.log('[WebSocketController] 📈 PARTICIPANT_QUOTA_EXCEEDED:', {
      connectionId,
      researchId: data.data?.researchId,
      participantId: data.data?.participantId,
      quotaType: data.data?.quotaType,
      quotaValue: data.data?.quotaValue
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        message: 'Participant quota exceeded recorded',
        connectionId,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Maneja evento de respuesta guardada
   */
  private async handleParticipantResponseSaved(event: WebSocketEvent, data: any): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId;

    console.log('[WebSocketController] 💾 PARTICIPANT_RESPONSE_SAVED:', {
      connectionId,
      researchId: data.data?.researchId,
      participantId: data.data?.participantId,
      questionKey: data.data?.questionKey,
      stepNumber: data.data?.stepNumber,
      totalSteps: data.data?.totalSteps,
      progress: data.data?.progress
    });

    // 🎯 AQUÍ PODRÍAS AGREGAR LÓGICA PARA NOTIFICAR AL DASHBOARD
    // Por ejemplo, enviar el evento a otros clientes conectados al mismo researchId

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
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
          headers: getCorsHeaders(event),
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
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};

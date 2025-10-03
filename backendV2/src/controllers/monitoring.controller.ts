import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { structuredLog } from '../utils/logging.util';
import { webSocketService } from '../services/websocket.service';
import { uuidv4 } from '../utils/id-generator';
import { getCorsHeaders } from '../middlewares/cors';


// Tipo para datos demográficos
interface DemographicData {
  age?: string;
  gender?: string;
  country?: string;
  educationLevel?: string;
  householdIncome?: string;
  employmentStatus?: string;
  [key: string]: string | number | boolean | undefined;
}

// Union type para todos los eventos posibles
type MonitoringEvent =
  | ParticipantLoginEvent
  | ParticipantStepEvent
  | ParticipantDisqualifiedEvent
  | ParticipantQuotaExceededEvent
  | ParticipantCompletedEvent
  | { type: string; data: Record<string, string | number | boolean | DemographicData | undefined> };

interface ParticipantLoginEvent {
  type: 'PARTICIPANT_LOGIN';
  data: {
    researchId: string;
    participantId: string;
    email: string;
    userAgent?: string;
    ipAddress?: string;
    timestamp: string;
  };
}

interface ParticipantStepEvent {
  type: 'PARTICIPANT_STEP';
  data: {
    researchId: string;
    participantId: string;
    stepName: string;
    stepNumber: number;
    totalSteps: number;
    progress: number;
    duration: number;
    timestamp: string;
  };
}

interface ParticipantDisqualifiedEvent {
  type: 'PARTICIPANT_DISQUALIFIED';
  data: {
    researchId: string;
    participantId: string;
    reason: string;
    disqualificationType: string;
    demographicData?: DemographicData;
    timestamp: string;
  };
}

interface ParticipantQuotaExceededEvent {
  type: 'PARTICIPANT_QUOTA_EXCEEDED';
  data: {
    researchId: string;
    participantId: string;
    quotaType: string;
    quotaValue: string;
    currentCount: number;
    maxQuota: number;
    demographicData?: DemographicData;
    timestamp: string;
  };
}

interface ParticipantCompletedEvent {
  type: 'PARTICIPANT_COMPLETED';
  data: {
    researchId: string;
    participantId: string;
    totalDuration: number;
    responsesCount: number;
    timestamp: string;
  };
}

interface ParticipantErrorEvent {
  type: 'PARTICIPANT_ERROR';
  data: {
    researchId: string;
    participantId: string;
    error: string;
    stepName?: string;
    timestamp: string;
  };
}

interface ParticipantResponseSavedEvent {
  type: 'PARTICIPANT_RESPONSE_SAVED';
  data: {
    researchId: string;
    participantId: string;
    timestamp: string;
  };
}

/**
 * Controlador para manejar eventos de monitoreo en tiempo real
 */
export class MonitoringController {
  private readonly controllerName = 'MonitoringController';
  private readonly dynamoClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioxv2-backend-table-dev';
  }

  /**
   * Maneja eventos de monitoreo desde public-tests
   */
  async handleMonitoringEvent(
    event: APIGatewayProxyEvent,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    const contextName = 'handleMonitoringEvent';

    try {
      const body = JSON.parse(event.body || '{}');
      const monitoringEvent: MonitoringEvent = body;

      // Type guard para verificar si el evento tiene participantId
      const hasParticipantId = (event: MonitoringEvent): event is ParticipantLoginEvent | ParticipantStepEvent | ParticipantDisqualifiedEvent | ParticipantQuotaExceededEvent | ParticipantCompletedEvent | ParticipantErrorEvent | ParticipantResponseSavedEvent => {
        return 'participantId' in event.data;
      };

      structuredLog('info', `${this.controllerName}.${contextName}`, 'Evento de monitoreo recibido', {
        eventType: monitoringEvent.type,
        researchId: monitoringEvent.data.researchId,
        participantId: hasParticipantId(monitoringEvent) ? monitoringEvent.data.participantId : undefined
      });

      // 🎯 PROCESAR EVENTO SEGÚN TIPO
      switch (monitoringEvent.type) {
        case 'PARTICIPANT_LOGIN':
          await this.handleParticipantLogin(monitoringEvent.data as ParticipantLoginEvent['data']);
          break;
        case 'PARTICIPANT_STEP':
          await this.handleParticipantStep(monitoringEvent.data as ParticipantStepEvent['data']);
          break;
        case 'PARTICIPANT_DISQUALIFIED':
          await this.handleParticipantDisqualified(monitoringEvent.data as ParticipantDisqualifiedEvent['data']);
          break;
        case 'PARTICIPANT_QUOTA_EXCEEDED':
          await this.handleParticipantQuotaExceeded(monitoringEvent.data as ParticipantQuotaExceededEvent['data']);
          break;
        case 'PARTICIPANT_COMPLETED':
          await this.handleParticipantCompleted(monitoringEvent.data as ParticipantCompletedEvent['data']);
          break;
        case 'PARTICIPANT_ERROR':
          await this.handleParticipantError(monitoringEvent.data as ParticipantErrorEvent['data']);
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
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Evento procesado correctamente'
        })
      };

    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.${contextName}`, 'Error procesando evento de monitoreo', { error });
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
   * Maneja login de participante
   */
  private async handleParticipantLogin(data: ParticipantLoginEvent['data']): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantLogin`, 'Participante inició sesión', {
      researchId: data.researchId,
      participantId: data.participantId,
      email: data.email
    });

    // 🎯 GUARDAR EN DYNAMODB PARA HISTORIAL
    try {
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          id: uuidv4(),
          sk: 'MONITORING_EVENT',
          eventType: 'PARTICIPANT_LOGIN',
          researchId: data.researchId,
          participantId: data.participantId,
          email: data.email,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          timestamp: data.timestamp,
          createdAt: new Date().toISOString()
        }
      }));
      
      structuredLog('info', `${this.controllerName}.handleParticipantLogin`, 'Evento guardado en DynamoDB', {
        researchId: data.researchId,
        participantId: data.participantId
      });
    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.handleParticipantLogin`, 'Error guardando en DynamoDB', {
        error,
        researchId: data.researchId,
        participantId: data.participantId
      });
    }
  }

  /**
   * Maneja progreso de step
   */
  private async handleParticipantStep(data: ParticipantStepEvent['data']): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantStep`, 'Participante avanzó de step', {
      researchId: data.researchId,
      participantId: data.participantId,
      stepName: data.stepName,
      progress: data.progress
    });

    // 🎯 ACTUALIZAR PROGRESO EN DYNAMODB
    try {
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          id: uuidv4(),
          sk: 'MONITORING_EVENT',
          eventType: 'PARTICIPANT_STEP',
          researchId: data.researchId,
          participantId: data.participantId,
          stepName: data.stepName,
          stepNumber: data.stepNumber,
          totalSteps: data.totalSteps,
          progress: data.progress,
          duration: data.duration,
          timestamp: data.timestamp,
          createdAt: new Date().toISOString()
        }
      }));
      
      structuredLog('info', `${this.controllerName}.handleParticipantStep`, 'Progreso guardado en DynamoDB', {
        researchId: data.researchId,
        participantId: data.participantId,
        stepName: data.stepName,
        progress: data.progress
      });
    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.handleParticipantStep`, 'Error guardando progreso en DynamoDB', {
        error,
        researchId: data.researchId,
        participantId: data.participantId,
        stepName: data.stepName
      });
    }
  }

  /**
   * Maneja descalificación de participante
   */
  private async handleParticipantDisqualified(data: ParticipantDisqualifiedEvent['data']): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantDisqualified`, 'Participante descalificado', {
      researchId: data.researchId,
      participantId: data.participantId,
      reason: data.reason,
      disqualificationType: data.disqualificationType
    });

    // 🎯 GUARDAR DESCALIFICACIÓN EN DYNAMODB
    try {
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          id: uuidv4(),
          sk: 'MONITORING_EVENT',
          eventType: 'PARTICIPANT_DISQUALIFIED',
          researchId: data.researchId,
          participantId: data.participantId,
          reason: data.reason,
          disqualificationType: data.disqualificationType,
          demographicData: data.demographicData,
          timestamp: data.timestamp,
          createdAt: new Date().toISOString()
        }
      }));
      
      structuredLog('info', `${this.controllerName}.handleParticipantDisqualified`, 'Descalificación guardada en DynamoDB', {
        researchId: data.researchId,
        participantId: data.participantId,
        reason: data.reason
      });
    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.handleParticipantDisqualified`, 'Error guardando descalificación en DynamoDB', {
        error,
        researchId: data.researchId,
        participantId: data.participantId,
        reason: data.reason
      });
    }
  }

  /**
   * Maneja exceso de cuota
   */
  private async handleParticipantQuotaExceeded(data: ParticipantQuotaExceededEvent['data']): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantQuotaExceeded`, 'Participante excedió cuota', {
      researchId: data.researchId,
      participantId: data.participantId,
      quotaType: data.quotaType,
      quotaValue: data.quotaValue,
      currentCount: data.currentCount,
      maxQuota: data.maxQuota
    });

    // 🎯 GUARDAR EXCESO DE CUOTA EN DYNAMODB
    try {
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          id: uuidv4(),
          sk: 'MONITORING_EVENT',
          eventType: 'PARTICIPANT_QUOTA_EXCEEDED',
          researchId: data.researchId,
          participantId: data.participantId,
          quotaType: data.quotaType,
          quotaValue: data.quotaValue,
          currentCount: data.currentCount,
          maxQuota: data.maxQuota,
          demographicData: data.demographicData,
          timestamp: data.timestamp,
          createdAt: new Date().toISOString()
        }
      }));
      
      structuredLog('info', `${this.controllerName}.handleParticipantQuotaExceeded`, 'Exceso de cuota guardado en DynamoDB', {
        researchId: data.researchId,
        participantId: data.participantId,
        quotaType: data.quotaType,
        maxQuota: data.maxQuota
      });
    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.handleParticipantQuotaExceeded`, 'Error guardando exceso de cuota en DynamoDB', {
        error,
        researchId: data.researchId,
        participantId: data.participantId,
        quotaType: data.quotaType
      });
    }
  }

  /**
   * Maneja completación de participante
   */
  private async handleParticipantCompleted(data: ParticipantCompletedEvent['data']): Promise<void> {
    structuredLog('info', `${this.controllerName}.handleParticipantCompleted`, 'Participante completó investigación', {
      researchId: data.researchId,
      participantId: data.participantId,
      totalDuration: data.totalDuration,
      responsesCount: data.responsesCount
    });

    // 🎯 GUARDAR COMPLETACIÓN EN DYNAMODB
    try {
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          id: uuidv4(),
          sk: 'MONITORING_EVENT',
          eventType: 'PARTICIPANT_COMPLETED',
          researchId: data.researchId,
          participantId: data.participantId,
          totalDuration: data.totalDuration,
          responsesCount: data.responsesCount,
          timestamp: data.timestamp,
          createdAt: new Date().toISOString()
        }
      }));
      
      structuredLog('info', `${this.controllerName}.handleParticipantCompleted`, 'Completación guardada en DynamoDB', {
        researchId: data.researchId,
        participantId: data.participantId,
        totalDuration: data.totalDuration
      });
    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.handleParticipantCompleted`, 'Error guardando completación en DynamoDB', {
        error,
        researchId: data.researchId,
        participantId: data.participantId
      });
    }
  }

  /**
   * Maneja error de participante
   */
  private async handleParticipantError(data: ParticipantErrorEvent['data']): Promise<void> {
    structuredLog('error', `${this.controllerName}.handleParticipantError`, 'Error de participante', {
      researchId: data.researchId,
      participantId: data.participantId,
      error: data.error,
      stepName: data.stepName
    });

    // 🎯 GUARDAR ERROR EN DYNAMODB
    try {
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          id: uuidv4(),
          sk: 'MONITORING_EVENT',
          eventType: 'PARTICIPANT_ERROR',
          researchId: data.researchId,
          participantId: data.participantId,
          error: data.error,
          stepName: data.stepName,
          timestamp: data.timestamp,
          createdAt: new Date().toISOString()
        }
      }));
      
      structuredLog('info', `${this.controllerName}.handleParticipantError`, 'Error guardado en DynamoDB', {
        researchId: data.researchId,
        participantId: data.participantId,
        stepName: data.stepName
      });
    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.handleParticipantError`, 'Error guardando error en DynamoDB', {
        error,
        researchId: data.researchId,
        participantId: data.participantId,
        originalError: data.error
      });
    }
  }

  /**
   * Broadcast evento a todos los dashboards conectados
   */
  private async broadcastToDashboard(event: MonitoringEvent): Promise<void> {
    try {
      // 🎯 OBTENER CONEXIONES ACTIVAS PARA LA INVESTIGACIÓN
      const researchId = event.data?.researchId;
      if (!researchId || typeof researchId !== 'string') {
        structuredLog('warn', `${this.controllerName}.broadcastToDashboard`, 'No hay researchId en evento');
        return;
      }

      // 🎯 BROADCAST A TODAS LAS CONEXIONES DE LA INVESTIGACIÓN
      const successfulBroadcasts = await webSocketService.broadcastToResearch(researchId, event);
      
      const eventHasParticipantId = (evt: MonitoringEvent): evt is ParticipantLoginEvent | ParticipantStepEvent | ParticipantDisqualifiedEvent | ParticipantQuotaExceededEvent | ParticipantCompletedEvent | ParticipantErrorEvent | ParticipantResponseSavedEvent => {
        return 'participantId' in evt.data;
      };

      structuredLog('info', `${this.controllerName}.broadcastToDashboard`, 'Evento broadcast completado', {
        eventType: event.type,
        researchId,
        participantId: eventHasParticipantId(event) ? event.data.participantId : undefined,
        successfulBroadcasts
      });

    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.broadcastToDashboard`, 'Error en broadcast', { error });
    }
  }

  /**
   * Suscribe dashboard a eventos de investigación
   */
  async subscribeToResearch(
    event: APIGatewayProxyEvent,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    const contextName = 'subscribeToResearch';

    try {
      const body = JSON.parse(event.body || '{}');
      const { researchId } = body;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'researchId es requerido'
          })
        };
      }

      const connectionId = event.requestContext.connectionId;

      structuredLog('info', `${this.controllerName}.${contextName}`, 'Dashboard suscrito a investigación', {
        researchId,
        connectionId
      });

      // 🎯 GUARDAR SUSCRIPCIÓN EN DYNAMODB
      try {
        await this.dynamoClient.send(new PutCommand({
          TableName: this.tableName,
          Item: {
            id: uuidv4(),
            sk: 'WEBSOCKET_SUBSCRIPTION',
            connectionId,
            researchId,
            subscriptionType: 'DASHBOARD_MONITORING',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // TTL de 24 horas
          }
        }));

        structuredLog('info', `${this.controllerName}.${contextName}`, 'Suscripción guardada en DynamoDB', {
          researchId,
          connectionId
        });
      } catch (error: unknown) {
        structuredLog('error', `${this.controllerName}.${contextName}`, 'Error guardando suscripción en DynamoDB', {
          error,
          researchId,
          connectionId
        });
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Suscrito correctamente'
        })
      };

    } catch (error: unknown) {
      structuredLog('error', `${this.controllerName}.${contextName}`, 'Error en suscripción', { error });
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
}
// Instancia del controlador
const monitoringController = new MonitoringController();

/**
 * Handler principal para eventos de monitoreo
 */
export const mainHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Enrutar según el path
    const path = event.path.toLowerCase();

    if (path === '/monitoring/events' && event.httpMethod === 'POST') {
      return monitoringController.handleMonitoringEvent(event, context);
    } else if (path === '/monitoring/subscribe' && event.httpMethod === 'POST') {
      return monitoringController.subscribeToResearch(event, context);
    }

    // Ruta no encontrada
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Recurso no encontrado' })
    };
  } catch (error: unknown) {
    structuredLog('error', 'MonitoringHandler', 'Error en monitoringHandler', { error });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};

export const handler = mainHandler;

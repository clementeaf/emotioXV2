import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { structuredLog } from '../utils/logging.util';

// Local MonitoringEvent interface to avoid import issues
interface MonitoringEvent {
  type: string;
  data: any;
}

/**
 * Interfaz para conexión WebSocket activa
 */
interface WebSocketConnection {
  connectionId: string;
  researchId: string;
  connectedAt: string;
  lastActivity: string;
  ttl: number; // TTL para limpiar conexiones obsoletas
}

/**
 * Servicio para gestionar conexiones WebSocket y broadcasting
 */
export class WebSocketService {
  private readonly dynamoClient: DynamoDBDocumentClient;
  private readonly apiGatewayClient: ApiGatewayManagementApiClient;
  private readonly tableName: string;
  private readonly serviceName = 'WebSocketService';

  constructor() {
    // DynamoDB setup
    const region = process.env.APP_REGION || 'us-east-1';
    const dynamoDbClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoDbClient);
    this.tableName = process.env.DYNAMODB_TABLE!;

    // API Gateway Management API setup
    const apiGatewayEndpoint = process.env.WEBSOCKET_API_ENDPOINT;
    if (!apiGatewayEndpoint) {
      throw new Error('WEBSOCKET_API_ENDPOINT environment variable is required');
    }

    this.apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: apiGatewayEndpoint,
      region
    });
  }

  /**
   * Registra una conexión WebSocket para monitoreo de una investigación
   */
  async registerConnection(connectionId: string, researchId: string): Promise<void> {
    const context = 'registerConnection';
    try {
      const now = new Date().toISOString();
      const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 horas TTL

      // const connection: WebSocketConnection = {
      //   connectionId,
      //   researchId,
      //   connectedAt: now,
      //   lastActivity: now,
      //   ttl
      // };

      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          id: `WS_CONN_${connectionId}`,
          sk: `RESEARCH_${researchId}`,
          connectionId,
          researchId,
          connectedAt: now,
          lastActivity: now,
          ttl
        }
      }));

      structuredLog('info', `${this.serviceName}.${context}`, 'Conexión WebSocket registrada', {
        connectionId,
        researchId
      });
    } catch (error) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error registrando conexión', {
        connectionId,
        researchId,
        error
      });
      throw error;
    }
  }

  /**
   * Elimina una conexión WebSocket
   */
  async unregisterConnection(connectionId: string): Promise<void> {
    const context = 'unregisterConnection';
    try {
      // Primero buscar la conexión para obtener el researchId
      const connections = await this.getConnectionsByConnectionId(connectionId);
      
      for (const connection of connections) {
        await this.dynamoClient.send(new DeleteCommand({
          TableName: this.tableName,
          Key: {
            id: `WS_CONN_${connectionId}`,
            sk: `RESEARCH_${connection.researchId}`
          }
        }));
      }

      structuredLog('info', `${this.serviceName}.${context}`, 'Conexión WebSocket eliminada', {
        connectionId
      });
    } catch (error) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error eliminando conexión', {
        connectionId,
        error
      });
      throw error;
    }
  }

  /**
   * Obtiene todas las conexiones activas para una investigación
   */
  async getConnectionsForResearch(researchId: string): Promise<WebSocketConnection[]> {
    const context = 'getConnectionsForResearch';
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'researchId-index',
        KeyConditionExpression: 'researchId = :researchId',
        FilterExpression: 'begins_with(id, :prefix)',
        ExpressionAttributeValues: {
          ':researchId': researchId,
          ':prefix': 'WS_CONN_'
        }
      }));

      const connections: WebSocketConnection[] = (result.Items || []).map(item => ({
        connectionId: item.connectionId,
        researchId: item.researchId,
        connectedAt: item.connectedAt,
        lastActivity: item.lastActivity,
        ttl: item.ttl
      }));

      structuredLog('debug', `${this.serviceName}.${context}`, 'Conexiones encontradas', {
        researchId,
        count: connections.length
      });

      return connections;
    } catch (error) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error obteniendo conexiones', {
        researchId,
        error
      });
      return [];
    }
  }

  /**
   * Busca conexiones por connectionId
   */
  private async getConnectionsByConnectionId(connectionId: string): Promise<WebSocketConnection[]> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': `WS_CONN_${connectionId}`
        }
      }));

      return (result.Items || []).map(item => ({
        connectionId: item.connectionId,
        researchId: item.researchId,
        connectedAt: item.connectedAt,
        lastActivity: item.lastActivity,
        ttl: item.ttl
      }));
    } catch (error) {
      structuredLog('error', `${this.serviceName}.getConnectionsByConnectionId`, 'Error buscando conexiones', {
        connectionId,
        error
      });
      return [];
    }
  }

  /**
   * Envía mensaje a una conexión específica
   */
  async sendMessageToConnection(connectionId: string, message: any): Promise<boolean> {
    const context = 'sendMessageToConnection';
    try {
      await this.apiGatewayClient.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(message)
      }));

      structuredLog('debug', `${this.serviceName}.${context}`, 'Mensaje enviado', {
        connectionId,
        messageType: message.type
      });

      return true;
    } catch (error: any) {
      // Si la conexión ya no existe, eliminarla de la base de datos
      if (error.statusCode === 410) {
        structuredLog('info', `${this.serviceName}.${context}`, 'Conexión obsoleta, eliminando', {
          connectionId
        });
        await this.unregisterConnection(connectionId);
      } else {
        structuredLog('error', `${this.serviceName}.${context}`, 'Error enviando mensaje', {
          connectionId,
          error: error.message
        });
      }
      return false;
    }
  }

  /**
   * Broadcast evento a todas las conexiones de una investigación
   */
  async broadcastToResearch(researchId: string, event: MonitoringEvent): Promise<number> {
    const context = 'broadcastToResearch';
    try {
      const connections = await this.getConnectionsForResearch(researchId);
      
      if (connections.length === 0) {
        structuredLog('info', `${this.serviceName}.${context}`, 'No hay conexiones para broadcast', {
          researchId,
          eventType: event.type
        });
        return 0;
      }

      let successCount = 0;
      
      // Enviar mensaje a todas las conexiones en paralelo
      const sendPromises = connections.map(async (connection) => {
        const success = await this.sendMessageToConnection(connection.connectionId, event);
        if (success) successCount++;
      });

      await Promise.all(sendPromises);

      structuredLog('info', `${this.serviceName}.${context}`, 'Broadcast completado', {
        researchId,
        eventType: event.type,
        totalConnections: connections.length,
        successfulSends: successCount
      });

      return successCount;
    } catch (error) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error en broadcast', {
        researchId,
        eventType: event.type,
        error
      });
      return 0;
    }
  }

  /**
   * Actualiza la actividad de una conexión
   */
  async updateConnectionActivity(connectionId: string): Promise<void> {
    const context = 'updateConnectionActivity';
    try {
      const connections = await this.getConnectionsByConnectionId(connectionId);
      
      for (const connection of connections) {
        await this.dynamoClient.send(new PutCommand({
          TableName: this.tableName,
          Item: {
            id: `WS_CONN_${connectionId}`,
            sk: `RESEARCH_${connection.researchId}`,
            connectionId,
            researchId: connection.researchId,
            connectedAt: connection.connectedAt,
            lastActivity: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Renovar TTL
          }
        }));
      }
    } catch (error) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error actualizando actividad', {
        connectionId,
        error
      });
    }
  }
}

export const webSocketService = new WebSocketService();
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';

export interface WebSocketMessage {
  action: string;
  data: any;
}

export interface Connection {
  connectionId: string;
  userId: string;
  createdAt: number;
}

export class ConnectionModel {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocument;
  private apiGateway: ApiGatewayManagementApi | null = null;

  constructor() {
    this.tableName = process.env.CONNECTIONS_TABLE || '';
    
    const client = new DynamoDB({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.docClient = DynamoDBDocument.from(client);
  }

  // Inicializar el cliente de API Gateway con el endpoint correcto
  initApiGateway(endpoint: string): void {
    this.apiGateway = new ApiGatewayManagementApi({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async create(connectionId: string, userId: string): Promise<Connection> {
    const connection: Connection = {
      connectionId,
      userId,
      createdAt: Date.now(),
    };

    await this.docClient.put({
      TableName: this.tableName,
      Item: connection,
    });

    return connection;
  }

  async findByConnectionId(connectionId: string): Promise<Connection | null> {
    const result = await this.docClient.get({
      TableName: this.tableName,
      Key: { connectionId }
    });

    if (!result.Item) {
      return null;
    }

    return result.Item as Connection;
  }

  async findByUserId(userId: string): Promise<Connection[]> {
    const result = await this.docClient.query({
      TableName: this.tableName,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items as Connection[];
  }

  async delete(connectionId: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.tableName,
      Key: { connectionId },
    });
  }

  async sendMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    if (!this.apiGateway) {
      throw new Error('API Gateway client not initialized. Call initApiGateway first.');
    }

    try {
      await this.apiGateway.postToConnection({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(message)),
      });
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Si la conexión ya no existe, la eliminamos
        await this.delete(connectionId);
      } else {
        throw error;
      }
    }
  }

  async broadcastToUser(userId: string, message: WebSocketMessage): Promise<void> {
    if (!this.apiGateway) {
      throw new Error('API Gateway client not initialized. Call initApiGateway first.');
    }

    const connections = await this.findByUserId(userId);
    
    // Si no hay conexiones, no hacer nada
    if (connections.length === 0) {
      return;
    }

    // Enviar mensaje a todas las conexiones del usuario
    const sendPromises = connections.map(connection =>
      this.sendMessage(connection.connectionId, message).catch(error => {
        console.error(`Error al enviar mensaje a ${connection.connectionId}:`, error);
      })
    );
    
    await Promise.all(sendPromises);
  }
}

// Singleton para reutilizar en toda la aplicación
export const connectionModel = new ConnectionModel(); 
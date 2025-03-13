import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import { WebSocketMessage } from '../../../shared/src/types/websocket.types';

export interface Connection {
  connectionId: string;
  userId: string;
  createdAt: number;
}

export class ConnectionModel {
  private readonly tableName: string;
  private readonly dynamoDB: DynamoDB;
  private readonly apiGateway: ApiGatewayManagementApi;

  constructor(endpoint?: string) {
    this.tableName = process.env.CONNECTIONS_TABLE || '';
    
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
    };
    
    this.dynamoDB = new DynamoDB(config);

    if (endpoint) {
      this.apiGateway = new ApiGatewayManagementApi({
        endpoint,
        region: process.env.AWS_REGION || 'us-east-1',
      });
    }
  }

  // Convert DynamoDB item to Connection
  private fromDynamoDB(item: Record<string, any>): Connection {
    return {
      connectionId: item.connectionId.S!,
      userId: item.userId.S!,
      createdAt: Number(item.createdAt.N!),
    };
  }

  // Convert Connection to DynamoDB item
  private toDynamoDB(connection: Connection): Record<string, any> {
    return {
      connectionId: { S: connection.connectionId },
      userId: { S: connection.userId },
      createdAt: { N: connection.createdAt.toString() },
    };
  }

  async create(connectionId: string, userId: string): Promise<Connection> {
    const connection: Connection = {
      connectionId,
      userId,
      createdAt: Date.now(),
    };

    await this.dynamoDB.putItem({
      TableName: this.tableName,
      Item: this.toDynamoDB(connection),
    });

    return connection;
  }

  async delete(connectionId: string): Promise<void> {
    await this.dynamoDB.deleteItem({
      TableName: this.tableName,
      Key: {
        connectionId: { S: connectionId },
      },
    });
  }

  async getByUserId(userId: string): Promise<Connection[]> {
    const result = await this.dynamoDB.query({
      TableName: this.tableName,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
      },
    });

    if (!result.Items) {
      return [];
    }

    return result.Items.map(item => this.fromDynamoDB(item));
  }

  async sendMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
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
    const connections = await this.getByUserId(userId);
    await Promise.all(
      connections.map(connection =>
        this.sendMessage(connection.connectionId, message).catch(error => {
          console.error(`Error al enviar mensaje a ${connection.connectionId}:`, error);
        })
      )
    );
  }
}

export const connectionModel = new ConnectionModel(); 
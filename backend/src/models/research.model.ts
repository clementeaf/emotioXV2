import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export type ResearchStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ResearchType = 'EYE_TRACKING' | 'ATTENTION_PREDICTION' | 'COGNITIVE_ANALYSIS';
export type ResearchTechnique = 'aim-framework' | 'eye-tracking' | 'cognitive-tasks';

export interface Research {
  id: string;
  userId: string;
  name: string;
  type: ResearchType;
  technique: ResearchTechnique;
  description: string;
  enterprise: string;
  status: ResearchStatus;
  progress: number;
  targetParticipants?: number;
  currentParticipants?: number;
  createdAt: number;
  updatedAt: number;
}

export class ResearchModel {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocument;

  constructor() {
    this.tableName = process.env.RESEARCH_TABLE || '';
    
    const client = new DynamoDB({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.docClient = DynamoDBDocument.from(client);
  }

  async create(data: Omit<Research, 'id' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<Research> {
    const now = Date.now();
    const id = uuidv4();

    const research: Research = {
      id,
      ...data,
      status: 'draft',
      progress: 0,
      createdAt: now,
      updatedAt: now
    };

    await this.docClient.put({
      TableName: this.tableName,
      Item: research
    });

    return research;
  }

  async findById(id: string): Promise<Research | null> {
    const result = await this.docClient.get({
      TableName: this.tableName,
      Key: { id }
    });

    if (!result.Item) {
      return null;
    }

    return result.Item as Research;
  }

  async findByUserId(userId: string): Promise<Research[]> {
    const result = await this.docClient.query({
      TableName: this.tableName,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items as Research[];
  }

  async update(id: string, data: Partial<Research>): Promise<Research> {
    const research = await this.findById(id);
    if (!research) {
      throw new Error('Research not found');
    }

    // Construir expresiones de actualización dinámicamente
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Actualizar solo los campos proporcionados
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Siempre actualizar updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = Date.now();

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    const result = await this.docClient.update({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    if (!result.Attributes) {
      throw new Error('Failed to update research');
    }

    return result.Attributes as Research;
  }

  async updateStatus(id: string, status: ResearchStatus): Promise<Research> {
    return this.update(id, { status });
  }

  async updateProgress(id: string, progress: number): Promise<Research> {
    return this.update(id, { progress });
  }

  async delete(id: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.tableName,
      Key: { id }
    });
  }
}

// Singleton para reutilizar en toda la aplicación
export const researchModel = new ResearchModel(); 
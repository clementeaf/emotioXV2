import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export interface FormResponseItem {
  questionId: string;
  answer: any;
}

export interface FormResponse {
  id: string;
  formId: string;
  researchId: string;
  responses: FormResponseItem[];
  respondentInfo?: {
    email?: string;
    name?: string;
    [key: string]: any;
  };
  createdAt: number;
  updatedAt: number;
}

export class FormResponseModel {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocument;

  constructor() {
    this.tableName = process.env.FORM_RESPONSES_TABLE || 'FormResponses';
    
    const client = new DynamoDB({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.IS_OFFLINE && {
        endpoint: 'http://localhost:8000',
        credentials: {
          accessKeyId: 'DEFAULT_ACCESS_KEY',
          secretAccessKey: 'DEFAULT_SECRET'
        }
      })
    });
    
    this.docClient = DynamoDBDocument.from(client);
  }

  async create(data: Omit<FormResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<FormResponse> {
    const now = Date.now();
    const id = uuidv4();

    const formResponse: FormResponse = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await this.docClient.put({
      TableName: this.tableName,
      Item: formResponse
    });

    return formResponse;
  }

  async findById(id: string): Promise<FormResponse | null> {
    const result = await this.docClient.get({
      TableName: this.tableName,
      Key: { id }
    });

    return result.Item as FormResponse || null;
  }

  async findByFormId(formId: string): Promise<FormResponse[]> {
    const result = await this.docClient.query({
      TableName: this.tableName,
      IndexName: 'FormIdIndex',
      KeyConditionExpression: 'formId = :formId',
      ExpressionAttributeValues: {
        ':formId': formId
      }
    });

    return result.Items as FormResponse[] || [];
  }

  async findByResearchId(researchId: string): Promise<FormResponse[]> {
    const result = await this.docClient.query({
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex',
      KeyConditionExpression: 'researchId = :researchId',
      ExpressionAttributeValues: {
        ':researchId': researchId
      }
    });

    return result.Items as FormResponse[] || [];
  }

  async delete(id: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.tableName,
      Key: { id }
    });
  }
}

// Singleton para reutilizar en toda la aplicación
export const formResponseModel = new FormResponseModel(); 
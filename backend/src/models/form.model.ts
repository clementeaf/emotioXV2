import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export type FormType = 'welcome' | 'cognitive' | 'eye-tracking' | 'thank-you';

export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  value?: any;
}

export interface Form {
  id: string;
  researchId: string;
  userId: string;
  type: FormType;
  title: string;
  description?: string;
  fields: FormField[];
  isEnabled: boolean;
  order: number;
  isPublished?: boolean;
  createdAt: number;
  updatedAt: number;
}

export class FormModel {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocument;

  constructor() {
    this.tableName = process.env.FORMS_TABLE || '';
    
    const client = new DynamoDB({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.docClient = DynamoDBDocument.from(client);
  }

  async create(data: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>): Promise<Form> {
    const now = Date.now();
    const id = uuidv4();

    const form: Form = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await this.docClient.put({
      TableName: this.tableName,
      Item: form
    });

    return form;
  }

  async findById(id: string): Promise<Form | null> {
    const result = await this.docClient.get({
      TableName: this.tableName,
      Key: { id }
    });

    if (!result.Item) {
      return null;
    }

    return result.Item as Form;
  }

  async findByResearchId(researchId: string): Promise<Form[]> {
    const result = await this.docClient.query({
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex',
      KeyConditionExpression: 'researchId = :researchId',
      ExpressionAttributeValues: {
        ':researchId': researchId
      }
    });

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items as Form[];
  }

  async update(id: string, data: Partial<Form>): Promise<Form> {
    const form = await this.findById(id);
    if (!form) {
      throw new Error('Form not found');
    }

    // Construir expresiones de actualización dinámicamente
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Actualizar solo los campos proporcionados
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'researchId' && key !== 'userId' && key !== 'createdAt') {
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
      throw new Error('Failed to update form');
    }

    return result.Attributes as Form;
  }

  async delete(id: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.tableName,
      Key: { id }
    });
  }

  async deleteByResearchId(researchId: string): Promise<void> {
    const forms = await this.findByResearchId(researchId);
    
    // Si no hay formularios, no hacer nada
    if (forms.length === 0) {
      return;
    }

    // Eliminar todos los formularios asociados a la investigación
    const deletePromises = forms.map(form => this.delete(form.id));
    await Promise.all(deletePromises);
  }
}

// Singleton para reutilizar en toda la aplicación
export const formModel = new FormModel(); 
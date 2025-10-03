import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { generateUniqueId } from '../utils/id-generator';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

export interface EducationalContent {
  id: string;
  contentType: 'smart_voc' | 'cognitive_task';
  title: string;
  generalDescription: string;
  typeExplanation: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateEducationalContentRequest {
  contentType: 'smart_voc' | 'cognitive_task';
  title: string;
  generalDescription: string;
  typeExplanation: string;
  userId: string;
}

export interface UpdateEducationalContentRequest {
  title?: string;
  generalDescription?: string;
  typeExplanation?: string;
}

export class EducationalContentModel {
  private static tableName = process.env.EDUCATIONAL_CONTENT_TABLE || 'EducationalContent';

  static async create(data: CreateEducationalContentRequest): Promise<EducationalContent> {
    const now = new Date().toISOString();
    const educationalContent: EducationalContent = {
      id: generateUniqueId(),
      contentType: data.contentType,
      title: data.title,
      generalDescription: data.generalDescription,
      typeExplanation: data.typeExplanation,
      createdAt: now,
      updatedAt: now,
      userId: data.userId,
    };

    await dynamodb.send(new PutCommand({
      TableName: this.tableName,
      Item: educationalContent,
    }));

    return educationalContent;
  }

  static async getByUserIdAndType(userId: string, contentType: 'smart_voc' | 'cognitive_task'): Promise<EducationalContent | null> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserContentTypeIndex',
      KeyConditionExpression: 'userId = :userId AND contentType = :contentType',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':contentType': contentType,
      },
    }));

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as EducationalContent;
    }

    return null;
  }

  static async getById(id: string): Promise<EducationalContent | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: this.tableName,
      Key: { id },
    }));

    return result.Item as EducationalContent || null;
  }

  static async update(id: string, updates: UpdateEducationalContentRequest): Promise<EducationalContent | null> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, string | number | boolean | null> = {};

    if (updates.title !== undefined) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = updates.title;
    }

    if (updates.generalDescription !== undefined) {
      updateExpression.push('generalDescription = :generalDescription');
      expressionAttributeValues[':generalDescription'] = updates.generalDescription;
    }

    if (updates.typeExplanation !== undefined) {
      updateExpression.push('typeExplanation = :typeExplanation');
      expressionAttributeValues[':typeExplanation'] = updates.typeExplanation;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpression.length === 1) {
      // Solo updatedAt, no hay cambios reales
      return this.getById(id);
    }

    const result = await dynamodb.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as EducationalContent || null;
  }

  static async delete(id: string): Promise<void> {
    await dynamodb.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    }));
  }

  static async getAllByUserId(userId: string): Promise<EducationalContent[]> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));

    return (result.Items || []) as EducationalContent[];
  }

  static async getDefaultContent(contentType: 'smart_voc' | 'cognitive_task'): Promise<Partial<EducationalContent>> {
    const defaultContents = {
      smart_voc: {
        title: 'SmartVOC - Voice of Customer',
        generalDescription: 'SmartVOC es un sistema de recolección de feedback que combina diferentes tipos de preguntas para obtener insights completos sobre la experiencia del cliente.',
        typeExplanation: `Cada tipo de pregunta tiene un propósito específico:
• CSAT: Mide satisfacción general
• NPS: Evalúa lealtad y recomendación
• CES: Mide facilidad de uso
• CV: Captura valor percibido
• NEV: Analiza valor emocional
• VOC: Recolecta comentarios abiertos`,
      },
      cognitive_task: {
        title: 'Tareas Cognitivas',
        generalDescription: 'Las Tareas Cognitivas evalúan procesos mentales como atención, memoria y toma de decisiones a través de ejercicios interactivos y preguntas estructuradas.',
        typeExplanation: `Diferentes tipos de tareas cognitivas:
• Atención: Evalúan capacidad de concentración
• Memoria: Miden retención y recuerdo
• Procesamiento: Analizan velocidad mental
• Decisión: Evalúan razonamiento y juicio
• Percepción: Miden interpretación sensorial`,
      },
    };

    return defaultContents[contentType];
  }
}
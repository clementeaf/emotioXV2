import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';

/**
 * Registro completo de un formulario SmartVOC en la base de datos
 */
export interface SmartVOCFormRecord extends SmartVOCFormData {
  /**
   * ID único del formulario
   */
  id: string;

  /**
   * Timestamp de creación del registro
   */
  createdAt: string;

  /**
   * Timestamp de última actualización del registro
   */
  updatedAt: string;
}

/**
 * Interfaz para el modelo DynamoDB de un formulario SmartVOC
 */
export interface SmartVOCFormDynamoItem {
  // Clave primaria
  id: string;
  // Clave de ordenación
  sk: string;
  // Research ID relacionado
  researchId: string;
  // Preguntas del formulario (serializado)
  questions: string;
  // Configuración
  randomizeQuestions: boolean;
  smartVocRequired: boolean;
  // Metadata serializado
  metadata: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
}

class SmartVOCFormModel {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;

  constructor(client: DynamoDBClient, tableName: string) {
    this.tableName = tableName || process.env.DYNAMODB_TABLE || 'smart-voc-forms';
    this.dynamoClient = DynamoDBDocumentClient.from(client);
  }

  async create(formData: SmartVOCFormData, researchId: string): Promise<SmartVOCFormRecord> {
    const now = new Date().toISOString();
    const record: SmartVOCFormRecord = {
      ...formData,
      id: uuidv4(),
      researchId,
      createdAt: now,
      updatedAt: now
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.tableName,
      Item: record
    }));

    return record;
  }

  async getById(id: string): Promise<SmartVOCFormRecord | null> {
    const result = await this.dynamoClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));

    if (!result.Item) {
      return null;
    }

    return result.Item as SmartVOCFormRecord;
  }

  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :researchId',
      ExpressionAttributeValues: {
        ':researchId': researchId
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return result.Items[0] as SmartVOCFormRecord;
  }

  async update(id: string, formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    const now = new Date().toISOString();
    
    // Primero conseguimos el formulario existente para mantener createdAt
    const existingForm = await this.getById(id);
    if (!existingForm) {
      throw new Error(`Form with id ${id} not found`);
    }
    
    const record: SmartVOCFormRecord = {
      ...formData,
      id,
      createdAt: existingForm.createdAt, // Mantenemos la fecha de creación original
      updatedAt: now
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.tableName,
      Item: record
    }));

    return record;
  }

  async delete(id: string): Promise<void> {
    await this.dynamoClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { id }
    }));
  }

  async getAll(): Promise<SmartVOCFormRecord[]> {
    const result = await this.dynamoClient.send(new ScanCommand({
      TableName: this.tableName
    }));

    if (!result.Items) {
      return [];
    }

    return result.Items as SmartVOCFormRecord[];
  }
}

export default new SmartVOCFormModel(new DynamoDBClient({}), process.env.DYNAMODB_TABLE || 'smart-voc-forms'); 
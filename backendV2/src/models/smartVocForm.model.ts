import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { SmartVOCFormData, SmartVOCQuestion } from '../../../shared/interfaces/smart-voc.interface';

/**
 * Registro completo de un formulario SmartVOC como se devuelve por la API/servicio
 */
export interface SmartVOCFormRecord extends Omit<SmartVOCFormData, 'questions'> {
  id: string;
  researchId: string;
  questions: SmartVOCQuestion[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interfaz para el item DynamoDB de un formulario SmartVOC
 */
export interface SmartVOCFormDynamoItem {
  // Clave primaria (UUID único)
  id: string;
  // Clave de ordenación (constante para este tipo)
  sk: string;
  // Research ID relacionado (para GSI)
  researchId: string;
  // Preguntas del formulario (serializado a JSON string)
  questions: string;
  // Configuración
  randomizeQuestions: boolean;
  smartVocRequired: boolean;
  // Metadata (serializado a JSON string)
  metadata: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
}

class SmartVOCFormModel {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;
  private static readonly SORT_KEY_VALUE = 'SMART_VOC_FORM'; // SK constante

  constructor() {
    // Usar consistentemente la variable de entorno y asegurar que no sea undefined
    this.tableName = process.env.DYNAMODB_TABLE!; // Añadir '!' para aserción no nula
    if (!this.tableName) {
      console.error('FATAL ERROR: DYNAMODB_TABLE environment variable is not set.');
      throw new Error('Table name environment variable is missing.');
    }
    // Asegurar que la región sea siempre string y asignar tipo explícito
    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({ region }); // Usar la variable region
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    console.log(`[SmartVOCFormModel] Initialized for table: ${this.tableName} in region: ${region}`);
  }

  // Función helper para mapear de DynamoItem a Record
  private mapToRecord(item: SmartVOCFormDynamoItem): SmartVOCFormRecord {
    return {
      id: item.id,
      researchId: item.researchId,
      questions: JSON.parse(item.questions || '[]'), // Deserializar
      randomizeQuestions: item.randomizeQuestions,
      smartVocRequired: item.smartVocRequired,
      // Añadir otros campos de SmartVOCFormData aquí
      metadata: JSON.parse(item.metadata || '{}'), // Deserializar
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  async create(formData: SmartVOCFormData, researchId: string): Promise<SmartVOCFormRecord> {
    const now = new Date().toISOString();
    const formId = uuidv4();

    const item: SmartVOCFormDynamoItem = {
      id: formId,
      sk: SmartVOCFormModel.SORT_KEY_VALUE,
      researchId: researchId,
      questions: JSON.stringify(formData.questions || []), // Serializar
      randomizeQuestions: formData.randomizeQuestions ?? false,
      smartVocRequired: formData.smartVocRequired ?? false,
      // Añadir otros campos de SmartVOCFormData aquí
      metadata: JSON.stringify(formData.metadata || { version: '1.0.0', lastUpdated: now, lastModifiedBy: 'system' }), // Serializar metadata
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      await this.dynamoClient.send(command);
      return this.mapToRecord(item); // Devolver usando el mapeo
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB PutCommand (SmartVOCForm):', JSON.stringify(error, null, 2));
      console.error('Error al crear SmartVOCForm:', error.message);
      throw new Error('DATABASE_ERROR: Error al crear el formulario SmartVOC');
    }
  }

  async getById(id: string): Promise<SmartVOCFormRecord | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { 
        id: id,
        sk: SmartVOCFormModel.SORT_KEY_VALUE 
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Item) {
        return null;
      }
      return this.mapToRecord(result.Item as SmartVOCFormDynamoItem);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB GetCommand (SmartVOCForm):', JSON.stringify(error, null, 2));
      console.error(`Error al obtener SmartVOCForm por ID ${id}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al obtener el formulario SmartVOC por ID');
    }
  }

  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex', // Usar el índice correcto
      KeyConditionExpression: 'researchId = :rid',
      ExpressionAttributeValues: {
        ':rid': researchId
      },
      // Podríamos añadir FilterExpression si quisiéramos asegurar que es un SMART_VOC_FORM 
      // FilterExpression: 'sk = :skVal',
      // ExpressionAttributeValues: { ':rid': researchId, ':skVal': SmartVOCFormModel.SORT_KEY_VALUE },
      Limit: 1
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      return this.mapToRecord(result.Items[0] as SmartVOCFormDynamoItem);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB QueryCommand GSI (SmartVOCForm):', JSON.stringify(error, null, 2));
      console.error(`Error al obtener SmartVOCForm por researchId ${researchId}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al obtener el formulario SmartVOC por Research ID');
    }
  }

  async update(id: string, formData: Partial<SmartVOCFormData>): Promise<SmartVOCFormRecord> {
    const now = new Date().toISOString();
    
    // Verificar existencia primero
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`SMART_VOC_FORM_NOT_FOUND: Formulario con ID ${id} no encontrado.`);
    }

    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };
    // const expressionAttributeNames: Record<string, string> = {}; // Si se usan nombres reservados

    // Añadir campos a actualizar dinámicamente
    if (formData.questions !== undefined) {
      updateExpression += ', questions = :questions';
      expressionAttributeValues[':questions'] = JSON.stringify(formData.questions); // Serializar
    }
    if (formData.randomizeQuestions !== undefined) {
      updateExpression += ', randomizeQuestions = :randomizeQuestions';
      expressionAttributeValues[':randomizeQuestions'] = formData.randomizeQuestions;
    }
    if (formData.smartVocRequired !== undefined) {
      updateExpression += ', smartVocRequired = :smartVocRequired';
      expressionAttributeValues[':smartVocRequired'] = formData.smartVocRequired;
    }
     // Actualizar metadata si se provee, manteniendo consistencia
    if (formData.metadata !== undefined) {
        updateExpression += ', metadata = :metadata';
        expressionAttributeValues[':metadata'] = JSON.stringify({ 
            ...(existing.metadata || {}), // Usar metadata existente deserializado
            ...formData.metadata,
            lastUpdated: new Date(),
        });
    } else {
        // Opcional: actualizar sólo lastUpdated si no se pasa nuevo metadata
        updateExpression += ', metadata = :metadata';
        expressionAttributeValues[':metadata'] = JSON.stringify({
            ...(existing.metadata || {}),
            lastUpdated: new Date(),
        });
    }
    // Añadir otros campos de formData aquí...

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { 
        id: id,
        sk: SmartVOCFormModel.SORT_KEY_VALUE 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      // ExpressionAttributeNames: ...,
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Attributes) {
        throw new Error('La actualización no devolvió atributos.');
      }
      return this.mapToRecord(result.Attributes as SmartVOCFormDynamoItem);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB UpdateCommand (SmartVOCForm):', JSON.stringify(error, null, 2));
      console.error(`Error al actualizar SmartVOCForm con ID ${id}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al actualizar el formulario SmartVOC');
    }
  }

  async delete(id: string): Promise<void> {
     // Opcional: verificar existencia primero
     const existing = await this.getById(id);
     if (!existing) {
       console.warn(`[SmartVOCFormModel] Intento de eliminar formulario no existente: ${id}`);
       return; // O lanzar error si se prefiere
     }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { 
        id: id,
        sk: SmartVOCFormModel.SORT_KEY_VALUE 
      }
    });
    try {
      await this.dynamoClient.send(command);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB DeleteCommand (SmartVOCForm):', JSON.stringify(error, null, 2));
      console.error(`Error al eliminar SmartVOCForm con ID ${id}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al eliminar el formulario SmartVOC');
    }
  }

  // getAll sigue siendo Scan, usar con precaución o eliminar
  async getAll(): Promise<SmartVOCFormRecord[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      // Podríamos añadir FilterExpression para obtener sólo SK='SMART_VOC_FORM'
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: { ':skVal': SmartVOCFormModel.SORT_KEY_VALUE }
    });

    try {
      const result = await this.dynamoClient.send(command);
      const items = result.Items || [];
      return items.map(item => this.mapToRecord(item as SmartVOCFormDynamoItem));
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB ScanCommand (SmartVOCForm - getAll):', JSON.stringify(error, null, 2));
      console.error('Error en SmartVOCFormModel.getAll:', error.message);
      throw new Error('DATABASE_ERROR: Error al obtener todos los formularios SmartVOC');
    }
  }
}

// Exportar una instancia única del modelo
export const smartVocFormModel = new SmartVOCFormModel(); 
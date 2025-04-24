import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  QueryCommand,
  DeleteCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveTaskFormData,
  Question,
  CognitiveTaskModel as SharedCognitiveTaskModel
} from '../../../shared/interfaces/cognitive-task.interface';

/**
 * Usaremos directamente la interfaz compartida que ya debería incluir id, researchId, etc.
 * Añadimos campos específicos si es necesario, pero la base es SharedCognitiveTaskModel.
 */
export interface CognitiveTaskRecord extends SharedCognitiveTaskModel { 
  // La interfaz compartida SharedCognitiveTaskModel debería tener:
  // id: string;
  // researchId: string;
  // questions: Question[];
  // randomizeQuestions: boolean;
  // metadata?: { [key: string]: any }; // O una estructura más específica
  // createdAt?: Date | string; // Revisar tipo en interfaz compartida
  // updatedAt?: Date | string; // Revisar tipo en interfaz compartida
}

/**
 * Interfaz para el item DynamoDB de un formulario CognitiveTask
 */
export interface CognitiveTaskDynamoItem {
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
  // Metadata serializado (objeto JSON como string)
  metadata: string;
  // Fechas (ISO string)
  createdAt: string;
  updatedAt: string;
}

/**
 * Modelo para manejar las operaciones de formularios CognitiveTask en DynamoDB
 */
export class CognitiveTaskModel {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;
  private static readonly SORT_KEY_VALUE = 'COGNITIVE_TASK'; // SK constante

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE!;
    if (!this.tableName) {
      console.error('FATAL ERROR: DYNAMODB_TABLE environment variable is not set.');
      throw new Error('Table name environment variable is missing.');
    }
    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    console.log(`[CognitiveTaskModel] Initialized for table: ${this.tableName} in region: ${region}`);
  }

  // Función helper para mapear de DynamoItem a Record
  private mapToRecord(item: CognitiveTaskDynamoItem): CognitiveTaskRecord {
    const parsedMetadata = JSON.parse(item.metadata || '{}');
    const parsedQuestions = JSON.parse(item.questions || '[]') as Question[];

    // Log de diagnóstico al mapear
    const resultQuestionsWithFiles = parsedQuestions.filter(q => 
        ['navigation_flow', 'preference_test'].includes(q.type) && q.files && q.files.length > 0
      );
      
    if (resultQuestionsWithFiles.length > 0) {
      console.log('[DIAGNOSTICO-IMAGEN:MODEL:MAP_TO_RECORD] Preguntas con archivos al mapear desde DB:', 
        JSON.stringify(resultQuestionsWithFiles.map(q => ({
          id: q.id, 
          type: q.type, 
          files: q.files?.map(f => ({id: f.id, name: f.name, url: f.url, s3Key: f.s3Key}))
        })), null, 2)
      );
    }

    return {
      id: item.id,
      researchId: item.researchId,
      questions: parsedQuestions,
      randomizeQuestions: item.randomizeQuestions,
      metadata: parsedMetadata,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  /**
   * Crea un nuevo formulario CognitiveTask
   */
  async create(data: CognitiveTaskFormData, researchId: string): Promise<CognitiveTaskRecord> {
    const formId = uuidv4();
    const now = new Date().toISOString();
    const questions = data.questions || [];

    // Log para diagnóstico de imágenes
    const questionsWithFiles = questions.filter(q => 
      ['navigation_flow', 'preference_test'].includes(q.type) && q.files && q.files.length > 0
    );
    
    if (questionsWithFiles.length > 0) {
      console.log('[DIAGNOSTICO-IMAGEN:MODEL:CREATE] Preguntas con archivos antes de guardar:', 
        JSON.stringify(questionsWithFiles.map(q => ({
          id: q.id, 
          type: q.type, 
          files: q.files?.map(f => ({id: f.id, name: f.name, url: f.url, s3Key: f.s3Key}))
        })), null, 2)
      );
    }
    
    // Asegurarse de que las referencias de imágenes estén completas
    questions.forEach(q => {
      if (q.files && q.files.length > 0) {
        q.files = q.files.filter(f => f && f.s3Key && f.url);
        console.log(`[DIAGNOSTICO-IMAGEN:MODEL:CREATE] Pregunta ${q.id} tiene ${q.files.length} archivos válidos`);
      }
    });
    
    const standardMetadata = {
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: 'system',
      estimatedCompletionTime: '5-10 minutes'
    };

    // Convertir a formato para DynamoDB
    const item: CognitiveTaskDynamoItem = {
      id: formId,
      sk: CognitiveTaskModel.SORT_KEY_VALUE, // Usar SK constante
      researchId,
      questions: JSON.stringify(questions),
      randomizeQuestions: data.randomizeQuestions ?? false,
      metadata: JSON.stringify(data.metadata ? { ...standardMetadata, ...data.metadata } : standardMetadata),
      createdAt: now,
      updatedAt: now
    };

    // Log del JSON que se guardará en la BD
    console.log('[DIAGNOSTICO-IMAGEN:MODEL:CREATE] JSON de preguntas que se guardará en DynamoDB:', 
      item.questions.substring(0, 300) + (item.questions.length > 300 ? '...' : '')
    );

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      await this.dynamoClient.send(command);
      return this.mapToRecord(item); // Devolver usando el mapeo
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB PutCommand (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error('Error al crear formulario CognitiveTask:', error.message);
      throw new Error('DATABASE_ERROR: Error al crear el formulario de tarea cognitiva'); // Mensaje más específico
    }
  }

  /**
   * Obtiene un formulario CognitiveTask por su ID único (UUID)
   */
  async getById(formId: string): Promise<CognitiveTaskRecord | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: CognitiveTaskModel.SORT_KEY_VALUE // Usar SK constante
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Item) {
        return null;
      }
      // Mapear y devolver (el log de diagnóstico ya está en mapToRecord)
      return this.mapToRecord(result.Item as CognitiveTaskDynamoItem);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB GetCommand (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error(`Error al obtener CognitiveTask por ID ${formId}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al obtener el formulario de tarea cognitiva por ID');
    }
  }

  /**
   * Obtiene el formulario CognitiveTask asociado a una investigación usando GSI
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex', // Usar GSI correcto
      KeyConditionExpression: 'researchId = :rid',
      // FilterExpression ya no es necesario si asumimos uno por researchId
      ExpressionAttributeValues: {
        ':rid': researchId
      },
      Limit: 1
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      // Mapear y devolver
      return this.mapToRecord(result.Items[0] as CognitiveTaskDynamoItem);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB QueryCommand GSI (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error(`Error al obtener CognitiveTask por researchId ${researchId}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al obtener el formulario de tarea cognitiva por Research ID');
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente
   */
  async update(formId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    // Verificar existencia
    const currentRecord = await this.getById(formId);
    if (!currentRecord) {
      throw new Error(`COGNITIVE_TASK_NOT_FOUND: Formulario con ID ${formId} no encontrado.`);
    }
    
    const now = new Date().toISOString();
    
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };
    
    // Actualizar preguntas si se proporcionan
    if (data.questions) {
      // Log para diagnóstico de imágenes
      const questionsWithFiles = data.questions.filter(q => 
        ['navigation_flow', 'preference_test'].includes(q.type) && q.files && q.files.length > 0
      );
      
      if (questionsWithFiles.length > 0) {
        console.log('[DIAGNOSTICO-IMAGEN:MODEL:UPDATE] Preguntas con archivos antes de actualizar:', 
          JSON.stringify(questionsWithFiles.map(q => ({
            id: q.id, 
            type: q.type, 
            files: q.files?.map(f => ({id: f.id, name: f.name, url: f.url, s3Key: f.s3Key}))
          })), null, 2)
        );
      }
      
      // Asegurarse de que las referencias de imágenes estén completas
      data.questions.forEach(q => {
        if (q.files && q.files.length > 0) {
          q.files = q.files.filter(f => f && f.s3Key && f.url);
          console.log(`[DIAGNOSTICO-IMAGEN:MODEL:UPDATE] Pregunta ${q.id} tiene ${q.files.length} archivos válidos`);
        }
      });
      
      updateExpression += ', questions = :questions';
      expressionAttributeValues[':questions'] = JSON.stringify(data.questions);
      
      // Log del JSON que se guardará en la BD
      console.log('[DIAGNOSTICO-IMAGEN:MODEL:UPDATE] JSON de preguntas que se actualizará en DynamoDB:', 
        expressionAttributeValues[':questions'].substring(0, 300) + 
        (expressionAttributeValues[':questions'].length > 300 ? '...' : '')
      );
    }
    
    if (data.randomizeQuestions !== undefined) {
      updateExpression += ', randomizeQuestions = :randomizeQuestions';
      expressionAttributeValues[':randomizeQuestions'] = data.randomizeQuestions;
    }
    
    // Actualizar metadata consistentemente
    const currentMetadataObject = currentRecord.metadata || {};
    const incomingMetadata = data.metadata || {};
    const newMetadata = {
        ...currentMetadataObject,
        ...incomingMetadata, // Sobrescribir con lo nuevo si existe
        updatedAt: now, // Siempre actualizar updatedAt
        lastModifiedBy: incomingMetadata.lastModifiedBy || currentMetadataObject.lastModifiedBy || 'system'
        // Mantener createdAt original si existe en currentMetadataObject
        // createdAt: currentMetadataObject.createdAt || now 
    };

    updateExpression += ', metadata = :metadata';
    expressionAttributeValues[':metadata'] = JSON.stringify(newMetadata);
    
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: CognitiveTaskModel.SORT_KEY_VALUE // Usar SK constante
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Attributes) {
        throw new Error('La actualización no devolvió atributos.');
      }
      // Mapear y devolver (log de diagnóstico en mapToRecord)
      return this.mapToRecord(result.Attributes as CognitiveTaskDynamoItem);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB UpdateCommand (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error(`Error al actualizar CognitiveTask con ID ${formId}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al actualizar el formulario de tarea cognitiva');
    }
  }

  /**
   * Elimina un formulario CognitiveTask
   */
  async delete(formId: string): Promise<void> {
     // Opcional: verificar existencia
     const existing = await this.getById(formId);
     if (!existing) {
        console.warn(`[CognitiveTaskModel] Intento de eliminar formulario no existente: ${formId}`);
        return;
     }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: CognitiveTaskModel.SORT_KEY_VALUE // Usar SK constante
      }
    });
    
    try {
      await this.dynamoClient.send(command);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB DeleteCommand (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error(`Error al eliminar CognitiveTask con ID ${formId}:`, error.message);
      throw new Error('DATABASE_ERROR: Error al eliminar el formulario de tarea cognitiva');
    }
  }

  /**
   * Obtiene todos los formularios CognitiveTask (Scan - Ineficiente)
   */
  async getAll(): Promise<CognitiveTaskRecord[]> {
    // Usar Scan filtrando por SK
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: {
        ':skVal': CognitiveTaskModel.SORT_KEY_VALUE
      }
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      const items = result.Items || [];
      return items.map(item => this.mapToRecord(item as CognitiveTaskDynamoItem));
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB ScanCommand (CognitiveTask - getAll):', JSON.stringify(error, null, 2));
      console.error('Error en CognitiveTaskModel.getAll:', error.message);
      throw new Error('DATABASE_ERROR: Error al obtener todos los formularios de tareas cognitivas');
    }
  }
}

// Exportar instancia
export const cognitiveTaskModel = new CognitiveTaskModel(); 
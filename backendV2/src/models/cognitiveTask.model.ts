import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
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
 * Interfaz que representa el registro de CognitiveTask en la aplicación.
 * El 'id' aquí es el UUID lógico, NO la PK de DynamoDB.
 */
export interface CognitiveTaskRecord extends SharedCognitiveTaskModel {
  // id: string; // Ya está en SharedCognitiveTaskModel
  // researchId: string; // Ya está en SharedCognitiveTaskModel
}

/**
 * Interfaz para el item DynamoDB de un formulario CognitiveTask
 * PK: researchId, SK: 'COGNITIVE_TASK'
 */
export interface CognitiveTaskDynamoItem {
  // Clave primaria (PK)
  researchId: string;
  // Clave de ordenación (SK)
  sk: string;
  // ID lógico único (UUID), no es parte de la clave
  id: string;
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
 * Usa researchId como PK. Incluye GSI por id (UUID).
 */
export class CognitiveTaskModel {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;
  private static readonly SORT_KEY_VALUE = 'COGNITIVE_TASK'; // SK constante
  private static readonly ID_INDEX_NAME = 'IdIndex'; // GSI por id (UUID)

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
   * Crea un nuevo formulario CognitiveTask para una investigación específica.
   * Utiliza researchId como PK.
   */
  async create(data: CognitiveTaskFormData, researchId: string): Promise<CognitiveTaskRecord> {
    const formId = data.id || uuidv4();
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
      researchId: researchId,
      sk: CognitiveTaskModel.SORT_KEY_VALUE,
      id: formId,
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
      return this.mapToRecord(item);
    } catch (error: any) {
      console.error('ERROR DETALLADO de DynamoDB PutCommand (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error('Error al crear formulario CognitiveTask:', error.message);
      throw new Error(`DATABASE_ERROR: Error al crear el formulario para researchId ${researchId}`);
    }
  }

  /**
   * Obtiene el formulario CognitiveTask asociado a su ID lógico (UUID).
   * Usa un GSI ('IdIndex') con 'id' como clave de partición.
   */
  async getById(id: string): Promise<CognitiveTaskRecord | null> {
    // Nota: Asume que el GSI 'IdIndex' está configurado en la tabla DynamoDB
    // con 'id' como su clave de partición.
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: CognitiveTaskModel.ID_INDEX_NAME,
      KeyConditionExpression: 'id = :idVal',
      ExpressionAttributeValues: {
        ':idVal': id
      },
      Limit: 1 // Esperamos solo uno por ID lógico
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null; // No encontrado
      }
      // Mapear el primer (y único esperado) item encontrado
      return this.mapToRecord(result.Items[0] as CognitiveTaskDynamoItem);
    } catch (error: any) {
      console.error(`ERROR DETALLADO de DynamoDB QueryCommand GSI (${CognitiveTaskModel.ID_INDEX_NAME}):`, JSON.stringify(error, null, 2));
      console.error(`Error al obtener CognitiveTask por id (UUID) ${id}:`, error.message);
      // Podríamos lanzar un error más específico si el índice no existe
      if (error.name === 'ResourceNotFoundException') {
         console.error(`FATAL: GSI '${CognitiveTaskModel.ID_INDEX_NAME}' no encontrado en la tabla '${this.tableName}'.`);
         throw new Error(`DATABASE_ERROR: Índice GSI '${CognitiveTaskModel.ID_INDEX_NAME}' no encontrado.`);
      }
      throw new Error(`DATABASE_ERROR: Error al obtener el formulario por id (UUID) ${id}`);
    }
  }

  /**
   * Obtiene el formulario CognitiveTask asociado a una investigación.
   * Usa QueryCommand sobre el GSI 'ResearchIdIndex' (PK: researchId).
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex', // <<< Usar el GSI por researchId >>>
      KeyConditionExpression: 'researchId = :researchIdVal', // <<< Condición sobre la PK del GSI >>>
      // Opcional: Filtrar por SK para obtener solo el item CognitiveTask
      // FilterExpression: 'sk = :skVal', 
      ExpressionAttributeValues: {
        ':researchIdVal': researchId,
        // ':skVal': CognitiveTaskModel.SORT_KEY_VALUE // Descomentar si se usa FilterExpression
      },
      Limit: 1 // Solo esperamos un formulario por investigación
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null; // No encontrado
      }
      // Mapear el primer (y único esperado) item encontrado
      return this.mapToRecord(result.Items[0] as CognitiveTaskDynamoItem);
    } catch (error: any) {
      console.error(`ERROR DETALLADO de DynamoDB QueryCommand GSI (ResearchIdIndex):`, JSON.stringify(error, null, 2));
      console.error(`Error al obtener CognitiveTask por researchId ${researchId}:`, error.message);
       if (error.name === 'ResourceNotFoundException') {
         console.error(`FATAL: GSI 'ResearchIdIndex' no encontrado en la tabla '${this.tableName}'. Verifica la definición en resources.yml.`);
         throw new Error(`DATABASE_ERROR: Índice GSI 'ResearchIdIndex' no encontrado.`);
      }
      // Modificar mensaje para reflejar el método Query
      throw new Error(`DATABASE_ERROR: Error al consultar el formulario para researchId ${researchId}`);
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente para una investigación.
   * Usa researchId como PK.
   */
  async update(researchId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    const now = new Date().toISOString();

    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };

    if (data.questions) {
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
      
      data.questions.forEach(q => {
        if (q.files && q.files.length > 0) {
          q.files = q.files.filter(f => f && f.s3Key && f.url);
          console.log(`[DIAGNOSTICO-IMAGEN:MODEL:UPDATE] Pregunta ${q.id} tiene ${q.files.length} archivos válidos`);
        }
      });
      
      updateExpression += ', questions = :questions';
      expressionAttributeValues[':questions'] = JSON.stringify(data.questions);
      
      console.log('[DIAGNOSTICO-IMAGEN:MODEL:UPDATE] JSON de preguntas que se actualizará en DynamoDB:', 
        expressionAttributeValues[':questions'].substring(0, 300) + 
        (expressionAttributeValues[':questions'].length > 300 ? '...' : '')
      );
    }
    
    if (data.randomizeQuestions !== undefined) {
      updateExpression += ', randomizeQuestions = :randomizeQuestions';
      expressionAttributeValues[':randomizeQuestions'] = data.randomizeQuestions;
    }
    
    if (data.metadata) {
      const newMetadata = {
        ...(data.metadata || {}),
        updatedAt: now,
        lastModifiedBy: data.metadata?.lastModifiedBy || 'system_update'
      };
      updateExpression += ', metadata = :metadata';
      expressionAttributeValues[':metadata'] = JSON.stringify(newMetadata);
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        researchId: researchId,
        sk: CognitiveTaskModel.SORT_KEY_VALUE
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Attributes) {
        console.warn(`UpdateCommand para researchId ${researchId} no devolvió atributos. El item podría no existir.`);
        throw new Error(`COGNITIVE_TASK_NOT_FOUND: Formulario para researchId ${researchId} no encontrado para actualizar.`);
      }
      return this.mapToRecord(result.Attributes as CognitiveTaskDynamoItem);
    } catch (error: any) {
      if (error.message?.startsWith('COGNITIVE_TASK_NOT_FOUND')) {
        throw error;
      }
      console.error('ERROR DETALLADO de DynamoDB UpdateCommand (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error(`Error al actualizar CognitiveTask para researchId ${researchId}:`, error.message);
      throw new Error(`DATABASE_ERROR: Error al actualizar el formulario para researchId ${researchId}`);
    }
  }

  /**
   * Elimina un formulario CognitiveTask para una investigación.
   * Usa researchId como PK y ConditionExpression para asegurar existencia.
   */
  async delete(researchId: string): Promise<boolean> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        researchId: researchId,
        sk: CognitiveTaskModel.SORT_KEY_VALUE
      },
      ConditionExpression: 'attribute_exists(researchId)'
    });

    try {
      await this.dynamoClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        console.warn(`DeleteCommand falló chequeo condicional para researchId ${researchId}. El item no existe.`);
        throw new Error(`COGNITIVE_TASK_NOT_FOUND: Formulario para researchId ${researchId} no encontrado para eliminar.`);
      }
      console.error('ERROR DETALLADO de DynamoDB DeleteCommand (CognitiveTask):', JSON.stringify(error, null, 2));
      console.error(`Error al eliminar CognitiveTask para researchId ${researchId}:`, error.message);
      throw new Error(`DATABASE_ERROR: Error al eliminar el formulario para researchId ${researchId}`);
    }
  }

  /**
   * Obtiene todos los formularios CognitiveTask (Scan - Ineficiente)
   */
  async getAll(): Promise<CognitiveTaskRecord[]> {
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
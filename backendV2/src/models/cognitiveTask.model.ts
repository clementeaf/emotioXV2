import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveTaskFormData,
  Question,
  CognitiveTaskModel as SharedCognitiveTaskModel
} from '../../../shared/interfaces/cognitive-task.interface';
import { NotFoundError } from '../errors';
import { structuredLog } from '../utils/logging.util';

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
 * PK: id, SK: 'COGNITIVE_TASK'
 */
export interface CognitiveTaskDynamoItem {
  // Clave primaria (PK)
  id: string;
  // Clave de ordenación (SK)
  sk: string;
  // Research ID relacionado (para GSI)
  researchId: string;
  // Preguntas del formulario (serializado a JSON string)
  questions: string;
  // Configuración
  randomizeQuestions: boolean;
  // Metadata serializado (objeto JSON como string)
  metadata: string;
  // NUEVO: questionKey para identificación única de preguntas
  questionKey?: string;
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
  private modelName = 'CognitiveTaskModel'; // Para logging

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
  async create(data: CognitiveTaskFormData, researchId: string, questionKey?: string): Promise<CognitiveTaskRecord> {
    const formId = data.id || uuidv4();
    const now = new Date().toISOString();
    const questions = data.questions || [];

    // Asegurarse de que las referencias de imágenes estén completas (solo s3Key es vital)
    questions.forEach(q => {
      if (q.files && q.files.length > 0) {
        q.files = q.files.filter(f => f && f.s3Key);
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
      sk: CognitiveTaskModel.SORT_KEY_VALUE,
      researchId: researchId,
      questions: JSON.stringify(questions),
      randomizeQuestions: data.randomizeQuestions ?? false,
      metadata: JSON.stringify(data.metadata ? { ...standardMetadata, ...data.metadata } : standardMetadata),
      questionKey: questionKey, // NUEVO: Guardar questionKey
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[CognitiveTaskModel.create] ✅ Formulario creado exitosamente con questionKey: ${questionKey}`);
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
 * Usa QueryCommand sobre el GSI 'researchId-index' (PK: researchId).
 */
  async getByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    const context = 'getByResearchId';
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :rid',
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: {
        ':rid': researchId,
        ':skVal': CognitiveTaskModel.SORT_KEY_VALUE
      }
    });

    try {
      structuredLog('info', `${this.modelName}.${context}`, 'Consultando tabla para researchId', { researchId, tableName: this.tableName });

      const result = await this.dynamoClient.send(command);

      structuredLog('debug', `${this.modelName}.${context}`, 'Resultado de consulta', { encontrados: result.Items?.length || 0, researchId });

      if (!result.Items || result.Items.length === 0) {
        structuredLog('info', `${this.modelName}.${context}`, 'No se encontró CognitiveTask', { researchId });
        return null; // Cambiar a return null en lugar de throw NotFoundError
      }

      // Mapear el primer (y único esperado) item encontrado
      const record = this.mapToRecord(result.Items[0] as CognitiveTaskDynamoItem);
      structuredLog('debug', `${this.modelName}.${context}`, 'CognitiveTask encontrado por ResearchID', { researchId, id: record.id });
      return record;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error; // Re-lanzar NotFoundError
      }

      structuredLog('error', `${this.modelName}.${context}`, 'Error al obtener CognitiveTask por researchId (Query GSI)', { error: error, researchId });

      if ((error as Error).message?.includes('index')) {
        structuredLog('error', `${this.modelName}.${context}`, 'Índice GSI researchId-index no encontrado o mal configurado');
        throw new Error(`DATABASE_ERROR: Error de configuración de base de datos: falta índice para búsqueda por researchId.`);
      }

      throw new Error(`DATABASE_ERROR: Error al consultar el formulario para researchId ${researchId}`);
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente para una investigación.
   * Usa researchId como PK.
   */
  async update(researchId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {

    try {
      // Primero, obtener el registro para conseguir su ID
      const existingRecord = await this.getByResearchId(researchId);
      if (!existingRecord) {
        throw new NotFoundError('COGNITIVE_TASK_NOT_FOUND');
      }

      const now = new Date().toISOString();
      let updateExpression = 'SET updatedAt = :updatedAt';
      const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };

      if (data.questions) {
        try {
          const questionsWithFiles = data.questions.filter(q =>
            ['navigation_flow', 'preference_test'].includes(q.type) && q.files && q.files.length > 0
          );

          if (questionsWithFiles.length > 0) {
            // Preguntas con archivos encontradas
          }

          // Mejorar la validación de archivos con verificación estricta
          data.questions.forEach(q => {
            if (q.files && q.files.length > 0) {
              try {
                // Filtrar solo archivos que tienen información completa
                const validFiles = q.files.filter(f => {
                  try {
                    if (!f) {
                      console.warn(`[MODEL:update] Archivo nulo encontrado en pregunta ${q.id}`);
                      return false;
                    }

                    const isValid = f.id && f.name && f.size && f.type && f.s3Key;
                    if (!isValid) {
                      console.warn(`[MODEL:update] Archivo inválido en pregunta ${q.id}:`, JSON.stringify(f));

                      // Log detallado de campos faltantes para diagnóstico
                      if (!f.id) console.warn(`[MODEL:update] Campo faltante: id en pregunta ${q.id}`);
                      if (!f.name) console.warn(`[MODEL:update] Campo faltante: name en pregunta ${q.id}`);
                      if (!f.size) console.warn(`[MODEL:update] Campo faltante: size en pregunta ${q.id}`);
                      if (!f.type) console.warn(`[MODEL:update] Campo faltante: type en pregunta ${q.id}`);
                      if (!f.s3Key) console.warn(`[MODEL:update] Campo faltante: s3Key en pregunta ${q.id}`);
                    }
                    return isValid;
                  } catch (fileError: any) {
                    console.error(`[MODEL:update] Error procesando archivo en pregunta ${q.id}:`, fileError);
                    return false;
                  }
                });

                // Guardar un snapshot de validFiles para diagnóstico
                console.log(`[MODEL:update] Archivos válidos en pregunta ${q.id}:`, JSON.stringify(validFiles.map(f => ({ id: f.id, name: f.name })), null, 2));

                // Asegurar que todos los archivos válidos tengan URL (derivar de S3 si falta)
                q.files = validFiles.map(f => {
                  try {
                    // Si falta URL, construirla
                    if (!f.url && f.s3Key) {
                      const s3BaseUrl = process.env.S3_PUBLIC_URL || 'https://emotioxv2.s3.amazonaws.com';
                      f.url = `${s3BaseUrl}/${f.s3Key}`;
                      console.log(`[MODEL:update] URL generada para archivo ${f.id}: ${f.url}`);
                    }
                    return f;
                  } catch (urlError: any) {
                    console.error(`[MODEL:update] Error generando URL para archivo ${f.id}:`, urlError);
                    return f; // Devolver el archivo sin modificar si hay error
                  }
                });

                console.log(`[MODEL:update] Pregunta ${q.id} tiene ${q.files.length} archivos válidos después de la validación`);
              } catch (questionError: any) {
                console.error(`[MODEL:update] Error grave procesando archivos de pregunta ${q.id}:`, questionError);
                throw new Error(`Error procesando archivos de pregunta ${q.id}: ${questionError.message}`);
              }
            }
          });

          updateExpression += ', questions = :questions';
          expressionAttributeValues[':questions'] = JSON.stringify(data.questions);

          // Solo loguear un fragmento para no saturar los logs
          console.log('[MODEL:update] JSON de preguntas que se actualizará (primeros 300 caracteres):',
            expressionAttributeValues[':questions'].substring(0, 300) +
            (expressionAttributeValues[':questions'].length > 300 ? '...' : '')
          );

          // AGREGADO: Log específico para verificar hitZones en el JSON
          const jsonData = JSON.parse(expressionAttributeValues[':questions']) as Question[];
          const questionsWithHitZones = jsonData.filter((q: Question) =>
            q.files && q.files.some((f: any) => f.hitZones && f.hitZones.length > 0)
          );

        } catch (questionsError: any) {
          console.error('[MODEL:update] Error preparando preguntas para actualización:', questionsError);
          throw new Error(`Error preparando preguntas para actualización: ${questionsError.message}`);
        }
      }

      if (data.randomizeQuestions !== undefined) {
        updateExpression += ', randomizeQuestions = :randomizeQuestions';
        expressionAttributeValues[':randomizeQuestions'] = data.randomizeQuestions;
      }

      if (data.metadata) {
        try {
          const newMetadata = {
            ...(data.metadata || {}),
            updatedAt: now,
            lastModifiedBy: data.metadata?.lastModifiedBy || 'system_update'
          };
          updateExpression += ', metadata = :metadata';
          expressionAttributeValues[':metadata'] = JSON.stringify(newMetadata);
        } catch (metadataError: any) {
          console.error('[MODEL:update] Error preparando metadata para actualización:', metadataError);
          throw new Error(`Error preparando metadata para actualización: ${metadataError.message}`);
        }
      }

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          id: existingRecord.id,
          sk: CognitiveTaskModel.SORT_KEY_VALUE
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      console.log(`[MODEL:update] Ejecutando UpdateCommand con ExpressionAttributeValues keys: ${Object.keys(expressionAttributeValues).join(', ')}`);

      try {
        const result = await this.dynamoClient.send(command);
        if (!result.Attributes) {
          console.warn(`[MODEL:update] UpdateCommand para researchId ${researchId} no devolvió atributos. El item podría no existir.`);
          throw new NotFoundError('COGNITIVE_TASK_NOT_FOUND');
        }
        console.log(`[MODEL:update] Actualización exitosa para researchId=${researchId}`);
        return this.mapToRecord(result.Attributes as CognitiveTaskDynamoItem);
      } catch (dbError: any) {
        if (dbError.message?.startsWith('COGNITIVE_TASK_NOT_FOUND')) {
          throw dbError;
        }
        console.error('[MODEL:update] ERROR DETALLADO de DynamoDB UpdateCommand:', JSON.stringify(dbError, null, 2));
        console.error(`[MODEL:update] Error al actualizar CognitiveTask para researchId ${researchId}:`, dbError.message);
        throw new Error(`DATABASE_ERROR: Error al actualizar el formulario para researchId ${researchId}. Detalles: ${dbError.message}`);
      }
    } catch (outerError: any) {
      if (outerError instanceof NotFoundError) {
        throw outerError; // Re-lanzar NotFoundError
      }
      console.error('[MODEL:update] Error en el procesamiento general del método update:', outerError);
      throw new Error(`DATABASE_ERROR: Error en el procesamiento del método update: ${outerError.message}`);
    }
  }

  /**
   * Elimina un formulario CognitiveTask para una investigación.
   * Usa researchId como PK y ConditionExpression para asegurar existencia.
   */
  async delete(researchId: string): Promise<boolean> {
    // Primero obtener el registro para conseguir su ID
    const existingRecord = await this.getByResearchId(researchId);
    if (!existingRecord) {
      return false; // Si no existe, retornar false en lugar de error
    }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: existingRecord.id,
        sk: CognitiveTaskModel.SORT_KEY_VALUE
      },
      ConditionExpression: 'attribute_exists(id)'
    });

    try {
      await this.dynamoClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        console.warn(`DeleteCommand falló chequeo condicional para researchId ${researchId}. El item no existe.`);
        throw new NotFoundError('COGNITIVE_TASK_NOT_FOUND');
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

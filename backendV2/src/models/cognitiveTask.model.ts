import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveTaskFormData,
  Question
} from '../../../shared/interfaces/cognitive-task.interface';

/**
 * Registro completo de un formulario CognitiveTask en la base de datos
 */
export interface CognitiveTaskRecord extends CognitiveTaskFormData {
  /**
   * ID único del formulario
   */
  id: string;

  /**
   * Timestamp de creación del registro
   */
  createdAt: Date;

  /**
   * Timestamp de última actualización del registro
   */
  updatedAt: Date;
}

/**
 * Interfaz para el modelo DynamoDB de un formulario CognitiveTask
 */
export interface CognitiveTaskDynamoItem {
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
  // Metadata serializado
  metadata: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
}

/**
 * Modelo para manejar las operaciones de formularios CognitiveTask en DynamoDB
 */
export class CognitiveTaskModel {
  private tableName: string;
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    console.log('======== COGNITIVE TASK MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    console.log('Nombre de tabla DynamoDB para Cognitive Task forms:', this.tableName);
    
    // Configuración para DynamoDB en AWS Cloud
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    console.log('Configuración DynamoDB para Cognitive Task forms:', options);
    
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
    console.log('=======================================');
  }

  /**
   * Crea un nuevo formulario CognitiveTask
   * @param data Datos del formulario
   * @param researchId ID de la investigación asociada
   * @returns El formulario creado con su ID generado
   */
  async create(data: CognitiveTaskFormData, researchId: string): Promise<CognitiveTaskRecord> {
    // Generar ID único para el formulario
    const formId = uuidv4();
    
    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Combinar con valores por defecto si es necesario
    const questions = data.questions || [];
    const standardMetadata = {
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: 'system',
      estimatedCompletionTime: '5-10 minutes'
    };

    // Convertir a formato para DynamoDB
    const item: CognitiveTaskDynamoItem = {
      id: formId,
      sk: `COGNITIVE_TASK#${formId}`,
      researchId,
      questions: JSON.stringify(questions),
      randomizeQuestions: data.randomizeQuestions || false,
      metadata: JSON.stringify(standardMetadata),
      createdAt: now,
      updatedAt: now
    };

    // Guardar en DynamoDB
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      await this.dynamoClient.send(command);
      
      // Devolver el objeto creado con su ID
      return {
        id: formId,
        researchId,
        questions: questions,
        randomizeQuestions: data.randomizeQuestions || false,
        metadata: {
          createdAt: now,
          updatedAt: now,
          lastModifiedBy: 'system'
        },
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    } catch (error) {
      console.error('Error al crear formulario CognitiveTask:', error);
      throw error;
    }
  }

  /**
   * Obtiene un formulario CognitiveTask por su ID
   * @param formId ID del formulario
   * @returns El formulario si existe, null si no
   */
  async getById(formId: string): Promise<CognitiveTaskRecord | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: `COGNITIVE_TASK#${formId}`
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as CognitiveTaskDynamoItem;
      const parsedMetadata = JSON.parse(item.metadata);
      
      return {
        id: item.id,
        researchId: item.researchId,
        questions: JSON.parse(item.questions) as Question[],
        randomizeQuestions: item.randomizeQuestions,
        metadata: {
          createdAt: parsedMetadata.createdAt,
          updatedAt: parsedMetadata.updatedAt,
          lastModifiedBy: parsedMetadata.lastModifiedBy
        },
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener formulario CognitiveTask:', error);
      throw error;
    }
  }

  /**
   * Obtiene el formulario CognitiveTask asociado a una investigación
   * @param researchId ID de la investigación
   * @returns El formulario si existe, null si no
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :researchId',
      FilterExpression: 'begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':researchId': researchId,
        ':prefix': 'COGNITIVE_TASK#'
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      // Asumimos que solo hay un formulario por investigación
      const item = result.Items[0] as CognitiveTaskDynamoItem;
      const parsedMetadata = JSON.parse(item.metadata);
      
      return {
        id: item.id,
        researchId: item.researchId,
        questions: JSON.parse(item.questions) as Question[],
        randomizeQuestions: item.randomizeQuestions,
        metadata: {
          createdAt: parsedMetadata.createdAt,
          updatedAt: parsedMetadata.updatedAt,
          lastModifiedBy: parsedMetadata.lastModifiedBy
        },
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener formulario CognitiveTask por researchId:', error);
      throw error;
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente
   * @param formId ID del formulario a actualizar
   * @param data Datos parciales para actualizar
   * @returns El formulario actualizado
   */
  async update(formId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    // Primero obtenemos el registro actual
    const currentRecord = await this.getById(formId);
    
    if (!currentRecord) {
      throw new Error(`Formulario CognitiveTask con ID ${formId} no encontrado`);
    }
    
    // Fecha actual para updated
    const now = new Date().toISOString();
    
    // Preparar los campos a actualizar
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: any = {
      ':updatedAt': now
    };
    
    // Actualizar preguntas si se proporcionan
    if (data.questions) {
      updateExpression += ', questions = :questions';
      expressionAttributeValues[':questions'] = JSON.stringify(data.questions);
    }
    
    // Actualizar randomizeQuestions si se proporciona
    if (data.randomizeQuestions !== undefined) {
      updateExpression += ', randomizeQuestions = :randomizeQuestions';
      expressionAttributeValues[':randomizeQuestions'] = data.randomizeQuestions;
    }
    
    // Preparar la metadata para actualizar
    const currentMetadata = {
      createdAt: currentRecord.metadata?.createdAt || '',
      updatedAt: now,
      lastModifiedBy: data.metadata?.lastModifiedBy || currentRecord.metadata?.lastModifiedBy || 'system'
    };

    // Actualizar metadata
    updateExpression += ', metadata = :metadata';
    expressionAttributeValues[':metadata'] = JSON.stringify(currentMetadata);
    
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: `COGNITIVE_TASK#${formId}`
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      
      if (!result.Attributes) {
        throw new Error('Error al actualizar: no se devolvieron atributos');
      }
      
      const updatedItem = result.Attributes as CognitiveTaskDynamoItem;
      const parsedMetadata = JSON.parse(updatedItem.metadata);
      
      return {
        id: updatedItem.id,
        researchId: updatedItem.researchId,
        questions: JSON.parse(updatedItem.questions) as Question[],
        randomizeQuestions: updatedItem.randomizeQuestions,
        metadata: {
          createdAt: parsedMetadata.createdAt,
          updatedAt: parsedMetadata.updatedAt,
          lastModifiedBy: parsedMetadata.lastModifiedBy
        },
        createdAt: new Date(updatedItem.createdAt),
        updatedAt: new Date(updatedItem.updatedAt)
      };
    } catch (error) {
      console.error('Error al actualizar formulario CognitiveTask:', error);
      throw error;
    }
  }

  /**
   * Elimina un formulario CognitiveTask
   * @param formId ID del formulario a eliminar
   */
  async delete(formId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: `COGNITIVE_TASK#${formId}`
      }
    });
    
    try {
      await this.dynamoClient.send(command);
    } catch (error) {
      console.error('Error al eliminar formulario CognitiveTask:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los formularios CognitiveTask
   * @returns Lista de todos los formularios
   */
  async getAll(): Promise<CognitiveTaskRecord[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'sk-index',
      KeyConditionExpression: 'begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': 'COGNITIVE_TASK#'
      }
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      
      if (!result.Items || result.Items.length === 0) {
        return [];
      }
      
      return result.Items.map((item: any) => {
        const parsedMetadata = JSON.parse(item.metadata);
        
        return {
          id: item.id,
          researchId: item.researchId,
          questions: JSON.parse(item.questions) as Question[],
          randomizeQuestions: item.randomizeQuestions,
          metadata: {
            createdAt: parsedMetadata.createdAt,
            updatedAt: parsedMetadata.updatedAt,
            lastModifiedBy: parsedMetadata.lastModifiedBy
          },
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        };
      });
    } catch (error) {
      console.error('Error al obtener todos los formularios CognitiveTask:', error);
      throw error;
    }
  }
} 
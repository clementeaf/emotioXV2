import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  SmartVOCFormData,
  SmartVOCQuestion,
  QuestionConfig
} from '../../../shared/interfaces/smart-voc.interface';

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
  createdAt: Date;

  /**
   * Timestamp de última actualización del registro
   */
  updatedAt: Date;
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

/**
 * Modelo para manejar las operaciones de formularios SmartVOC en DynamoDB
 */
export class SmartVOCFormModel {
  private tableName: string;
  private dynamoClient: DynamoDB.DocumentClient;

  constructor() {
    console.log('======== SMART VOC FORM MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    console.log('Nombre de tabla DynamoDB para Smart VOC forms:', this.tableName);
    
    // Configuración para DynamoDB en AWS Cloud
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    console.log('Configuración DynamoDB para Smart VOC forms:', options);
    
    this.dynamoClient = new DynamoDB.DocumentClient(options);
    console.log('=======================================');
  }

  /**
   * Crea un nuevo formulario SmartVOC
   * @param data Datos del formulario
   * @param researchId ID de la investigación asociada
   * @returns El formulario creado con su ID generado
   */
  async create(data: SmartVOCFormData, researchId: string): Promise<SmartVOCFormRecord> {
    // Generar ID único para el formulario
    const formId = uuidv4();
    
    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Combinar con valores por defecto si es necesario
    const questions = data.questions || [];
    const metadata = data.metadata || {
      estimatedCompletionTime: '3-5 minutes'
    };

    // Convertir a formato para DynamoDB
    const item: SmartVOCFormDynamoItem = {
      id: formId,
      sk: `SMART_VOC_FORM#${formId}`,
      researchId,
      questions: JSON.stringify(questions),
      randomizeQuestions: data.randomizeQuestions || false,
      smartVocRequired: data.smartVocRequired || true,
      metadata: JSON.stringify(metadata),
      createdAt: now,
      updatedAt: now
    };

    // Guardar en DynamoDB
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: item
    };

    try {
      await this.dynamoClient.put(params).promise();
      
      // Devolver el objeto creado con su ID
      return {
        id: formId,
        researchId,
        questions: questions,
        randomizeQuestions: data.randomizeQuestions || false,
        smartVocRequired: data.smartVocRequired || true,
        metadata,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    } catch (error) {
      console.error('Error al crear formulario SmartVOC:', error);
      throw error;
    }
  }

  /**
   * Obtiene un formulario SmartVOC por su ID
   * @param formId ID del formulario
   * @returns El formulario si existe, null si no
   */
  async getById(formId: string): Promise<SmartVOCFormRecord | null> {
    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: `SMART_VOC_FORM#${formId}`
      }
    };

    try {
      const result = await this.dynamoClient.get(params).promise();
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as SmartVOCFormDynamoItem;
      
      return {
        id: item.id,
        researchId: item.researchId,
        questions: JSON.parse(item.questions) as SmartVOCQuestion[],
        randomizeQuestions: item.randomizeQuestions,
        smartVocRequired: item.smartVocRequired,
        metadata: JSON.parse(item.metadata),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener formulario SmartVOC:', error);
      throw error;
    }
  }

  /**
   * Obtiene el formulario SmartVOC asociado a una investigación
   * @param researchId ID de la investigación
   * @returns El formulario si existe, null si no
   */
  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :researchId',
      FilterExpression: 'begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':researchId': researchId,
        ':prefix': 'SMART_VOC_FORM#'
      }
    };

    try {
      const result = await this.dynamoClient.query(params).promise();
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const item = result.Items[0] as SmartVOCFormDynamoItem;
      
      return {
        id: item.id,
        researchId: item.researchId,
        questions: JSON.parse(item.questions) as SmartVOCQuestion[],
        randomizeQuestions: item.randomizeQuestions,
        smartVocRequired: item.smartVocRequired,
        metadata: JSON.parse(item.metadata),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener formulario SmartVOC por ResearchId:', error);
      throw error;
    }
  }

  /**
   * Actualiza un formulario SmartVOC
   * @param formId ID del formulario
   * @param data Datos actualizados
   * @returns El formulario actualizado
   */
  async update(formId: string, data: Partial<SmartVOCFormData>): Promise<SmartVOCFormRecord> {
    // Primero obtenemos el formulario existente
    const existingForm = await this.getById(formId);
    
    if (!existingForm) {
      throw new Error(`No se encontró formulario SmartVOC con ID: ${formId}`);
    }

    // Fecha actual para updated
    const now = new Date().toISOString();
    
    // Mezclamos los datos existentes con los actualizados
    const updatedQuestions = data.questions !== undefined ? data.questions : existingForm.questions;
    const updatedRandomize = data.randomizeQuestions !== undefined ? data.randomizeQuestions : existingForm.randomizeQuestions;
    const updatedRequired = data.smartVocRequired !== undefined ? data.smartVocRequired : existingForm.smartVocRequired;
    const updatedMetadata = data.metadata ? { ...existingForm.metadata, ...data.metadata } : existingForm.metadata;

    // Parámetros para actualización
    const updateParams: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: `SMART_VOC_FORM#${formId}`
      },
      UpdateExpression: `SET 
        questions = :questions,
        randomizeQuestions = :randomize,
        smartVocRequired = :required,
        metadata = :metadata,
        updatedAt = :updatedAt`,
      ExpressionAttributeValues: {
        ':questions': JSON.stringify(updatedQuestions),
        ':randomize': updatedRandomize,
        ':required': updatedRequired,
        ':metadata': JSON.stringify(updatedMetadata),
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.dynamoClient.update(updateParams).promise();
      const updated = result.Attributes as SmartVOCFormDynamoItem;
      
      return {
        id: updated.id,
        researchId: updated.researchId,
        questions: JSON.parse(updated.questions) as SmartVOCQuestion[],
        randomizeQuestions: updated.randomizeQuestions,
        smartVocRequired: updated.smartVocRequired,
        metadata: JSON.parse(updated.metadata),
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt)
      };
    } catch (error) {
      console.error('Error al actualizar formulario SmartVOC:', error);
      throw error;
    }
  }

  /**
   * Elimina un formulario SmartVOC
   * @param formId ID del formulario a eliminar
   */
  async delete(formId: string): Promise<void> {
    const params: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.tableName,
      Key: {
        id: formId,
        sk: `SMART_VOC_FORM#${formId}`
      }
    };

    try {
      await this.dynamoClient.delete(params).promise();
    } catch (error) {
      console.error('Error al eliminar formulario SmartVOC:', error);
      throw error;
    }
  }
}

// Exportar una instancia por defecto del modelo
export default new SmartVOCFormModel(); 
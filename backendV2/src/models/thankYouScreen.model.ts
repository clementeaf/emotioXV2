import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { uuidv4 } from '../utils/id-generator';
import {
  ThankYouScreenConfig,
  ThankYouScreenModel as SharedThankYouScreenModel,
  ThankYouScreenFormData,
  DEFAULT_THANK_YOU_SCREEN_CONFIG,
  DEFAULT_THANK_YOU_SCREEN_VALIDATION
} from '../../../shared/interfaces/thank-you-screen.interface';

/**
 * Interfaz para el modelo DynamoDB de una pantalla de agradecimiento
 */
export interface ThankYouScreenDynamoItem {
  // Clave primaria
  id: string;
  // Clave de ordenación
  sk: string;
  // Research ID relacionado
  researchId: string;
  // Propiedades de la pantalla de agradecimiento
  isEnabled: boolean;
  title: string;
  message: string;
  redirectUrl: string;
  // Metadata serializado
  metadata: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
}

// Re-exportamos los tipos compartidos
export type {
  ThankYouScreenConfig,
  SharedThankYouScreenModel as ThankYouScreenRecord,
  ThankYouScreenFormData
};

// Re-exportamos las constantes compartidas
export {
  DEFAULT_THANK_YOU_SCREEN_CONFIG,
  DEFAULT_THANK_YOU_SCREEN_VALIDATION
};

/**
 * Modelo para manejar las operaciones de pantallas de agradecimiento en DynamoDB
 */
export class ThankYouScreenModel {
  private tableName: string;
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    console.log('======== THANK YOU SCREEN MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    console.log('Nombre de tabla DynamoDB para thank you screens:', this.tableName);
    
    // Configuración para DynamoDB en AWS Cloud (producción)
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    console.log('Configuración DynamoDB para thank you screens:', options);
    console.log('SIEMPRE usando DynamoDB en AWS Cloud - NO LOCAL');
    
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
    console.log('=======================================');
  }

  /**
   * Crea una nueva configuración de pantalla de agradecimiento
   * @param data Datos de la pantalla de agradecimiento
   * @param researchId ID de la investigación asociada
   * @returns La configuración creada con su ID generado
   */
  async create(data: ThankYouScreenFormData, researchId: string): Promise<SharedThankYouScreenModel> {
    // Generar ID único para la pantalla de agradecimiento
    const screenId = uuidv4();
    
    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Usar los datos tal como vienen, sin valores predeterminados
    const config: ThankYouScreenConfig = {
      isEnabled: data.isEnabled,
      title: data.title,
      message: data.message,
      redirectUrl: data.redirectUrl || '',
      metadata: {
        version: '1.0.0'
      }
    };

    // Convertir a formato para DynamoDB
    const item: ThankYouScreenDynamoItem = {
      id: screenId,
      sk: `THANK_YOU_SCREEN#${screenId}`,
      researchId,
      isEnabled: config.isEnabled,
      title: config.title,
      message: config.message,
      redirectUrl: config.redirectUrl || '',
      metadata: JSON.stringify(config.metadata),
      createdAt: now,
      updatedAt: now
    };

    // Guardar en DynamoDB
    const params = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      await this.dynamoClient.send(params);
      
      // Devolver el objeto creado con su ID
      return {
        id: screenId,
        researchId,
        isEnabled: config.isEnabled,
        title: config.title,
        message: config.message,
        redirectUrl: config.redirectUrl,
        metadata: config.metadata,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error al crear pantalla de agradecimiento:', error);
      throw new Error('Error al crear la pantalla de agradecimiento');
    }
  }

  /**
   * Obtiene una pantalla de agradecimiento por su ID
   * @param id ID de la pantalla
   * @returns La pantalla de agradecimiento encontrada o null si no existe
   */
  async getById(id: string): Promise<SharedThankYouScreenModel | null> {
    const params = new GetCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `THANK_YOU_SCREEN#${id}`
      }
    });

    try {
      const result = await this.dynamoClient.send(params);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as ThankYouScreenDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz ThankYouScreenRecord
      return {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        redirectUrl: item.redirectUrl,
        metadata: JSON.parse(item.metadata),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error('Error al obtener pantalla de agradecimiento por ID:', error);
      throw new Error('Error al obtener la pantalla de agradecimiento');
    }
  }

  /**
   * Obtiene la pantalla de agradecimiento de una investigación
   * @param researchId ID de la investigación
   * @returns La pantalla de agradecimiento encontrada o null si no existe
   */
  async getByResearchId(researchId: string): Promise<SharedThankYouScreenModel | null> {
    const params = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :researchId',
      FilterExpression: 'begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':researchId': researchId,
        ':prefix': 'THANK_YOU_SCREEN#'
      }
    });

    try {
      const result = await this.dynamoClient.send(params);
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const item = result.Items[0] as ThankYouScreenDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz ThankYouScreenRecord
      return {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        redirectUrl: item.redirectUrl,
        metadata: JSON.parse(item.metadata),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error('Error al obtener pantalla de agradecimiento por Research ID:', error);
      throw new Error('Error al obtener la pantalla de agradecimiento para esta investigación');
    }
  }

  /**
   * Actualiza una pantalla de agradecimiento existente
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @returns La pantalla de agradecimiento actualizada o null si no existe
   */
  async update(id: string, data: Partial<ThankYouScreenConfig>): Promise<SharedThankYouScreenModel | null> {
    // Primero verificamos que la pantalla exista
    const existingScreen = await this.getById(id);
    
    if (!existingScreen) {
      return null;
    }

    // Fecha actual para updated
    const now = new Date().toISOString();
    
    // Actualizamos solo los campos proporcionados
    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Construir expresión de actualización dinámica
    if (data.isEnabled !== undefined) {
      updateExpression.push('#isEnabled = :isEnabled');
      expressionAttributeNames['#isEnabled'] = 'isEnabled';
      expressionAttributeValues[':isEnabled'] = data.isEnabled;
    }

    if (data.title !== undefined) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = data.title;
    }

    if (data.message !== undefined) {
      updateExpression.push('#message = :message');
      expressionAttributeNames['#message'] = 'message';
      expressionAttributeValues[':message'] = data.message;
    }

    if (data.redirectUrl !== undefined) {
      updateExpression.push('#redirectUrl = :redirectUrl');
      expressionAttributeNames['#redirectUrl'] = 'redirectUrl';
      expressionAttributeValues[':redirectUrl'] = data.redirectUrl ?? '';
    }

    // Siempre actualizamos la fecha de última modificación
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    // Actualizamos el metadata si se proporciona
    let metadata = existingScreen.metadata || { version: '1.0.0' };
    if (data.metadata) {
      metadata = {
        ...metadata,
        ...data.metadata
      };
    }
    updateExpression.push('#metadata = :metadata');
    expressionAttributeNames['#metadata'] = 'metadata';
    expressionAttributeValues[':metadata'] = JSON.stringify(metadata);

    const params = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `THANK_YOU_SCREEN#${id}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.dynamoClient.send(params);
      const updatedItem = result.Attributes as ThankYouScreenDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz ThankYouScreenRecord
      return {
        id: updatedItem.id,
        researchId: updatedItem.researchId,
        isEnabled: updatedItem.isEnabled,
        title: updatedItem.title,
        message: updatedItem.message,
        redirectUrl: updatedItem.redirectUrl,
        metadata: JSON.parse(updatedItem.metadata),
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      };
    } catch (error) {
      console.error('Error al actualizar pantalla de agradecimiento:', error);
      throw new Error('Error al actualizar la pantalla de agradecimiento');
    }
  }

  /**
   * Elimina una pantalla de agradecimiento
   * @param id ID de la pantalla de agradecimiento
   * @returns true si se eliminó correctamente
   */
  async delete(id: string): Promise<boolean> {
    const params = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `THANK_YOU_SCREEN#${id}`
      }
    });

    try {
      await this.dynamoClient.send(params);
      return true;
    } catch (error) {
      console.error('Error al eliminar pantalla de agradecimiento:', error);
      throw new Error('Error al eliminar la pantalla de agradecimiento');
    }
  }

  /**
   * Obtiene todas las pantallas de agradecimiento
   * @returns Array con todas las pantallas de agradecimiento
   */
  async getAll(): Promise<SharedThankYouScreenModel[]> {
    try {
      // Usar el cliente de AWS SDK v3 para consultar
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'researchId-index',
        KeyConditionExpression: 'begins_with(sk, :sk)',
        ExpressionAttributeValues: {
          ':sk': 'THANK_YOU_SCREEN#'
        }
      }));
      
      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map(item => {
        const dynamoItem = item as ThankYouScreenDynamoItem;
        return {
          id: dynamoItem.id,
          researchId: dynamoItem.researchId,
          isEnabled: dynamoItem.isEnabled,
          title: dynamoItem.title,
          message: dynamoItem.message,
          redirectUrl: dynamoItem.redirectUrl,
          metadata: JSON.parse(dynamoItem.metadata),
          createdAt: dynamoItem.createdAt,
          updatedAt: dynamoItem.updatedAt
        };
      });
    } catch (error) {
      console.error('Error en thankYouScreenModel.getAll:', error);
      return [];
    }
  }
} 
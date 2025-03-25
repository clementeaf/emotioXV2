import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { ThankYouScreenConfig, ThankYouScreenModel } from '../types/thank-you-screen.types';

/**
 * Servicio para gestionar la pantalla de agradecimiento (Thank You Screen)
 */
export class ThankYouScreenService {
  private dynamoDb: DynamoDB.DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamoDb = new DynamoDB.DocumentClient();
    this.tableName = process.env.THANK_YOU_SCREEN_TABLE_NAME || 'thank-you-screens';
  }

  /**
   * Guardar la configuración de la pantalla de agradecimiento
   * @param researchId ID de la investigación
   * @param userId ID del usuario
   * @param thankYouScreenData Datos de la pantalla de agradecimiento
   * @returns Configuración guardada
   */
  async saveThankYouScreen(
    researchId: string,
    userId: string,
    thankYouScreenData: ThankYouScreenConfig
  ): Promise<ThankYouScreenModel> {
    // Verificar si ya existe una configuración para esta investigación
    const existingScreen = await this.getThankYouScreen(researchId, userId);

    if (existingScreen) {
      // Si existe, actualizamos la configuración existente
      return this.updateThankYouScreen(existingScreen.id, userId, thankYouScreenData);
    } else {
      // Si no existe, creamos una nueva configuración
      const now = new Date().toISOString();
      const id = uuidv4();

      const thankYouScreen: ThankYouScreenModel = {
        id,
        researchId,
        ...thankYouScreenData,
        createdAt: now,
        updatedAt: now
      };

      await this.dynamoDb.put({
        TableName: this.tableName,
        Item: thankYouScreen
      }).promise();

      return thankYouScreen;
    }
  }

  /**
   * Obtener la configuración de la pantalla de agradecimiento por ID de investigación
   * @param researchId ID de la investigación
   * @param userId ID del usuario (para verificar permisos)
   * @returns Configuración de la pantalla de agradecimiento
   */
  async getThankYouScreen(researchId: string, userId: string): Promise<ThankYouScreenModel | null> {
    // Primero, necesitamos encontrar la pantalla por researchId
    const params = {
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex', // Asumimos que hay un índice secundario global
      KeyConditionExpression: 'researchId = :researchId',
      ExpressionAttributeValues: {
        ':researchId': researchId
      }
    };

    try {
      const result = await this.dynamoDb.query(params).promise();
      
      if (result.Items && result.Items.length > 0) {
        // Devolvemos el primer resultado (debería ser único por investigación)
        return result.Items[0] as ThankYouScreenModel;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener thank you screen:', error);
      throw error;
    }
  }

  /**
   * Obtener la configuración de la pantalla de agradecimiento por ID
   * @param id ID de la pantalla de agradecimiento
   * @param userId ID del usuario (para verificar permisos)
   * @returns Configuración de la pantalla de agradecimiento
   */
  async getThankYouScreenById(id: string, userId: string): Promise<ThankYouScreenModel | null> {
    const params = {
      TableName: this.tableName,
      Key: {
        id
      }
    };

    try {
      const result = await this.dynamoDb.get(params).promise();
      
      if (result.Item) {
        return result.Item as ThankYouScreenModel;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener thank you screen por ID:', error);
      throw error;
    }
  }

  /**
   * Actualizar la configuración de la pantalla de agradecimiento
   * @param id ID de la pantalla de agradecimiento
   * @param userId ID del usuario (para verificar permisos)
   * @param thankYouScreenData Nuevos datos de la pantalla de agradecimiento
   * @returns Configuración actualizada
   */
  async updateThankYouScreen(
    id: string,
    userId: string,
    thankYouScreenData: Partial<ThankYouScreenConfig>
  ): Promise<ThankYouScreenModel | null> {
    // Primero verificamos que exista y que el usuario tenga permisos
    const existingScreen = await this.getThankYouScreenById(id, userId);
    
    if (!existingScreen) {
      return null;
    }
    
    // Preparamos la actualización
    const updatedScreen: ThankYouScreenModel = {
      ...existingScreen,
      ...thankYouScreenData,
      updatedAt: new Date().toISOString()
    };
    
    await this.dynamoDb.put({
      TableName: this.tableName,
      Item: updatedScreen
    }).promise();
    
    return updatedScreen;
  }

  /**
   * Eliminar la configuración de la pantalla de agradecimiento
   * @param id ID de la pantalla de agradecimiento
   * @param userId ID del usuario (para verificar permisos)
   * @returns True si se eliminó correctamente, null si no existe o no tiene permisos
   */
  async deleteThankYouScreen(id: string, userId: string): Promise<boolean | null> {
    // Verificamos que exista y que el usuario tenga permisos
    const existingScreen = await this.getThankYouScreenById(id, userId);
    
    if (!existingScreen) {
      return null;
    }
    
    await this.dynamoDb.delete({
      TableName: this.tableName,
      Key: {
        id
      }
    }).promise();
    
    return true;
  }
} 
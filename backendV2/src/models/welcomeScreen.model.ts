import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from 'aws-sdk';
import { 
  WelcomeScreenConfig, 
  WelcomeScreenRecord, 
  WelcomeScreenFormData,
  DEFAULT_WELCOME_SCREEN_CONFIG 
} from '../../../shared/interfaces/welcome-screen.interface';

/**
 * Interfaz para el modelo DynamoDB de una pantalla de bienvenida
 */
export interface WelcomeScreenDynamoItem {
  // Clave primaria (researchId)
  id: string;
  // Clave de ordenación (WELCOME_SCREEN)
  sk: string;
  // Propiedades de la pantalla de bienvenida
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  // Metadata serializado
  metadata: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
}

/**
 * Modelo para manejar las operaciones de pantallas de bienvenida en DynamoDB
 */
export class WelcomeScreenModel {
  private tableName: string;
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor() {
    console.log('======== WELCOME SCREEN MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    console.log('Nombre de tabla DynamoDB para welcome screens:', this.tableName);
    
    // Configuración para DynamoDB en AWS Cloud (producción)
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    console.log('Configuración DynamoDB para welcome screens:', options);
    console.log('SIEMPRE usando DynamoDB en AWS Cloud - NO LOCAL');
    
    this.dynamoClient = new DynamoDBClient(options);
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    console.log('=======================================');
  }

  /**
   * Crea una nueva configuración de pantalla de bienvenida
   * @param data Datos de la pantalla de bienvenida
   * @param researchId ID de la investigación asociada
   * @returns La configuración creada con su ID generado
   */
  async create(data: WelcomeScreenFormData, researchId: string): Promise<WelcomeScreenRecord> {
    // Primero verificamos si ya existe una pantalla de bienvenida para este researchId
    const existingScreen = await this.getByResearchId(researchId);
    if (existingScreen) {
      throw new Error('Ya existe una pantalla de bienvenida para esta investigación');
    }

    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Combinar con valores por defecto
    const config: WelcomeScreenConfig = {
      isEnabled: data.isEnabled ?? DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled,
      title: data.title || DEFAULT_WELCOME_SCREEN_CONFIG.title,
      message: data.message || DEFAULT_WELCOME_SCREEN_CONFIG.message,
      startButtonText: data.startButtonText || DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText,
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date(),
        lastModifiedBy: 'system'
      }
    };

    // Convertir a formato para DynamoDB usando researchId como clave primaria
    const item: WelcomeScreenDynamoItem = {
      id: researchId,
      sk: 'WELCOME_SCREEN',
      isEnabled: config.isEnabled,
      title: config.title,
      message: config.message,
      startButtonText: config.startButtonText,
      metadata: JSON.stringify(config.metadata),
      createdAt: now,
      updatedAt: now
    };

    // Guardar en DynamoDB
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      await this.docClient.send(command);
      
      // Devolver el objeto creado
      return {
        id: researchId,
        researchId,
        isEnabled: config.isEnabled,
        title: config.title,
        message: config.message,
        startButtonText: config.startButtonText,
        metadata: config.metadata,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    } catch (error) {
      console.error('Error al crear pantalla de bienvenida:', error);
      throw new Error('Error al crear la pantalla de bienvenida');
    }
  }

  /**
   * Obtiene una pantalla de bienvenida por su ID
   * @param id ID de la pantalla de bienvenida
   * @returns La pantalla de bienvenida encontrada o null
   */
  async getById(id: string): Promise<WelcomeScreenRecord | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `WELCOME_SCREEN#${id}`
      }
    });

    try {
      const result = await this.docClient.send(command);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as WelcomeScreenDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz WelcomeScreenRecord
      return {
        id: item.id,
        researchId: item.id,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText,
        metadata: JSON.parse(item.metadata),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener pantalla de bienvenida por ID:', error);
      throw new Error('Error al obtener la pantalla de bienvenida');
    }
  }

  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación
   * @param researchId ID de la investigación
   * @returns La pantalla de bienvenida asociada o null
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id: researchId,
        sk: 'WELCOME_SCREEN'
      }
    });

    try {
      const result = await this.docClient.send(command);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as WelcomeScreenDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz WelcomeScreenRecord
      return {
        id: item.id,
        researchId: item.id,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText,
        metadata: JSON.parse(item.metadata),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener pantalla de bienvenida por researchId:', error);
      throw new Error('Error al obtener la pantalla de bienvenida');
    }
  }

  /**
   * Actualiza una pantalla de bienvenida existente
   * @param researchId ID de la investigación
   * @param data Datos a actualizar
   * @returns La pantalla de bienvenida actualizada
   */
  async update(researchId: string, data: Partial<WelcomeScreenFormData>): Promise<WelcomeScreenRecord> {
    // Verificar que existe
    const existingScreen = await this.getByResearchId(researchId);
    if (!existingScreen) {
      throw new Error('No existe una pantalla de bienvenida para esta investigación');
    }

    const now = new Date().toISOString();

    // Preparar expresiones de actualización
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: any = {
      ':updatedAt': now
    };

    if (data.isEnabled !== undefined) {
      updateExpression += ', isEnabled = :isEnabled';
      expressionAttributeValues[':isEnabled'] = data.isEnabled;
    }
    if (data.title !== undefined) {
      updateExpression += ', title = :title';
      expressionAttributeValues[':title'] = data.title;
    }
    if (data.message !== undefined) {
      updateExpression += ', message = :message';
      expressionAttributeValues[':message'] = data.message;
    }
    if (data.startButtonText !== undefined) {
      updateExpression += ', startButtonText = :startButtonText';
      expressionAttributeValues[':startButtonText'] = data.startButtonText;
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: researchId,
        sk: 'WELCOME_SCREEN'
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.docClient.send(command);
      const updatedItem = result.Attributes as WelcomeScreenDynamoItem;

      return {
        id: updatedItem.id,
        researchId: updatedItem.id,
        isEnabled: updatedItem.isEnabled,
        title: updatedItem.title,
        message: updatedItem.message,
        startButtonText: updatedItem.startButtonText,
        metadata: JSON.parse(updatedItem.metadata),
        createdAt: new Date(updatedItem.createdAt),
        updatedAt: new Date(updatedItem.updatedAt)
      };
    } catch (error) {
      console.error('Error al actualizar pantalla de bienvenida:', error);
      throw new Error('Error al actualizar la pantalla de bienvenida');
    }
  }

  /**
   * Elimina una pantalla de bienvenida por su ID
   * @param id ID de la pantalla de bienvenida
   */
  async delete(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `WELCOME_SCREEN#${id}`
      }
    });

    try {
      await this.docClient.send(command);
    } catch (error) {
      console.error('Error al eliminar pantalla de bienvenida:', error);
      throw new Error('Error al eliminar la pantalla de bienvenida');
    }
  }

  /**
   * Crea o actualiza la pantalla de bienvenida para una investigación
   * @param researchId ID de la investigación
   * @param data Datos de la pantalla de bienvenida
   * @returns La pantalla de bienvenida creada o actualizada
   */
  async createOrUpdate(researchId: string, data: WelcomeScreenFormData): Promise<WelcomeScreenRecord> {
    try {
      // Buscar si ya existe una pantalla para esta investigación
      const existing = await this.getByResearchId(researchId);
      
      if (existing) {
        // Actualizar la existente
        return await this.update(researchId, data);
      } else {
        // Crear una nueva
        return await this.create(data, researchId);
      }
    } catch (error) {
      console.error('Error al crear o actualizar pantalla de bienvenida:', error);
      throw new Error('Error al procesar la pantalla de bienvenida');
    }
  }

  /**
   * Obtiene todas las pantallas de bienvenida
   * @returns Array con todas las pantallas de bienvenida
   */
  async getAll(): Promise<WelcomeScreenRecord[]> {
    try {
      const db = getDB();
      const params = {
        TableName: process.env.DYNAMODB_TABLE || '',
        IndexName: 'sk-index', // Asegúrate de que este índice exista en DynamoDB
        KeyConditionExpression: 'sk = :sk',
        ExpressionAttributeValues: {
          ':sk': 'WELCOME_SCREEN'
        }
      };

      const result = await db.query(params).promise();
      
      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map(item => ({
        id: item.id,
        researchId: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText
      }));
    } catch (error) {
      console.error('Error en welcomeScreenModel.getAll:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del modelo
export const welcomeScreenModel = new WelcomeScreenModel();

// Función helper para obtener la instancia de DynamoDB
const getDB = (): DynamoDB.DocumentClient => {
  const options: DynamoDB.DocumentClient.DocumentClientOptions & { region?: string; endpoint?: string } = {};
  
  // Para entornos de desarrollo local
  if (process.env.IS_OFFLINE === 'true') {
    options.region = 'localhost';
    options.endpoint = 'http://localhost:8000';
  }
  
  return new DynamoDB.DocumentClient(options);
}; 
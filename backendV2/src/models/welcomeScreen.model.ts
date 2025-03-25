import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuración de la pantalla de bienvenida
 */
export interface WelcomeScreenConfig {
  /**
   * Si la pantalla de bienvenida está habilitada
   */
  isEnabled: boolean;

  /**
   * Título a mostrar en la pantalla de bienvenida
   */
  title: string;

  /**
   * Mensaje principal/descripción para mostrar a los participantes
   */
  message: string;

  /**
   * Texto a mostrar en el botón de inicio
   */
  startButtonText: string;

  /**
   * Metadatos opcionales
   */
  metadata?: {
    /**
     * Última vez que se actualizó la configuración
     */
    lastUpdated?: Date;

    /**
     * Versión de la configuración
     */
    version?: string;

    /**
     * Usuario que modificó por última vez la configuración
     */
    lastModifiedBy?: string;
  };
}

/**
 * Configuración predeterminada de la pantalla de bienvenida
 */
export const DEFAULT_WELCOME_SCREEN_CONFIG: WelcomeScreenConfig = {
  isEnabled: false,
  title: '',
  message: '',
  startButtonText: 'Iniciar Investigación',
  metadata: {
    version: '1.0.0'
  }
};

/**
 * Datos del formulario de pantalla de bienvenida
 */
export interface WelcomeScreenFormData extends Omit<WelcomeScreenConfig, 'metadata'> {
  /**
   * ID de la investigación asociada (opcional en el formulario, requerido para crear)
   */
  researchId?: string;
}

/**
 * Registro de pantalla de bienvenida
 */
export interface WelcomeScreenRecord extends WelcomeScreenConfig {
  /**
   * ID de la investigación a la que pertenece esta pantalla
   */
  researchId: string;

  /**
   * Identificador único para la configuración de la pantalla
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
 * Interfaz para el modelo DynamoDB de una pantalla de bienvenida
 */
export interface WelcomeScreenDynamoItem {
  // Clave primaria
  id: string;
  // Clave de ordenación
  sk: string;
  // Research ID relacionado
  researchId: string;
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
  private dynamoClient: DynamoDB.DocumentClient;

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
    
    this.dynamoClient = new DynamoDB.DocumentClient(options);
    console.log('=======================================');
  }

  /**
   * Crea una nueva configuración de pantalla de bienvenida
   * @param data Datos de la pantalla de bienvenida
   * @param researchId ID de la investigación asociada
   * @returns La configuración creada con su ID generado
   */
  async create(data: WelcomeScreenFormData, researchId: string): Promise<WelcomeScreenRecord> {
    // Generar ID único para la pantalla de bienvenida
    const screenId = uuidv4();
    
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

    // Convertir a formato para DynamoDB
    const item: WelcomeScreenDynamoItem = {
      id: screenId,
      sk: `WELCOME_SCREEN#${screenId}`,
      researchId,
      isEnabled: config.isEnabled,
      title: config.title,
      message: config.message,
      startButtonText: config.startButtonText,
      metadata: JSON.stringify(config.metadata),
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
        id: screenId,
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
    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: {
        id,
        sk: `WELCOME_SCREEN#${id}`
      }
    };

    try {
      const result = await this.dynamoClient.get(params).promise();
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as WelcomeScreenDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz WelcomeScreenRecord
      return {
        id: item.id,
        researchId: item.researchId,
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
    // Consulta por índice secundario (requiere GSI en DynamoDB)
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :researchId',
      ExpressionAttributeValues: {
        ':researchId': researchId
      }
    };

    try {
      const result = await this.dynamoClient.query(params).promise();
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      // Solo nos interesa el primer resultado (debería ser único por investigación)
      const item = result.Items[0] as WelcomeScreenDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz WelcomeScreenRecord
      return {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText,
        metadata: JSON.parse(item.metadata),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener pantalla de bienvenida por ResearchId:', error);
      throw new Error('Error al obtener la pantalla de bienvenida');
    }
  }

  /**
   * Actualiza una pantalla de bienvenida existente
   * @param id ID de la pantalla de bienvenida
   * @param data Datos a actualizar
   * @returns La pantalla de bienvenida actualizada
   */
  async update(id: string, data: Partial<WelcomeScreenFormData>): Promise<WelcomeScreenRecord> {
    try {
      // Verificar que la pantalla existe
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('Pantalla de bienvenida no encontrada');
      }

      // Fecha actual para updated
      const now = new Date().toISOString();
      
      // Preparar expresiones para actualización
      let updateExpression = 'set updatedAt = :updatedAt';
      const expressionAttributeValues: Record<string, any> = {
        ':updatedAt': now
      };
      
      // Actualizar metadata
      const updatedMetadata = {
        ...existing.metadata,
        lastUpdated: new Date(),
      };
      updateExpression += ', metadata = :metadata';
      expressionAttributeValues[':metadata'] = JSON.stringify(updatedMetadata);
      
      // Añadir solo los campos que vienen en data
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
      
      // Parámetros para la actualización
      const params: DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: this.tableName,
        Key: {
          id,
          sk: `WELCOME_SCREEN#${id}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };
      
      // Ejecutar actualización
      const result = await this.dynamoClient.update(params).promise();
      
      // Convertir resultado a formato de interfaz
      const updated = result.Attributes as WelcomeScreenDynamoItem;
      return {
        id: updated.id,
        researchId: updated.researchId,
        isEnabled: updated.isEnabled,
        title: updated.title,
        message: updated.message,
        startButtonText: updated.startButtonText,
        metadata: JSON.parse(updated.metadata),
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt)
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
    const params: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.tableName,
      Key: {
        id,
        sk: `WELCOME_SCREEN#${id}`
      }
    };

    try {
      await this.dynamoClient.delete(params).promise();
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
        return await this.update(existing.id, data);
      } else {
        // Crear una nueva
        return await this.create(data, researchId);
      }
    } catch (error) {
      console.error('Error al crear o actualizar pantalla de bienvenida:', error);
      throw new Error('Error al procesar la pantalla de bienvenida');
    }
  }
}

// Exportar una instancia única del modelo
export const welcomeScreenModel = new WelcomeScreenModel(); 
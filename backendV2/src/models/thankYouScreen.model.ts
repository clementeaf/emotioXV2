import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  ThankYouScreenConfig,
  ThankYouScreenModel as SharedThankYouScreenModel,
  ThankYouScreenFormData,
  DEFAULT_THANK_YOU_SCREEN_CONFIG,
} from '../../../shared/interfaces/thank-you-screen.interface';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';

/**
 * Interfaz para el modelo DynamoDB de una pantalla de agradecimiento
 */
export interface ThankYouScreenDynamoItem {
  // Clave primaria (UUID único)
  id: string;
  // Clave de ordenación (constante para este tipo)
  sk: string;
  // Research ID relacionado
  researchId: string;
  // Propiedades de la pantalla de agradecimiento
  isEnabled: boolean;
  title: string;
  message: string;
  redirectUrl?: string; // Hacer opcional si puede no estar
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
};

/**
 * Modelo para manejar las operaciones de pantallas de agradecimiento en DynamoDB
 */
export class ThankYouScreenModel {
  private tableName: string;
  private dynamoClient: DynamoDBDocumentClient;
  private static readonly SORT_KEY_VALUE = 'THANK_YOU_SCREEN'; // Definir SK constante
  private modelName = 'ThankYouScreenModel'; // Para logging

  constructor() {
    const context = 'constructor';
    structuredLog('info', `${this.modelName}.${context}`, 'Inicializando modelo');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    structuredLog('info', `${this.modelName}.${context}`, `Usando tabla: ${this.tableName}`);
    
    // Configuración para DynamoDB en AWS Cloud (producción)
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    structuredLog('info', `${this.modelName}.${context}`, 'Configuración DynamoDB', { options });
    structuredLog('info', `${this.modelName}.${context}`, 'SIEMPRE usando DynamoDB en AWS Cloud - NO LOCAL');
    
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
  }

  /**
   * Crea una nueva configuración de pantalla de agradecimiento
   * @param data Datos de la pantalla de agradecimiento
   * @param researchId ID de la investigación asociada
   * @returns La configuración creada con su ID generado
   */
  async create(data: ThankYouScreenFormData, researchId: string): Promise<SharedThankYouScreenModel> {
    const context = 'create';
    const screenId = uuidv4();
    const now = new Date().toISOString();
    
    // Consistencia con welcomeScreen: usar valores por defecto si no se proporcionan
    const config: ThankYouScreenConfig = {
      isEnabled: data.isEnabled ?? DEFAULT_THANK_YOU_SCREEN_CONFIG.isEnabled,
      title: data.title || DEFAULT_THANK_YOU_SCREEN_CONFIG.title,
      message: data.message || DEFAULT_THANK_YOU_SCREEN_CONFIG.message,
      redirectUrl: data.redirectUrl || DEFAULT_THANK_YOU_SCREEN_CONFIG.redirectUrl,
      metadata: { // Estructura metadata consistente
        version: '1.0.0',
        lastUpdated: new Date(),
        lastModifiedBy: 'system' // O userId si está disponible
      }
    };

    // Convertir a formato para DynamoDB
    const item: ThankYouScreenDynamoItem = {
      id: screenId,
      sk: ThankYouScreenModel.SORT_KEY_VALUE, // Usar SK constante
      researchId,
      isEnabled: config.isEnabled,
      title: config.title,
      message: config.message,
      redirectUrl: config.redirectUrl,
      metadata: JSON.stringify(config.metadata),
      createdAt: now,
      updatedAt: now
    };

    // Guardar en DynamoDB
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
      // Podríamos añadir ConditionExpression: 'attribute_not_exists(id)' si quisiéramos
    });

    try {
      await this.dynamoClient.send(command);
      
      // Devolver el objeto creado con su ID
      const createdRecord = {
        id: screenId,
        researchId,
        isEnabled: config.isEnabled,
        title: config.title,
        message: config.message,
        redirectUrl: config.redirectUrl,
        metadata: config.metadata, // Devolver objeto
        // Asegurar que createdAt/updatedAt sean string o Date según la interfaz
        createdAt: now, 
        updatedAt: now
      };
      structuredLog('info', `${this.modelName}.${context}`, 'Pantalla de agradecimiento creada', { id: screenId, researchId });
      return createdRecord;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'ERROR DETALLADO de DynamoDB PutCommand (ThankYouScreen)', { error: error, researchId });
      structuredLog('error', `${this.modelName}.${context}`, 'Error al crear pantalla de agradecimiento', { error: error, researchId });
      throw new ApiError(`DATABASE_ERROR: Error al crear la pantalla de agradecimiento: ${error.message}`, 500);
    }
  }

  /**
   * Obtiene una pantalla de agradecimiento por su ID único (UUID)
   * @param id ID único (UUID) de la pantalla
   * @returns La pantalla de agradecimiento encontrada o null si no existe
   */
  async getById(id: string): Promise<SharedThankYouScreenModel | null> {
    const context = 'getById';
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: ThankYouScreenModel.SORT_KEY_VALUE // Usar SK constante
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as ThankYouScreenDynamoItem;
      
      // Convertir de formato DynamoDB
      const record = {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        redirectUrl: item.redirectUrl,
        metadata: JSON.parse(item.metadata || '{}'),
        createdAt: item.createdAt, // Mantener string si la interfaz lo espera
        updatedAt: item.updatedAt
      };
      structuredLog('debug', `${this.modelName}.${context}`, 'Pantalla encontrada por ID', { id });
      return record;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error al obtener pantalla por ID', { error: error, id });
      throw new ApiError(`DATABASE_ERROR: Error al obtener la pantalla de agradecimiento por ID: ${error.message}`, 500);
    }
  }

  /**
   * Obtiene la pantalla de agradecimiento de una investigación usando GSI
   * @param researchId ID de la investigación
   * @returns La pantalla de agradecimiento encontrada o null si no existe
   */
  async getByResearchId(researchId: string): Promise<SharedThankYouScreenModel | null> {
    const context = 'getByResearchId';

    // *** INICIO LOGS ADICIONALES ***
    console.log(`[${this.modelName}.${context}] Iniciando búsqueda para researchId: ${researchId}`);
    // *** FIN LOGS ADICIONALES ***

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :rid',
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: {
        ':rid': researchId,
        ':skVal': ThankYouScreenModel.SORT_KEY_VALUE // Filtrar por SK="THANK_YOU_SCREEN"
      }
    });

    // *** INICIO LOGS ADICIONALES ***
    console.log(`[${this.modelName}.${context}] Parámetros QueryCommand:`, JSON.stringify(command.input));
    // *** FIN LOGS ADICIONALES ***

    try {
      const result = await this.dynamoClient.send(command);

      // *** INICIO LOGS ADICIONALES ***
      console.log(`[${this.modelName}.${context}] Respuesta cruda DynamoDB:`, JSON.stringify(result));
      // *** FIN LOGS ADICIONALES ***

      if (!result.Items || result.Items.length === 0) {
         // *** INICIO LOGS ADICIONALES ***
         console.warn(`[${this.modelName}.${context}] No se encontraron items después de la consulta y filtro para researchId: ${researchId}`);
         // *** FIN LOGS ADICIONALES ***
        return null;
      }

      const item = result.Items[0] as ThankYouScreenDynamoItem;
      
      // Convertir de formato DynamoDB
      const record = {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        redirectUrl: item.redirectUrl,
        metadata: JSON.parse(item.metadata || '{}'),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
      structuredLog('debug', `${this.modelName}.${context}`, 'Pantalla encontrada por ResearchID', { researchId, id: item.id });
      return record;
    } catch (error: any) {
       // *** INICIO LOGS ADICIONALES ***
       console.error(`[${this.modelName}.${context}] Error durante la ejecución de DynamoDB QueryCommand`, { error });
       // *** FIN LOGS ADICIONALES ***
      structuredLog('error', `${this.modelName}.${context}`, 'Error al obtener pantalla por Research ID (Query GSI)', { error: error, researchId });
      if ((error as Error).message?.includes('index')) {
         structuredLog('error', `${this.modelName}.${context}`, 'Índice GSI researchId-index no encontrado');
         throw new ApiError("DATABASE_ERROR: Error de configuración de base de datos: falta índice para búsqueda.", 500);
      }
      throw new ApiError(`DATABASE_ERROR: Error al obtener la pantalla de agradecimiento para esta investigación: ${error.message}`, 500);
    }
  }

  /**
   * Actualiza una pantalla de agradecimiento existente usando su ID único (UUID)
   * @param id ID único (UUID) de la pantalla
   * @param data Datos a actualizar (parcial)
   * @returns La pantalla de agradecimiento actualizada o null si no existe
   */
  async update(id: string, data: Partial<ThankYouScreenFormData>): Promise<SharedThankYouScreenModel | null> {
    const context = 'update';
    // Verificar que existe usando el ID único y SK constante
    const existingScreen = await this.getById(id);
    if (!existingScreen) {
      return null; // O lanzar error si se prefiere
    }

    const now = new Date().toISOString();
    
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };
    // const expressionAttributeNames: Record<string, string> = {}; // Descomentar si se usan nombres reservados

    // Construir expresión de actualización dinámica (simplificado)
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
    if (data.redirectUrl !== undefined) {
      updateExpression += ', redirectUrl = :redirectUrl';
      expressionAttributeValues[':redirectUrl'] = data.redirectUrl;
    }
    // Actualizar metadata de forma consistente
    if (data.metadata !== undefined) {
       updateExpression += ', metadata = :metadata';
       expressionAttributeValues[':metadata'] = JSON.stringify({ 
           ...(existingScreen.metadata || {}), 
           ...data.metadata,
           lastUpdated: new Date(), 
       });
    } else {
        updateExpression += ', metadata = :metadata';
        expressionAttributeValues[':metadata'] = JSON.stringify({
            ...(existingScreen.metadata || {}),
            lastUpdated: new Date(),
        });
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: ThankYouScreenModel.SORT_KEY_VALUE // Usar SK constante
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      // ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ReturnValues: 'ALL_NEW' 
    });

    try {
      const result = await this.dynamoClient.send(command);
      const updatedAttributes = result.Attributes as ThankYouScreenDynamoItem;
      if (!updatedAttributes) {
        throw new Error('La actualización no devolvió los atributos actualizados.');
      }
      // Convertir a formato de retorno
      const record = {
        id: updatedAttributes.id,
        researchId: updatedAttributes.researchId,
        isEnabled: updatedAttributes.isEnabled,
        title: updatedAttributes.title,
        message: updatedAttributes.message,
        redirectUrl: updatedAttributes.redirectUrl,
        metadata: JSON.parse(updatedAttributes.metadata || '{}'),
        createdAt: updatedAttributes.createdAt,
        updatedAt: updatedAttributes.updatedAt
      };
      structuredLog('info', `${this.modelName}.${context}`, 'Pantalla actualizada', { id });
      return record;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'ERROR DETALLADO de DynamoDB UpdateCommand (ThankYouScreen)', { error: error, id });
      structuredLog('error', `${this.modelName}.${context}`, 'Error al actualizar pantalla de agradecimiento', { error: error, id });
      throw new ApiError(`DATABASE_ERROR: Error al actualizar la pantalla de agradecimiento: ${error.message}`, 500);
    }
  }

  /**
   * Elimina una pantalla de agradecimiento por su ID único (UUID)
   * @param id ID único (UUID) de la pantalla
   * @returns true si se eliminó, false si no se encontró
   */
  async delete(id: string): Promise<boolean> {
    const context = 'delete';
    // Verificar existencia
    const existingScreen = await this.getById(id);
    if (!existingScreen) {
      return false;
    }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: ThankYouScreenModel.SORT_KEY_VALUE // Usar SK constante
      }
    });

    try {
      await this.dynamoClient.send(command);
      structuredLog('info', `${this.modelName}.${context}`, 'Pantalla eliminada', { id });
      return true;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'ERROR DETALLADO de DynamoDB DeleteCommand (ThankYouScreen)', { error: error, id });
      structuredLog('error', `${this.modelName}.${context}`, 'Error al eliminar pantalla de agradecimiento', { error: error, id });
      throw new ApiError(`DATABASE_ERROR: Error al eliminar la pantalla de agradecimiento: ${error.message}`, 500);
    }
  }

  // Eliminar getAll o refactorizar si es necesario (Scan es ineficiente)
  async getAll(): Promise<SharedThankYouScreenModel[]> {
    structuredLog('warn', `${this.modelName}.getAll`, 'getAll() llamado - Operación Scan ineficiente.');
    return [];
  }
}

// Exportar una instancia única del modelo
export const thankYouScreenModel = new ThankYouScreenModel(); 
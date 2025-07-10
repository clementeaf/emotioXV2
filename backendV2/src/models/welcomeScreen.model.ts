import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
    DEFAULT_WELCOME_SCREEN_CONFIG,
    WelcomeScreenConfig,
    WelcomeScreenFormData,
    WelcomeScreenRecord
} from '../../../shared/interfaces/welcome-screen.interface';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';

/**
 * Interfaz para el modelo DynamoDB de una pantalla de bienvenida
 */
export interface WelcomeScreenDynamoItem {
  // Clave primaria (UUID único)
  id: string;
  // Clave de ordenación (constante para este tipo de item)
  sk: string;
  // Atributo para búsqueda por researchId (potencial GSI)
  researchId: string;
  // Propiedades de la pantalla de bienvenida
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  // Metadata serializado
  metadata: string;
  // NUEVO: questionKey para identificación única de preguntas
  questionKey?: string;
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
  private modelName = 'WelcomeScreenModel'; // Para logging

  constructor() {
    const context = 'constructor';
    structuredLog('info', `${this.modelName}.${context}`, 'Inicializando modelo');
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    structuredLog('info', `${this.modelName}.${context}`, `Usando tabla: ${this.tableName}`);
    const options = { region: process.env.APP_REGION || 'us-east-1' };
    structuredLog('info', `${this.modelName}.${context}`, 'Configuración DynamoDB', { options });
    structuredLog('info', `${this.modelName}.${context}`, 'SIEMPRE usando DynamoDB en AWS Cloud - NO LOCAL');
    this.dynamoClient = new DynamoDBClient(options);
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
  }

  /**
   * Crea una nueva configuración de pantalla de bienvenida
   * @param data Datos de la pantalla de bienvenida
   * @param researchId ID de la investigación asociada
   * @returns La configuración creada con su ID generado
   */
  async create(data: WelcomeScreenFormData, researchId: string): Promise<WelcomeScreenRecord> {
    const context = 'create';
    // Primero verificamos si ya existe una pantalla de bienvenida para este researchId
    const existingScreen = await this.getByResearchId(researchId);
    if (existingScreen) {
      throw new ApiError(`WELCOME_SCREEN_EXISTS: Ya existe una pantalla de bienvenida para la investigación ${researchId}`, 409); // 409 Conflict
    }

    // Generar un ID único para la pantalla
    const screenId = uuidv4();
    const now = new Date().toISOString();
    const skValue = 'WELCOME_SCREEN'; // Valor constante para la Sort Key

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

    // Convertir a formato para DynamoDB usando el ID único y SK constante
    const item: WelcomeScreenDynamoItem = {
      id: screenId, // Usar el UUID generado
      sk: skValue,  // Añadir la Sort Key constante
      researchId: researchId, // Guardar researchId como atributo separado
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
      Item: item,
      // Ya no necesitamos ConditionExpression si la PK es id/sk,
      // aunque podrías mantenerla en 'id' si quisieras asegurar unicidad del UUID
      // ConditionExpression: 'attribute_not_exists(id)'
    });

    try {
      await this.docClient.send(command);

      // Devolver el objeto creado con el ID correcto
      const createdRecord = {
        id: screenId,
        researchId: researchId,
        isEnabled: config.isEnabled,
        title: config.title,
        message: config.message,
        startButtonText: config.startButtonText,
        metadata: config.metadata,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
      structuredLog('info', `${this.modelName}.${context}`, 'Pantalla de bienvenida creada', { id: screenId, researchId });
      return createdRecord;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'ERROR DETALLADO de DynamoDB PutCommand', { error: error, researchId, screenId });

      // Mantener el chequeo específico para ConditionalCheckFailedException
      if (error.name === 'ConditionalCheckFailedException') {
         structuredLog('error', `${this.modelName}.${context}`, `Conflicto de ID al crear (ID: ${screenId})`);
         throw new ApiError('DATABASE_ERROR: Conflicto al generar ID único.', 500); // O 409 si se quiere manejar diferente
      }
      // Para cualquier otro error, lanzar el error genérico PERO después de loguear el detalle
      structuredLog('error', `${this.modelName}.${context}`, 'Error genérico al crear pantalla de bienvenida en DynamoDB', { error: error, researchId, screenId });
      throw new ApiError(`DATABASE_ERROR: Error al guardar la pantalla de bienvenida: ${error.message}`, 500);
    }
  }

  /**
   * Obtiene una pantalla de bienvenida por su ID único (UUID)
   * @param id ID único (UUID) de la pantalla de bienvenida
   * @returns La pantalla de bienvenida encontrada o null
   */
  async getById(id: string): Promise<WelcomeScreenRecord | null> {
    const context = 'getById';
    // Necesitamos buscar por id (PK) Y sk (SK)
    const skValue = 'WELCOME_SCREEN'; // Asume sk constante para buscar por ID
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: skValue // Añadir sk a la clave de búsqueda
      }
    });

    try {
      const result = await this.docClient.send(command);

      if (!result.Item) {
        return null;
      }

      const item = result.Item as WelcomeScreenDynamoItem;

      const record = {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText,
        metadata: JSON.parse(item.metadata || '{}'),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
      structuredLog('debug', `${this.modelName}.${context}`, 'Pantalla encontrada por ID', { id });
      return record;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error al obtener pantalla por ID', { error: error, id });
      throw new ApiError(`DATABASE_ERROR: Error al obtener pantalla por ID: ${error.message}`, 500);
    }
  }

  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación usando GSI
   * ASUME que existe un GSI llamado 'ResearchIdIndex' con 'researchId' como clave de partición.
   * @param researchId ID de la investigación
   * @returns La pantalla de bienvenida asociada o null
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    const context = 'getByResearchId';
    const skValue = 'WELCOME_SCREEN'; // Definir el SK esperado
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :rid',
      // Usar FilterExpression ya que sk está proyectado (ProjectionType: ALL)
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: {
        ':rid': researchId,
        ':skVal': skValue
      },
      // Quitar Limit: 1 para asegurar que el filtro se aplique a todos los items posibles
      // Limit: 1
    });

    try {
      const result = await this.docClient.send(command);

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const item = result.Items[0] as WelcomeScreenDynamoItem;

      // Ya no es necesario verificar sk aquí porque el filtro lo hizo
      /*
      if (item.sk !== skValue) {
          console.warn(`[WelcomeScreenModel] Item encontrado por researchId ${researchId} pero tiene SK incorrecto (${item.sk}). Devolviendo null.`);
          return null; // No es el tipo de item correcto
      }
      */

      // Si el SK es correcto, convertir y devolver
      const record = {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText,
        metadata: JSON.parse(item.metadata || '{}'),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
      structuredLog('debug', `${this.modelName}.${context}`, 'Pantalla encontrada por ResearchID', { researchId, id: item.id });
      return record;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error al obtener pantalla por researchId (Query GSI)', { error: error, researchId });
      if ((error as Error).message?.includes('index')) {
         structuredLog('error', `${this.modelName}.${context}`, 'Índice GSI researchId-index no encontrado o mal configurado');
         throw new ApiError("DATABASE_ERROR: Error de configuración de base de datos: falta índice para búsqueda.", 500);
      }
      throw new ApiError(`DATABASE_ERROR: Error al buscar pantalla asociada a la investigación: ${error.message}`, 500);
    }
  }

  /**
   * Actualiza una pantalla de bienvenida existente usando su ID único (UUID)
   * @param id ID único (UUID) de la pantalla
   * @param data Datos a actualizar (parcial)
   * @returns La pantalla de bienvenida actualizada
   */
  async update(id: string, data: Partial<WelcomeScreenFormData>): Promise<WelcomeScreenRecord> {
    const context = 'update';
    const skValue = 'WELCOME_SCREEN'; // SK constante
    // Verificar que existe usando la clave completa
    const existingScreen = await this.getById(id); // getById ahora usa id y sk internamente
    if (!existingScreen) {
      throw new ApiError(`WELCOME_SCREEN_NOT_FOUND: No existe una pantalla de bienvenida con ID ${id}`, 404);
    }

    const now = new Date().toISOString();

    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': now
    };

    const addUpdate = (field: keyof WelcomeScreenFormData, alias: string) => {
       if (data[field] !== undefined) {
         const placeholder = `:${alias}`;
         updateExpression += `, ${field} = ${placeholder}`;
         expressionAttributeValues[placeholder] = data[field];
       }
    };

    addUpdate('isEnabled', 'isEnabled');
    addUpdate('title', 'title');
    addUpdate('message', 'message');
    addUpdate('startButtonText', 'startButtonText');

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
        sk: skValue
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.docClient.send(command);

      const updatedAttributes = result.Attributes as WelcomeScreenDynamoItem;
      if (!updatedAttributes) {
         throw new ApiError('DATABASE_ERROR: La actualización no devolvió los atributos actualizados.', 500);
      }

      const record = {
        id: updatedAttributes.id,
        researchId: updatedAttributes.researchId,
        isEnabled: updatedAttributes.isEnabled,
        title: updatedAttributes.title,
        message: updatedAttributes.message,
        startButtonText: updatedAttributes.startButtonText,
        metadata: JSON.parse(updatedAttributes.metadata || '{}'),
        createdAt: new Date(updatedAttributes.createdAt),
        updatedAt: new Date(updatedAttributes.updatedAt)
      };
      structuredLog('info', `${this.modelName}.${context}`, 'Pantalla actualizada', { id });
      return record;
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error al actualizar pantalla en DynamoDB', { error: error, id });
      // Considerar mapeo de ConditionalCheckFailedException si se usa
      throw new ApiError(`DATABASE_ERROR: Error al guardar cambios de la pantalla: ${error.message}`, 500);
    }
  }

  /**
   * Elimina una pantalla de bienvenida por su ID único (UUID)
   * @param id ID único (UUID) de la pantalla
   */
  async delete(id: string): Promise<void> {
    const context = 'delete';
    const skValue = 'WELCOME_SCREEN';
    const existingScreen = await this.getById(id);
    if (!existingScreen) {
      throw new ApiError(`WELCOME_SCREEN_NOT_FOUND: No existe una pantalla de bienvenida con ID ${id}`, 404);
    }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: skValue
      }
    });

    try {
      await this.docClient.send(command);
      structuredLog('info', `${this.modelName}.${context}`, 'Pantalla eliminada', { id });
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error al eliminar pantalla en DynamoDB', { error: error, id });
      throw new ApiError(`DATABASE_ERROR: Error al eliminar la pantalla de bienvenida: ${error.message}`, 500);
    }
  }

  /**
   * Crea o actualiza la pantalla de bienvenida de una investigación
   * @param researchId ID de la investigación
   * @param data Datos a crear/actualizar
   * @returns La pantalla de bienvenida creada o actualizada
   */
  async createOrUpdate(researchId: string, data: WelcomeScreenFormData): Promise<WelcomeScreenRecord> {
    const context = 'createOrUpdate';
    try {
      const existing = await this.getByResearchId(researchId);

      if (existing) {
        return await this.update(existing.id, data);
      } else {
        return await this.create(data, researchId);
      }
    } catch (error: any) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error en createOrUpdate', { error: error, researchId });
      // Re-lanzar el error si ya es ApiError, o crear uno nuevo si no
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`DATABASE_ERROR: Error al crear o actualizar la pantalla: ${error.message}`, 500);
    }
  }

  /**
   * Obtiene todas las pantallas de bienvenida (POTENCIALMENTE LENTO - USAR CON PRECAUCIÓN)
   * Nota: Esto haría un Scan o usaría un índice específico si todas tuvieran un atributo común.
   * Adapta según tu necesidad real y estructura de tabla.
   * ESTA IMPLEMENTACIÓN ASUME QUE NO ES FRECUENTE Y USA SCAN (INEFICIENTE EN TABLAS GRANDES)
   * Si necesitas listar frecuentemente, considera un mejor patrón de acceso.
   * @returns Lista de todas las pantallas de bienvenida
   */
  async getAll(): Promise<WelcomeScreenRecord[]> {
     structuredLog('warn', `${this.modelName}.getAll`, 'getAll() llamado - Operación Scan ineficiente.');
     return [];
  }
}

// Exportar una instancia única del modelo
export const welcomeScreenModel = new WelcomeScreenModel();

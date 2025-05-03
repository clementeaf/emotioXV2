import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand, 
  UpdateCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { structuredLog } from '../utils/logging.util';
import { ApiError } from '../utils/errors';
import {
  DemographicQuestions,
  LinkConfig,
  ParticipantLimit,
  Backlinks,
  ParameterOptions,
  EyeTrackingRecruitConfig
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';

/**
 * Estructura principal de la configuración de Eye Tracking
 * (Reutilizamos EyeTrackingRecruitConfig de la interfaz compartida)
 */
export interface EyeTrackingFormData extends EyeTrackingRecruitConfig {
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    lastModifiedBy?: string;
  };
}

/**
 * Configuración predeterminada de eye tracking
 */
export const DEFAULT_EYE_TRACKING_CONFIG: EyeTrackingFormData = {
  researchId: '',
  demographicQuestions: {
    age: {
      enabled: false,
      required: false,
      options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    },
    country: {
      enabled: false,
      required: false,
      options: ['ES', 'MX', 'AR', 'CO', 'CL', 'PE']
    },
    gender: {
      enabled: false,
      required: false,
      options: ['M', 'F', 'O', 'P']
    },
    educationLevel: {
      enabled: false,
      required: false,
      options: ['1', '2', '3', '4', '5', '6', '7']
    },
    householdIncome: {
      enabled: false,
      required: false,
      options: ['1', '2', '3', '4', '5']
    },
    employmentStatus: {
      enabled: false,
      required: false,
      options: ['employed', 'unemployed', 'student', 'retired']
    },
    dailyHoursOnline: {
      enabled: false,
      required: false,
      options: ['0-2', '2-4', '4-6', '6-8', '8+']
    },
    technicalProficiency: {
      enabled: false,
      required: false,
      options: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  },
  linkConfig: {
    allowMobile: false,
    trackLocation: false,
    allowMultipleAttempts: false
  },
  participantLimit: {
    enabled: false,
    value: 50
  },
  backlinks: {
    complete: '',
    disqualified: '',
    overquota: ''
  },
  researchUrl: '',
  parameterOptions: {
    saveDeviceInfo: false,
    saveLocationInfo: false,
    saveResponseTimes: false,
    saveUserJourney: false
  }
};

/**
 * Registro de eye tracking en la base de datos
 */
export interface EyeTrackingRecord extends EyeTrackingFormData {
  /**
   * ID único del registro
   */
  id: string;
  
  /**
   * Fecha de creación
   */
  createdAt: Date;
  
  /**
   * Fecha de última actualización
   */
  updatedAt: Date;
}

/**
 * Respuesta al manipular configuraciones de eye tracking
 */
export interface EyeTrackingResponse {
  /**
   * ID de la configuración
   */
  id?: string;
  
  /**
   * Datos de la configuración
   */
  data?: EyeTrackingFormData;
  
  /**
   * Indicador de éxito
   */
  success?: boolean;
  
  /**
   * Mensaje de error si corresponde
   */
  error?: string;
  
  /**
   * Indicador de que el recurso no se encontró
   */
  notFound?: boolean;
}

/**
 * Interfaz para el item DynamoDB de eye tracking
 */
export interface EyeTrackingDynamoItem {
  id: string;        // PK (UUID)
  sk: string;        // SK (Constante)
  researchId: string; // Atributo y GSI PK
  demographicQuestions: string; // Serializado
  linkConfig: string; // Serializado
  participantLimit: string; // Serializado
  backlinks: string; // Serializado
  researchUrl: string;
  parameterOptions: string; // Serializado
  metadata: string;  // Serializado
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

/**
 * Modelo para manejar las operaciones de eye tracking en DynamoDB
 */
export class EyeTrackingModel {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocumentClient;
  private static readonly SORT_KEY_VALUE = 'EYE_TRACKING_CONFIG'; // SK constante
  private modelName = 'EyeTrackingModel';

  constructor() {
    const context = 'constructor';
    this.tableName = process.env.DYNAMODB_TABLE!;
    if (!this.tableName) {
      structuredLog('error', `${this.modelName}.${context}`, 'FATAL ERROR: DYNAMODB_TABLE environment variable is not set.');
      throw new Error('Table name environment variable is missing.');
    }
    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    structuredLog('info', `${this.modelName}.${context}`, `Initialized for table: ${this.tableName} in region: ${region}`);
  }

  private mapToRecord(item: EyeTrackingDynamoItem): EyeTrackingRecord {
      const demographicQuestions = JSON.parse(item.demographicQuestions || '{}') as DemographicQuestions;
      const linkConfig = JSON.parse(item.linkConfig || '{}') as LinkConfig;
      const participantLimit = JSON.parse(item.participantLimit || '{}') as ParticipantLimit;
      const backlinks = JSON.parse(item.backlinks || '{}') as Backlinks;
      const parameterOptions = JSON.parse(item.parameterOptions || '{}') as ParameterOptions;
      const metadata = JSON.parse(item.metadata || '{}');
      
      return {
        id: item.id,
        researchId: item.researchId,
        demographicQuestions,
        linkConfig,
        participantLimit,
        backlinks,
        researchUrl: item.researchUrl,
        parameterOptions,
        metadata,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
  }

  async create(data: EyeTrackingFormData, researchId: string): Promise<EyeTrackingRecord> {
    const context = 'create';
    const existingScreen = await this.getByResearchId(researchId);
    if (existingScreen) {
      structuredLog('warn', `${this.modelName}.${context}`, 'Intento de crear configuración duplicada para researchId', { researchId });
      throw new ApiError(`EYE_TRACKING_CONFIG_EXISTS: Ya existe una configuración para la investigación ${researchId}`, 409);
    }

    const eyeTrackingId = uuidv4();
    const now = new Date().toISOString();
    
    const item: EyeTrackingDynamoItem = {
      id: eyeTrackingId,
      sk: EyeTrackingModel.SORT_KEY_VALUE,
      researchId,
      demographicQuestions: JSON.stringify(data.demographicQuestions || DEFAULT_EYE_TRACKING_CONFIG.demographicQuestions),
      linkConfig: JSON.stringify(data.linkConfig || DEFAULT_EYE_TRACKING_CONFIG.linkConfig),
      participantLimit: JSON.stringify(data.participantLimit || DEFAULT_EYE_TRACKING_CONFIG.participantLimit),
      backlinks: JSON.stringify(data.backlinks || DEFAULT_EYE_TRACKING_CONFIG.backlinks),
      researchUrl: data.researchUrl || '',
      parameterOptions: JSON.stringify(data.parameterOptions || DEFAULT_EYE_TRACKING_CONFIG.parameterOptions),
      metadata: JSON.stringify(data.metadata || { createdAt: now, updatedAt: now, lastModifiedBy: 'system' }),
      createdAt: now,
      updatedAt: now
    };
    
    const command = new PutCommand({ TableName: this.tableName, Item: item });

    try {
        await this.docClient.send(command);
        structuredLog('info', `${this.modelName}.${context}`, 'Configuración creada', { id: eyeTrackingId, researchId });
        return this.mapToRecord(item);
    } catch (error: any) {
        structuredLog('error', `${this.modelName}.${context}`, 'Error detallado de DynamoDB PutCommand', { error: error, researchId, id: eyeTrackingId });
        throw new ApiError(`DATABASE_ERROR: Error al crear la configuración de eye tracking: ${error.message}`, 500);
    }
  }

  async getById(id: string): Promise<EyeTrackingRecord | null> {
    const context = 'getById';
    const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          id: id,
          sk: EyeTrackingModel.SORT_KEY_VALUE
        }
      });

    try {
      const result = await this.docClient.send(command);
      if (!result.Item) {
        structuredLog('info', `${this.modelName}.${context}`, 'Configuración no encontrada por ID', { id });
        return null;
      }
      structuredLog('debug', `${this.modelName}.${context}`, 'Configuración encontrada por ID', { id });
      return this.mapToRecord(result.Item as EyeTrackingDynamoItem);
    } catch (error: any) {
        structuredLog('error', `${this.modelName}.${context}`, 'Error detallado de DynamoDB GetCommand', { error: error, id });
        throw new ApiError(`DATABASE_ERROR: Error al obtener la configuración de eye tracking por ID: ${error.message}`, 500);
    }
  }

  async getByResearchId(researchId: string): Promise<EyeTrackingRecord | null> {
    const context = 'getByResearchId';
    const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'researchId-index',
        KeyConditionExpression: 'researchId = :rid',
        FilterExpression: 'sk = :skVal',
        ExpressionAttributeValues: {
          ':rid': researchId,
          ':skVal': EyeTrackingModel.SORT_KEY_VALUE
        },
      });

    try {
      const result = await this.docClient.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      return this.mapToRecord(result.Items[0] as EyeTrackingDynamoItem);
    } catch (error: any) {
        structuredLog('error', `${this.modelName}.${context}`, 'Error al obtener eye tracking por researchId (Query GSI)', { error: error, researchId });
        if ((error as Error).message?.includes('index')) {
           structuredLog('error', `${this.modelName}.${context}`, 'Índice GSI researchId-index no encontrado o mal configurado');
           throw new ApiError("DATABASE_ERROR: Error de configuración de base de datos: falta índice para búsqueda.", 500);
        }
        throw new ApiError(`DATABASE_ERROR: Error al buscar configuración asociada a la investigación: ${error.message}`, 500);
    }
  }

  /**
   * Actualiza una configuración de eye tracking existente
   */
  async update(id: string, data: Partial<EyeTrackingFormData>): Promise<EyeTrackingRecord> {
    const context = 'update';
    const currentRecord = await this.getById(id);
    if (!currentRecord) {
      throw new ApiError(`EYE_TRACKING_CONFIG_NOT_FOUND: Configuración con ID ${id} no encontrada.`, 404);
    }
    
    const now = new Date().toISOString();
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };

    if (data.demographicQuestions !== undefined) {
      updateExpression += ', demographicQuestions = :demographicQuestions';
      expressionAttributeValues[':demographicQuestions'] = JSON.stringify(data.demographicQuestions);
    }
    if (data.linkConfig !== undefined) {
      updateExpression += ', linkConfig = :linkConfig';
      expressionAttributeValues[':linkConfig'] = JSON.stringify(data.linkConfig);
    }
    if (data.participantLimit !== undefined) {
      updateExpression += ', participantLimit = :participantLimit';
      expressionAttributeValues[':participantLimit'] = JSON.stringify(data.participantLimit);
    }
    if (data.backlinks !== undefined) {
      updateExpression += ', backlinks = :backlinks';
      expressionAttributeValues[':backlinks'] = JSON.stringify(data.backlinks);
    }
    if (data.researchUrl !== undefined) {
      updateExpression += ', researchUrl = :researchUrl';
      expressionAttributeValues[':researchUrl'] = data.researchUrl;
    }
    if (data.parameterOptions !== undefined) {
      updateExpression += ', parameterOptions = :parameterOptions';
      expressionAttributeValues[':parameterOptions'] = JSON.stringify(data.parameterOptions);
    }
    
    const currentMetadataObject = currentRecord.metadata || {};
    const incomingMetadata = data.metadata || {};
    const newMetadata = {
        ...currentMetadataObject,
        ...incomingMetadata,
        updatedAt: now,
        lastModifiedBy: incomingMetadata.lastModifiedBy || currentMetadataObject.lastModifiedBy || 'system'
    };
    updateExpression += ', metadata = :metadata';
    expressionAttributeValues[':metadata'] = JSON.stringify(newMetadata);

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: EyeTrackingModel.SORT_KEY_VALUE
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const result = await this.docClient.send(command);
      if (!result.Attributes) {
        throw new ApiError('DATABASE_ERROR: La actualización no devolvió atributos.', 500);
      }
      structuredLog('info', `${this.modelName}.${context}`, 'Configuración actualizada', { id });
      return this.mapToRecord(result.Attributes as EyeTrackingDynamoItem);
    } catch (error: any) {
        structuredLog('error', `${this.modelName}.${context}`, 'Error detallado de DynamoDB UpdateCommand', { error: error, id });
        throw new ApiError(`DATABASE_ERROR: Error al actualizar la configuración de eye tracking: ${error.message}`, 500);
    }
  }

  /**
   * Elimina una configuración de eye tracking
   */
  async delete(id: string): Promise<void> {
    const context = 'delete';
    const existing = await this.getById(id);
    if (!existing) {
        structuredLog('warn', `${this.modelName}.${context}`, 'Intento de eliminar configuración no existente', { id });
        throw new ApiError(`EYE_TRACKING_CONFIG_NOT_FOUND: Configuración con ID ${id} no encontrada para eliminar.`, 404);
    }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: EyeTrackingModel.SORT_KEY_VALUE
      }
    });
    
    try {
      await this.docClient.send(command);
      structuredLog('info', `${this.modelName}.${context}`, 'Configuración eliminada', { id });
    } catch (error: any) {
        structuredLog('error', `${this.modelName}.${context}`, 'Error detallado de DynamoDB DeleteCommand', { error: error, id });
        throw new ApiError(`DATABASE_ERROR: Error al eliminar la configuración de eye tracking: ${error.message}`, 500);
    }
  }

  /**
   * Obtiene todas las configuraciones de eye tracking (Scan - Ineficiente)
   */
  async getAll(): Promise<EyeTrackingRecord[]> {
    const context = 'getAll';
    structuredLog('warn', `${this.modelName}.${context}`, 'getAll() llamado - Operación Scan puede ser ineficiente en tablas grandes.');
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: {
        ':skVal': EyeTrackingModel.SORT_KEY_VALUE
      }
    });
    
    try {
      const result = await this.docClient.send(command);
      const items = result.Items || [];
      structuredLog('debug', `${this.modelName}.${context}`, `Scan completado, encontrados ${items.length} items.`);
      return items.map(item => this.mapToRecord(item as EyeTrackingDynamoItem));
    } catch (error: any) {
        structuredLog('error', `${this.modelName}.${context}`, 'Error detallado de DynamoDB ScanCommand', { error: error });
        throw new ApiError(`DATABASE_ERROR: Error al obtener todas las configuraciones de eye tracking: ${error.message}`, 500);
    }
  }
}

// Exportar instancia
export const eyeTrackingModel = new EyeTrackingModel(); 
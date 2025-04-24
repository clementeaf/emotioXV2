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

/**
 * Tipos de dispositivos de seguimiento ocular
 */
export type TrackingDeviceType = 'webcam' | 'tobii' | 'gazepoint' | 'eyetech';

/**
 * Opciones para la secuencia de presentación
 */
export type PresentationSequenceType = 'sequential' | 'random' | 'custom';

/**
 * Validación básica para eye tracking
 */
export const EYE_TRACKING_VALIDATION = {
  samplingRate: {
    min: 30,
    max: 120
  },
  fixationThreshold: {
    min: 50,
    max: 200
  },
  saccadeVelocityThreshold: {
    min: 20,
    max: 100
  },
  durationPerStimulus: {
    min: 1,
    max: 60
  }
};

/**
 * Configuración básica de eye tracking
 */
export interface EyeTrackingConfig {
  /**
   * Si el eye tracking está habilitado
   */
  enabled: boolean;
  
  /**
   * Tipo de dispositivo de seguimiento ocular
   */
  trackingDevice: TrackingDeviceType;
  
  /**
   * Si la calibración está habilitada
   */
  calibration: boolean;
  
  /**
   * Si la validación está habilitada
   */
  validation: boolean;
  
  /**
   * Configuración de grabación
   */
  recording: {
    /**
     * Si la grabación de audio está habilitada
     */
    audio: boolean;
    
    /**
     * Si la grabación de video está habilitada
     */
    video: boolean;
  };
  
  /**
   * Configuración de visualización
   */
  visualization: {
    /**
     * Si se muestra la mirada
     */
    showGaze: boolean;
    
    /**
     * Si se muestran las fijaciones
     */
    showFixations: boolean;
    
    /**
     * Si se muestran los movimientos sacádicos
     */
    showSaccades: boolean;
    
    /**
     * Si se muestra el mapa de calor
     */
    showHeatmap: boolean;
  };
  
  /**
   * Parámetros de seguimiento ocular
   */
  parameters: {
    /**
     * Tasa de muestreo en Hz
     */
    samplingRate: number;
    
    /**
     * Umbral de fijación en ms
     */
    fixationThreshold: number;
    
    /**
     * Umbral de velocidad sacádica en grados/segundo
     */
    saccadeVelocityThreshold: number;
  };
}

/**
 * Estímulo para eye tracking
 */
export interface EyeTrackingStimulus {
  /**
   * ID único del estímulo
   */
  id: string;
  
  /**
   * Nombre del archivo
   */
  fileName: string;
  
  /**
   * Tipo de archivo (MIME)
   */
  fileType?: string;
  
  /**
   * Tamaño del archivo en bytes
   */
  fileSize?: number;
  
  /**
   * URL del archivo
   */
  fileUrl: string;
  
  /**
   * Clave del archivo en S3
   */
  s3Key: string;
  
  /**
   * Orden de presentación
   */
  order: number;
  
  /**
   * Indicador de error
   */
  error?: boolean;
  
  /**
   * Mensaje de error
   */
  errorMessage?: string;
}

/**
 * Área de interés para eye tracking
 */
export interface EyeTrackingAreaOfInterest {
  /**
   * ID único del área
   */
  id: string;
  
  /**
   * Nombre descriptivo del área
   */
  name: string;
  
  /**
   * Región del área
   */
  region: {
    /**
     * Posición X en píxeles
     */
    x: number;
    
    /**
     * Posición Y en píxeles
     */
    y: number;
    
    /**
     * Ancho en píxeles
     */
    width: number;
    
    /**
     * Alto en píxeles
     */
    height: number;
  };
  
  /**
   * ID del estímulo al que pertenece esta área
   */
  stimulusId: string;
}

/**
 * Configuración de estímulos
 */
export interface EyeTrackingStimuliConfig {
  /**
   * Tipo de secuencia de presentación
   */
  presentationSequence: PresentationSequenceType;
  
  /**
   * Duración por estímulo en segundos
   */
  durationPerStimulus: number;
  
  /**
   * Lista de estímulos
   */
  items: EyeTrackingStimulus[];
}

/**
 * Configuración de áreas de interés
 */
export interface EyeTrackingAreaOfInterestConfig {
  /**
   * Si las áreas de interés están habilitadas
   */
  enabled: boolean;
  
  /**
   * Lista de áreas de interés
   */
  areas: EyeTrackingAreaOfInterest[];
}

/**
 * Datos del formulario de eye tracking
 */
export interface EyeTrackingFormData {
  /**
   * ID de la investigación asociada
   */
  researchId: string;
  
  /**
   * Configuración general
   */
  config: EyeTrackingConfig;
  
  /**
   * Configuración de estímulos
   */
  stimuli: EyeTrackingStimuliConfig;
  
  /**
   * Configuración de áreas de interés
   */
  areasOfInterest: EyeTrackingAreaOfInterestConfig;
  
  /**
   * Si se debe mostrar el marco del dispositivo
   */
  deviceFrame: boolean;
  
  /**
   * Metadatos opcionales
   */
  metadata?: {
    /**
     * Fecha de creación
     */
    createdAt?: string;
    
    /**
     * Fecha de actualización
     */
    updatedAt?: string;
    
    /**
     * Usuario que realizó la última modificación
     */
    lastModifiedBy?: string;
  };
}

/**
 * Configuración predeterminada de eye tracking
 */
export const DEFAULT_EYE_TRACKING_CONFIG: EyeTrackingFormData = {
  researchId: '',
  config: {
    enabled: true,
    trackingDevice: 'webcam',
    calibration: true,
    validation: true,
    recording: {
      audio: false,
      video: true
    },
    visualization: {
      showGaze: true,
      showFixations: true,
      showSaccades: true,
      showHeatmap: true
    },
    parameters: {
      samplingRate: 60,
      fixationThreshold: 100,
      saccadeVelocityThreshold: 30
    }
  },
  stimuli: {
    presentationSequence: 'sequential',
    durationPerStimulus: 5,
    items: []
  },
  areasOfInterest: {
    enabled: true,
    areas: []
  },
  deviceFrame: false
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
  config: string;    // Serializado
  stimuli: string;   // Serializado
  areasOfInterest: string; // Serializado
  deviceFrame: boolean;
  metadata: string;  // Serializado
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

/**
 * Modelo para manejar las operaciones de eye tracking en DynamoDB
 */
export class EyeTrackingModel {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;
  private static readonly SORT_KEY_VALUE = 'EYE_TRACKING_CONFIG'; // SK constante

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE!;
    if (!this.tableName) {
      console.error('FATAL ERROR: DYNAMODB_TABLE environment variable is not set.');
      throw new Error('Table name environment variable is missing.');
    }
    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    console.log(`[EyeTrackingModel] Initialized for table: ${this.tableName} in region: ${region}`);
  }

  // Helper para mapear de DynamoItem a Record
  private mapToRecord(item: EyeTrackingDynamoItem): EyeTrackingRecord {
      // Deserializar los objetos almacenados como strings
      const config = JSON.parse(item.config || '{}') as EyeTrackingConfig;
      const stimuli = JSON.parse(item.stimuli || '{}') as EyeTrackingStimuliConfig;
      const areasOfInterest = JSON.parse(item.areasOfInterest || '{}') as EyeTrackingAreaOfInterestConfig;
      const metadata = JSON.parse(item.metadata || '{}');
      
      // Devolver objeto que cumple con EyeTrackingRecord (SharedEyeTrackingRecord)
      return {
        id: item.id,
        researchId: item.researchId,
        config,
        stimuli,
        areasOfInterest,
        deviceFrame: item.deviceFrame,
        metadata, // Asumiendo que metadata en SharedEyeTrackingRecord es un objeto
        // Convertir a Date si la interfaz lo requiere
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
        // Asegurar que todos los campos de SharedEyeTrackingRecord estén aquí
      };
  }

  /**
   * Crea una nueva configuración de eye tracking
   */
  async create(data: EyeTrackingFormData, researchId: string): Promise<EyeTrackingRecord> {
    const eyeTrackingId = uuidv4();
    const now = new Date().toISOString();
    
    // Crear el ítem para DynamoDB
    const item: EyeTrackingDynamoItem = {
      id: eyeTrackingId,
      sk: EyeTrackingModel.SORT_KEY_VALUE, // Usar SK constante
      researchId,
      config: JSON.stringify(data.config), // Serializar
      stimuli: JSON.stringify(data.stimuli), // Serializar
      areasOfInterest: JSON.stringify(data.areasOfInterest), // Serializar
      deviceFrame: data.deviceFrame,
      metadata: JSON.stringify(data.metadata || { createdAt: now, updatedAt: now, lastModifiedBy: 'system' }), // Serializar
      createdAt: now,
      updatedAt: now
    };
    
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
        await this.dynamoClient.send(command);
        return this.mapToRecord(item); // Devolver usando mapeo
    } catch (error: any) {
        console.error('ERROR DETALLADO de DynamoDB PutCommand (EyeTracking):', JSON.stringify(error, null, 2));
        console.error('Error al crear configuración eye tracking:', error.message);
        throw new Error('DATABASE_ERROR: Error al crear la configuración de eye tracking');
    }
  }

  /**
   * Obtiene una configuración de eye tracking por su ID único (UUID)
   */
  async getById(id: string): Promise<EyeTrackingRecord | null> {
    const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          id: id,
          sk: EyeTrackingModel.SORT_KEY_VALUE // Usar SK constante
        }
      });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Item) {
        return null;
      }
      return this.mapToRecord(result.Item as EyeTrackingDynamoItem);
    } catch (error: any) {
        console.error('ERROR DETALLADO de DynamoDB GetCommand (EyeTracking):', JSON.stringify(error, null, 2));
        console.error(`Error al obtener EyeTracking por ID ${id}:`, error.message);
        throw new Error('DATABASE_ERROR: Error al obtener la configuración de eye tracking por ID');
    }
  }

  /**
   * Obtiene una configuración de eye tracking por researchId usando GSI
   */
  async getByResearchId(researchId: string): Promise<EyeTrackingRecord | null> {
    const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'ResearchIdIndex', // Usar GSI correcto
        KeyConditionExpression: 'researchId = :rid',
        ExpressionAttributeValues: {
          ':rid': researchId
        },
        Limit: 1
      });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      return this.mapToRecord(result.Items[0] as EyeTrackingDynamoItem);
    } catch (error: any) {
        console.error('ERROR DETALLADO de DynamoDB QueryCommand GSI (EyeTracking):', JSON.stringify(error, null, 2));
        console.error(`Error al obtener EyeTracking por researchId ${researchId}:`, error.message);
        throw new Error('DATABASE_ERROR: Error al obtener la configuración de eye tracking por Research ID');
    }
  }

  /**
   * Actualiza una configuración de eye tracking existente
   */
  async update(id: string, data: Partial<EyeTrackingFormData>): Promise<EyeTrackingRecord> {
    // Verificar existencia
    const currentRecord = await this.getById(id);
    if (!currentRecord) {
      throw new Error(`EYE_TRACKING_CONFIG_NOT_FOUND: Configuración con ID ${id} no encontrada.`);
    }
    
    const now = new Date().toISOString();
    
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };

    // Añadir campos a actualizar dinámicamente
    if (data.config !== undefined) {
      updateExpression += ', config = :config';
      expressionAttributeValues[':config'] = JSON.stringify(data.config);
    }
    if (data.stimuli !== undefined) {
      updateExpression += ', stimuli = :stimuli';
      expressionAttributeValues[':stimuli'] = JSON.stringify(data.stimuli);
    }
    if (data.areasOfInterest !== undefined) {
      updateExpression += ', areasOfInterest = :areasOfInterest';
      expressionAttributeValues[':areasOfInterest'] = JSON.stringify(data.areasOfInterest);
    }
    if (data.deviceFrame !== undefined) {
      updateExpression += ', deviceFrame = :deviceFrame';
      expressionAttributeValues[':deviceFrame'] = data.deviceFrame;
    }
    
    // Actualizar metadata consistentemente
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
        sk: EyeTrackingModel.SORT_KEY_VALUE // Usar SK constante
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Attributes) {
        throw new Error('La actualización no devolvió atributos.');
      }
      return this.mapToRecord(result.Attributes as EyeTrackingDynamoItem);
    } catch (error: any) {
        console.error('ERROR DETALLADO de DynamoDB UpdateCommand (EyeTracking):', JSON.stringify(error, null, 2));
        console.error(`Error al actualizar EyeTracking con ID ${id}:`, error.message);
        throw new Error('DATABASE_ERROR: Error al actualizar la configuración de eye tracking');
    }
  }

  /**
   * Elimina una configuración de eye tracking
   */
  async delete(id: string): Promise<void> {
    // Opcional: verificar existencia
     const existing = await this.getById(id);
     if (!existing) {
        console.warn(`[EyeTrackingModel] Intento de eliminar configuración no existente: ${id}`);
        return;
     }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: EyeTrackingModel.SORT_KEY_VALUE // Usar SK constante
      }
    });
    
    try {
      await this.dynamoClient.send(command);
    } catch (error: any) {
        console.error('ERROR DETALLADO de DynamoDB DeleteCommand (EyeTracking):', JSON.stringify(error, null, 2));
        console.error(`Error al eliminar EyeTracking con ID ${id}:`, error.message);
        throw new Error('DATABASE_ERROR: Error al eliminar la configuración de eye tracking');
    }
  }

  /**
   * Obtiene todas las configuraciones de eye tracking (Scan - Ineficiente)
   */
  async getAll(): Promise<EyeTrackingRecord[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: {
        ':skVal': EyeTrackingModel.SORT_KEY_VALUE
      }
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      const items = result.Items || [];
      return items.map(item => this.mapToRecord(item as EyeTrackingDynamoItem));
    } catch (error: any) {
        console.error('ERROR DETALLADO de DynamoDB ScanCommand (EyeTracking - getAll):', JSON.stringify(error, null, 2));
        console.error('Error en EyeTrackingModel.getAll:', error.message);
        throw new Error('DATABASE_ERROR: Error al obtener todas las configuraciones de eye tracking');
    }
  }
}

// Exportar instancia
export const eyeTrackingModel = new EyeTrackingModel(); 
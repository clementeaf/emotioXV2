import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { uuidv4 } from '../utils/id-generator';

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
  createdAt: string;
  
  /**
   * Fecha de última actualización
   */
  updatedAt: string;
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
 * Interfaz para el modelo DynamoDB de eye tracking
 */
export interface EyeTrackingDynamoItem {
  // Clave primaria
  id: string;
  
  // Clave de ordenación
  sk: string;
  
  // ID de la investigación asociada
  researchId: string;
  
  // Configuración general (serializada)
  config: string;
  
  // Configuración de estímulos (serializada)
  stimuli: string;
  
  // Configuración de áreas de interés (serializada)
  areasOfInterest: string;
  
  // Si se debe mostrar el marco del dispositivo
  deviceFrame: boolean;
  
  // Metadatos serializados
  metadata: string;
  
  // Fechas
  createdAt: string;
  updatedAt: string;
}

/**
 * Modelo para manejar las operaciones de eye tracking en DynamoDB
 */
export class EyeTrackingModel {
  private tableName: string;
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    console.log('======== EYE TRACKING MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    console.log('Nombre de tabla DynamoDB para eye tracking:', this.tableName);
    
    // Configuración para DynamoDB en AWS Cloud (producción)
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    console.log('Configuración DynamoDB para eye tracking:', options);
    console.log('SIEMPRE usando DynamoDB en AWS Cloud - NO LOCAL');
    
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
    console.log('=======================================');
  }

  /**
   * Crea una nueva configuración de eye tracking
   * @param data Datos del formulario de eye tracking
   * @param researchId ID de la investigación asociada
   * @returns La configuración creada con su ID generado
   */
  async create(data: EyeTrackingFormData, researchId: string): Promise<EyeTrackingRecord> {
    // Generar ID único para la configuración
    const eyeTrackingId = uuidv4();
    
    // Obtener la fecha actual para los timestamps
    const now = new Date().toISOString();
    
    // Crear objeto con todos los campos necesarios
    const newEyeTracking: EyeTrackingRecord = {
      ...data,
      id: eyeTrackingId,
      researchId,
      createdAt: now,
      updatedAt: now
    };
    
    // Crear el ítem para DynamoDB
    const dynamoItem: EyeTrackingDynamoItem = {
      id: eyeTrackingId,
      sk: `EYETRACKING#${eyeTrackingId}`,
      researchId,
      config: JSON.stringify(newEyeTracking.config),
      stimuli: JSON.stringify(newEyeTracking.stimuli),
      areasOfInterest: JSON.stringify(newEyeTracking.areasOfInterest),
      deviceFrame: newEyeTracking.deviceFrame,
      metadata: JSON.stringify(newEyeTracking.metadata || {}),
      createdAt: now,
      updatedAt: now
    };
    
    // Guardar en DynamoDB
    await this.dynamoClient.send(new PutCommand({
      TableName: this.tableName,
      Item: dynamoItem
    }));
    
    return newEyeTracking;
  }

  /**
   * Obtiene una configuración de eye tracking por su ID
   * @param id ID de la configuración
   * @returns La configuración encontrada o null si no existe
   */
  async getById(id: string): Promise<EyeTrackingRecord | null> {
    try {
      // Buscar por ID en DynamoDB
      const result = await this.dynamoClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          id,
          sk: `EYETRACKING#${id}`
        }
      }));
      
      // Si no se encontró el ítem, retornar null
      if (!result.Item) {
        return null;
      }
      
      // Convertir el ítem de DynamoDB a nuestro modelo
      const item = result.Item as EyeTrackingDynamoItem;
      
      // Deserializar los objetos almacenados como strings
      return {
        id: item.id,
        researchId: item.researchId,
        config: JSON.parse(item.config),
        stimuli: JSON.parse(item.stimuli),
        areasOfInterest: JSON.parse(item.areasOfInterest),
        deviceFrame: item.deviceFrame,
        metadata: JSON.parse(item.metadata),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error('Error al obtener configuración eye tracking por ID:', error);
      return null;
    }
  }

  /**
   * Obtiene una configuración de eye tracking por su ID de investigación
   * @param researchId ID de la investigación
   * @returns La configuración encontrada o null si no existe
   */
  async getByResearchId(researchId: string): Promise<EyeTrackingRecord | null> {
    try {
      // Configurar los parámetros para buscar por GSI (researchId)
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'researchId-index',
        KeyConditionExpression: 'researchId = :researchId AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
          ':researchId': researchId,
          ':sk': 'EYETRACKING#'
        }
      }));
      
      // Si no hay resultados, retornar null
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      
      // Tomar el primer resultado (debería ser único por investigación)
      const item = result.Items[0] as EyeTrackingDynamoItem;
      
      // Deserializar los objetos almacenados como strings
      return {
        id: item.id,
        researchId: item.researchId,
        config: JSON.parse(item.config),
        stimuli: JSON.parse(item.stimuli),
        areasOfInterest: JSON.parse(item.areasOfInterest),
        deviceFrame: item.deviceFrame,
        metadata: JSON.parse(item.metadata),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error('Error al obtener configuración eye tracking por researchId:', error);
      return null;
    }
  }

  /**
   * Actualiza una configuración de eye tracking
   * @param id ID de la configuración a actualizar
   * @param data Datos actualizados (parciales)
   * @returns La configuración actualizada o null si no existe
   */
  async update(id: string, data: Partial<EyeTrackingFormData>): Promise<EyeTrackingRecord | null> {
    try {
      // Primero obtener la configuración actual
      const currentConfig = await this.getById(id);
      
      // Si no existe, retornar null
      if (!currentConfig) {
        return null;
      }
      
      // Obtener la fecha actual para la actualización
      const now = new Date().toISOString();
      
      // Combinar la configuración actual con los datos actualizados
      const updatedConfig: EyeTrackingRecord = {
        ...currentConfig,
        ...data,
        updatedAt: now
      };
      
      // Mantener los campos requeridos que no deberían ser sobrescritos
      updatedConfig.id = id;
      updatedConfig.researchId = data.researchId || currentConfig.researchId;
      updatedConfig.createdAt = currentConfig.createdAt;
      
      // Preparar el ítem para DynamoDB
      const dynamoItem: EyeTrackingDynamoItem = {
        id,
        sk: `EYETRACKING#${id}`,
        researchId: updatedConfig.researchId,
        config: JSON.stringify(updatedConfig.config),
        stimuli: JSON.stringify(updatedConfig.stimuli),
        areasOfInterest: JSON.stringify(updatedConfig.areasOfInterest),
        deviceFrame: updatedConfig.deviceFrame,
        metadata: JSON.stringify(updatedConfig.metadata || {}),
        createdAt: updatedConfig.createdAt,
        updatedAt: now
      };
      
      // Actualizar en DynamoDB
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: dynamoItem
      }));
      
      return updatedConfig;
    } catch (error) {
      console.error('Error al actualizar configuración eye tracking:', error);
      return null;
    }
  }

  /**
   * Elimina una configuración de eye tracking
   * @param id ID de la configuración a eliminar
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Eliminar de DynamoDB
      await this.dynamoClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          id,
          sk: `EYETRACKING#${id}`
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error al eliminar configuración eye tracking:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las configuraciones de eye tracking
   * @returns Array con todas las configuraciones de eye tracking
   */
  async getAll(): Promise<EyeTrackingRecord[]> {
    try {
      // Usar el cliente de AWS SDK v3 para consultar
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'researchId-index',
        KeyConditionExpression: 'begins_with(sk, :sk)',
        ExpressionAttributeValues: {
          ':sk': 'EYETRACKING#'
        }
      }));
      
      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      // Mapear los items de DynamoDB a nuestro modelo
      return result.Items.map(item => {
        const dynamoItem = item as EyeTrackingDynamoItem;
        return {
          id: dynamoItem.id,
          researchId: dynamoItem.researchId,
          config: JSON.parse(dynamoItem.config),
          stimuli: JSON.parse(dynamoItem.stimuli),
          areasOfInterest: JSON.parse(dynamoItem.areasOfInterest),
          deviceFrame: dynamoItem.deviceFrame,
          metadata: JSON.parse(dynamoItem.metadata),
          createdAt: dynamoItem.createdAt,
          updatedAt: dynamoItem.updatedAt
        };
      });
    } catch (error) {
      console.error('Error en EyeTrackingModel.getAll:', error);
      return [];
    }
  }
} 
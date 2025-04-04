import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand as DocQueryCommand,
  ScanCommand as DocScanCommand
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

import {
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitParticipant,
  EyeTrackingRecruitStats
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';

// Cliente DynamoDB
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Nombres de tablas
export const TABLES = {
  EYETRACKING_RECRUIT_CONFIG: process.env.EYETRACKING_RECRUIT_CONFIG_TABLE || 'EyeTrackingRecruitConfig',
  EYETRACKING_RECRUIT_PARTICIPANT: process.env.EYETRACKING_RECRUIT_PARTICIPANT_TABLE || 'EyeTrackingRecruitParticipant',
  RECRUITMENT_LINK: process.env.RECRUITMENT_LINK_TABLE || 'RecruitmentLink'
};

// Tipos para los objetos en DynamoDB
export interface DynamoEyeTrackingRecruitConfig extends Omit<EyeTrackingRecruitConfig, 'createdAt' | 'updatedAt'> {
  PK: string; // Clave de partición, por ejemplo: CONFIG#id
  SK: string; // Clave de ordenación, por ejemplo: RESEARCH#researchId
  GSI1PK?: string; // Para búsqueda por researchId: RESEARCH#researchId
  GSI1SK?: string; // Para ordenar: createdAt
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string; // Fecha como string ISO
  updatedAt: string; // Fecha como string ISO
}

export interface DynamoEyeTrackingRecruitParticipant extends Omit<EyeTrackingRecruitParticipant, 'startedAt' | 'completedAt'> {
  PK: string; // Clave de partición, por ejemplo: PARTICIPANT#id
  SK: string; // Clave de ordenación, por ejemplo: CONFIG#configId
  GSI1PK?: string; // Para búsqueda por configId: CONFIG#configId
  GSI1SK?: string; // Para ordenar por fecha: startedAt
  GSI2PK?: string; // Para búsqueda por estado: STATUS#status
  GSI2SK?: string; // Para ordenar por fecha por estado: startedAt
  ipAddress?: string;
  referrer?: string;
  lastActivityAt: string;
  startedAt: string; // Fecha como string ISO
  completedAt?: string; // Fecha como string ISO
}

export interface DynamoRecruitmentLink {
  PK: string; // Clave de partición, por ejemplo: LINK#id
  SK: string; // Clave de ordenación, por ejemplo: CONFIG#configId
  GSI1PK?: string; // Para búsqueda por configId: CONFIG#configId
  GSI1SK?: string; // Para ordenar por fecha: createdAt
  token: string;
  url: string;
  qrCode?: string;
  type: 'standard' | 'preview' | 'admin';
  isActive: boolean;
  researchId: string;
  recruitConfigId: string;
  createdAt: string;
  expiresAt?: string;
  lastAccessedAt?: string;
  accessCount: number;
  conversionCount: number;
}

// Interfaz para enlaces de reclutamiento que se devolverá a la API
export interface RecruitmentLink {
  id: string;
  token: string;
  url: string;
  qrCode?: string;
  type: 'standard' | 'preview' | 'admin';
  isActive: boolean;
  researchId: string;
  recruitConfigId: string;
  createdAt: Date;
  expiresAt?: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  conversionCount: number;
}

// Clase para operaciones de la configuración de Eye Tracking Recruit
export class EyeTrackingRecruitConfigModel {
  
  /**
   * Crea una nueva configuración de Eye Tracking Recruit
   */
  static async create(configData: Omit<EyeTrackingRecruitConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<EyeTrackingRecruitConfig> {
    const now = new Date().toISOString();
    const id = uuidv4();
    
    const item: DynamoEyeTrackingRecruitConfig = {
      id,
      ...configData,
      PK: `CONFIG#${id}`,
      SK: `RESEARCH#${configData.researchId}`,
      GSI1PK: `RESEARCH#${configData.researchId}`,
      GSI1SK: now,
      isActive: true,
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    };
    
    await docClient.send(
      new PutCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        Item: item
      })
    );
    
    return converters.configFromDynamo(item);
  }
  
  /**
   * Obtiene una configuración por su ID
   */
  static async getById(id: string): Promise<EyeTrackingRecruitConfig | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        Key: {
          PK: `CONFIG#${id}`,
          SK: `RESEARCH#${id.split('-')[0]}` // Prefijo del ID (puede necesitar ajustarse)
        }
      })
    );
    
    if (!response.Item) return null;
    return converters.configFromDynamo(response.Item as DynamoEyeTrackingRecruitConfig);
  }
  
  /**
   * Obtiene configuraciones por ID de investigación
   */
  static async getByResearchId(researchId: string): Promise<EyeTrackingRecruitConfig[]> {
    const response = await docClient.send(
      new DocQueryCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :researchId',
        ExpressionAttributeValues: {
          ':researchId': `RESEARCH#${researchId}`
        }
      })
    );
    
    return converters.configsFromDynamo((response.Items || []) as DynamoEyeTrackingRecruitConfig[]);
  }
  
  /**
   * Actualiza una configuración existente
   */
  static async update(
    id: string, 
    updateData: Partial<Omit<EyeTrackingRecruitConfig, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>>
  ): Promise<EyeTrackingRecruitConfig | null> {
    // Primero recuperamos el item de DynamoDB para obtener las claves necesarias
    const dynamoKey = {
      PK: `CONFIG#${id}`,
      SK: `RESEARCH#${id.split('-')[0]}`
    };
    
    const configResponse = await docClient.send(
      new GetCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        Key: dynamoKey
      })
    );
    
    if (!configResponse.Item) return null;
    
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };
    
    // Construir expresión de actualización dinámicamente
    Object.entries(updateData).forEach(([key, value]) => {
      updateExpression += `, ${key} = :${key}`;
      expressionAttributeValues[`:${key}`] = value;
    });
    
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        Key: dynamoKey,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      })
    );
    
    if (!response.Attributes) return null;
    return converters.configFromDynamo(response.Attributes as DynamoEyeTrackingRecruitConfig);
  }
  
  /**
   * Marca una configuración como completada
   */
  static async markAsCompleted(id: string): Promise<EyeTrackingRecruitConfig | null> {
    // Primero recuperamos el item de DynamoDB para obtener las claves necesarias
    const dynamoKey = {
      PK: `CONFIG#${id}`,
      SK: `RESEARCH#${id.split('-')[0]}`
    };
    
    const configResponse = await docClient.send(
      new GetCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        Key: dynamoKey
      })
    );
    
    if (!configResponse.Item) return null;
    
    const now = new Date().toISOString();
    
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        Key: dynamoKey,
        UpdateExpression: 'SET isCompleted = :isCompleted, completedAt = :completedAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isCompleted': true,
          ':completedAt': now,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    if (!response.Attributes) return null;
    return converters.configFromDynamo(response.Attributes as DynamoEyeTrackingRecruitConfig);
  }
  
  /**
   * Elimina una configuración
   */
  static async delete(id: string): Promise<boolean> {
    // Verificamos primero si existe
    const exists = await this.getById(id);
    if (!exists) return false;
    
    // Construimos la clave directamente como en los otros métodos
    const dynamoKey = {
      PK: `CONFIG#${id}`,
      SK: `RESEARCH#${id.split('-')[0]}`
    };
    
    await docClient.send(
      new DeleteCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
        Key: dynamoKey
      })
    );
    
    return true;
  }
}

// Clase para operaciones de participantes
export class EyeTrackingRecruitParticipantModel {
  
  /**
   * Crea un nuevo participante
   */
  static async create(participantData: Omit<EyeTrackingRecruitParticipant, 'id' | 'startedAt' | 'completedAt' | 'sessionDuration'>): Promise<EyeTrackingRecruitParticipant> {
    const now = new Date().toISOString();
    const id = uuidv4();
    
    const item: DynamoEyeTrackingRecruitParticipant = {
      id,
      ...participantData,
      PK: `PARTICIPANT#${id}`,
      SK: `CONFIG#${participantData.recruitConfigId}`,
      GSI1PK: `CONFIG#${participantData.recruitConfigId}`,
      GSI1SK: now,
      GSI2PK: `STATUS#${participantData.status}`,
      GSI2SK: now,
      startedAt: now,
      lastActivityAt: now
    };
    
    await docClient.send(
      new PutCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
        Item: item
      })
    );
    
    return converters.participantFromDynamo(item);
  }
  
  /**
   * Obtiene un participante por su ID
   */
  static async getById(id: string): Promise<EyeTrackingRecruitParticipant | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
        Key: {
          PK: `PARTICIPANT#${id}`,
          SK: `CONFIG#${id.split('-')[0]}` // Prefijo del ID (puede necesitar ajustarse)
        }
      })
    );
    
    if (!response.Item) return null;
    return converters.participantFromDynamo(response.Item as DynamoEyeTrackingRecruitParticipant);
  }
  
  /**
   * Actualiza el estado de un participante
   */
  static async updateStatus(
    id: string, 
    status: 'complete' | 'disqualified' | 'overquota' | 'inprogress',
    demographicData?: Record<string, any>
  ): Promise<EyeTrackingRecruitParticipant | null> {
    const participantResponse = await docClient.send(
      new GetCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
        Key: {
          PK: `PARTICIPANT#${id}`,
          SK: `CONFIG#${id.split('-')[0]}`
        }
      })
    );
    
    if (!participantResponse.Item) return null;
    const dynamoParticipant = participantResponse.Item as DynamoEyeTrackingRecruitParticipant;
    
    const now = new Date().toISOString();
    let completedAt = undefined;
    let sessionDuration = undefined;
    
    if (status === 'complete' && !dynamoParticipant.completedAt) {
      completedAt = now;
      
      const startTime = new Date(dynamoParticipant.startedAt).getTime();
      const endTime = new Date(now).getTime();
      sessionDuration = Math.round((endTime - startTime) / 1000);
    }
    
    let updateExpression = 'SET status = :status, lastActivityAt = :lastActivityAt, GSI2PK = :gsi2pk';
    const expressionAttributeValues: Record<string, any> = {
      ':status': status,
      ':lastActivityAt': now,
      ':gsi2pk': `STATUS#${status}`
    };
    
    if (completedAt) {
      updateExpression += ', completedAt = :completedAt';
      expressionAttributeValues[':completedAt'] = completedAt;
    }
    
    if (sessionDuration) {
      updateExpression += ', sessionDuration = :sessionDuration';
      expressionAttributeValues[':sessionDuration'] = sessionDuration;
    }
    
    if (demographicData) {
      updateExpression += ', demographicData = :demographicData';
      expressionAttributeValues[':demographicData'] = demographicData;
    }
    
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
        Key: {
          PK: `PARTICIPANT#${id}`,
          SK: dynamoParticipant.SK
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      })
    );
    
    if (!response.Attributes) return null;
    return converters.participantFromDynamo(response.Attributes as DynamoEyeTrackingRecruitParticipant);
  }
  
  /**
   * Obtiene los participantes por configuración de reclutamiento
   */
  static async getByConfigId(configId: string): Promise<EyeTrackingRecruitParticipant[]> {
    const response = await docClient.send(
      new DocQueryCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :configId',
        ExpressionAttributeValues: {
          ':configId': `CONFIG#${configId}`
        }
      })
    );
    
    return converters.participantsFromDynamo((response.Items || []) as DynamoEyeTrackingRecruitParticipant[]);
  }
  
  /**
   * Obtiene los participantes por estado
   */
  static async getByStatus(status: string): Promise<EyeTrackingRecruitParticipant[]> {
    const response = await docClient.send(
      new DocQueryCommand({
        TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :status',
        ExpressionAttributeValues: {
          ':status': `STATUS#${status}`
        }
      })
    );
    
    return converters.participantsFromDynamo((response.Items || []) as DynamoEyeTrackingRecruitParticipant[]);
  }
  
  /**
   * Obtiene estadísticas de participantes para una configuración
   */
  static async getStats(configId: string): Promise<EyeTrackingRecruitStats> {
    const participants = await this.getByConfigId(configId);
    const total = participants.length;
    
    const complete = participants.filter(p => p.status === 'complete').length;
    const disqualified = participants.filter(p => p.status === 'disqualified').length;
    const overquota = participants.filter(p => p.status === 'overquota').length;
    
    const stats: EyeTrackingRecruitStats = {
      complete: {
        count: complete,
        percentage: total ? Math.round((complete / total) * 100) : 0
      },
      disqualified: {
        count: disqualified,
        percentage: total ? Math.round((disqualified / total) * 100) : 0
      },
      overquota: {
        count: overquota,
        percentage: total ? Math.round((overquota / total) * 100) : 0
      }
    };
    
    return stats;
  }
}

// Clase para operaciones de enlaces de reclutamiento
export class RecruitmentLinkModel {
  
  /**
   * Crea un nuevo enlace de reclutamiento
   */
  static async create(
    researchId: string,
    configId: string,
    type: 'standard' | 'preview' | 'admin' = 'standard',
    expiresAt?: string
  ): Promise<RecruitmentLink> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const token = this.generateToken();
    
    const baseUrl = process.env.RECRUITMENT_BASE_URL || 'https://eyetracking.emotio.app';
    const url = `${baseUrl}/participate/${token}`;
    
    const item: DynamoRecruitmentLink = {
      PK: `LINK#${id}`,
      SK: `CONFIG#${configId}`,
      GSI1PK: `CONFIG#${configId}`,
      GSI1SK: now,
      token,
      url,
      type,
      isActive: true,
      researchId,
      recruitConfigId: configId,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      conversionCount: 0
    };
    
    await docClient.send(
      new PutCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        Item: item
      })
    );
    
    return converters.linkFromDynamo(item);
  }
  
  /**
   * Genera un token único para el enlace
   */
  private static generateToken(): string {
    return uuidv4().substring(0, 8);
  }
  
  /**
   * Obtiene un enlace por su token
   */
  static async getByToken(token: string): Promise<RecruitmentLink | null> {
    const response = await docClient.send(
      new DocScanCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        FilterExpression: 'token = :token',
        ExpressionAttributeValues: {
          ':token': token
        }
      })
    );
    
    if (!response.Items || response.Items.length === 0) {
      return null;
    }
    
    return converters.linkFromDynamo(response.Items[0] as DynamoRecruitmentLink);
  }
  
  /**
   * Incrementa el contador de accesos para un enlace
   */
  static async incrementAccessCount(token: string): Promise<RecruitmentLink | null> {
    const linkResponse = await docClient.send(
      new DocScanCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        FilterExpression: 'token = :token',
        ExpressionAttributeValues: {
          ':token': token
        }
      })
    );
    
    if (!linkResponse.Items || linkResponse.Items.length === 0) {
      return null;
    }
    
    const dynamoLink = linkResponse.Items[0] as DynamoRecruitmentLink;
    const now = new Date().toISOString();
    
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        Key: {
          PK: dynamoLink.PK,
          SK: dynamoLink.SK
        },
        UpdateExpression: 'SET accessCount = accessCount + :inc, lastAccessedAt = :lastAccessedAt',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':lastAccessedAt': now
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    if (!response.Attributes) return null;
    return converters.linkFromDynamo(response.Attributes as DynamoRecruitmentLink);
  }
  
  /**
   * Obtiene todos los enlaces activos para una configuración
   */
  static async getActiveByConfigId(configId: string): Promise<RecruitmentLink[]> {
    const response = await docClient.send(
      new DocQueryCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :configId',
        FilterExpression: 'isActive = :isActive',
        ExpressionAttributeValues: {
          ':configId': `CONFIG#${configId}`,
          ':isActive': true
        }
      })
    );
    
    return converters.linksFromDynamo((response.Items || []) as DynamoRecruitmentLink[]);
  }
  
  /**
   * Desactiva un enlace
   */
  static async deactivate(token: string): Promise<RecruitmentLink | null> {
    const linkResponse = await docClient.send(
      new DocScanCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        FilterExpression: 'token = :token',
        ExpressionAttributeValues: {
          ':token': token
        }
      })
    );
    
    if (!linkResponse.Items || linkResponse.Items.length === 0) {
      return null;
    }
    
    const dynamoLink = linkResponse.Items[0] as DynamoRecruitmentLink;
    
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        Key: {
          PK: dynamoLink.PK,
          SK: dynamoLink.SK
        },
        UpdateExpression: 'SET isActive = :isActive',
        ExpressionAttributeValues: {
          ':isActive': false
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    if (!response.Attributes) return null;
    return converters.linkFromDynamo(response.Attributes as DynamoRecruitmentLink);
  }
}

// Exportación de los modelos
export default {
  EyeTrackingRecruitConfigModel,
  EyeTrackingRecruitParticipantModel,
  RecruitmentLinkModel,
  TABLES
};

// Funciones de utilidad para convertir entre el modelo DynamoDB y la interfaz compartida
export const converters = {
  /**
   * Convierte una configuración DynamoDB a la interfaz compartida
   */
  configFromDynamo(item: DynamoEyeTrackingRecruitConfig): EyeTrackingRecruitConfig {
    const { PK, SK, GSI1PK, GSI1SK, isActive, isCompleted, completedAt, ...rest } = item;
    return {
      ...rest,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
    };
  },
  
  /**
   * Convierte un participante DynamoDB a la interfaz compartida
   */
  participantFromDynamo(item: DynamoEyeTrackingRecruitParticipant): EyeTrackingRecruitParticipant {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...rest } = item;
    return {
      ...rest,
      startedAt: new Date(item.startedAt),
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined
    };
  },
  
  /**
   * Convierte un array de configuraciones DynamoDB a la interfaz compartida
   */
  configsFromDynamo(items: DynamoEyeTrackingRecruitConfig[]): EyeTrackingRecruitConfig[] {
    return items.map(item => this.configFromDynamo(item));
  },
  
  /**
   * Convierte un array de participantes DynamoDB a la interfaz compartida
   */
  participantsFromDynamo(items: DynamoEyeTrackingRecruitParticipant[]): EyeTrackingRecruitParticipant[] {
    return items.map(item => this.participantFromDynamo(item));
  },
  
  /**
   * Convierte un enlace DynamoDB a la interfaz compartida
   */
  linkFromDynamo(item: DynamoRecruitmentLink): RecruitmentLink {
    const { PK, SK, GSI1PK, GSI1SK, ...rest } = item;
    return {
      id: PK.split('#')[1],
      ...rest,
      createdAt: new Date(item.createdAt),
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
      lastAccessedAt: item.lastAccessedAt ? new Date(item.lastAccessedAt) : undefined
    };
  },
  
  /**
   * Convierte un array de enlaces DynamoDB a la interfaz compartida
   */
  linksFromDynamo(items: DynamoRecruitmentLink[]): RecruitmentLink[] {
    return items.map(item => this.linkFromDynamo(item));
  }
}; 
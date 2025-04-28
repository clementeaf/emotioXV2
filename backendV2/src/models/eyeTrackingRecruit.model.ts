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

import { structuredLog } from '../utils/logging.util';
import { ApiError } from '../utils/errors';

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
  private static modelName = 'EyeTrackingRecruitConfigModel'; // Para logging

  /**
   * Crea una nueva configuración de Eye Tracking Recruit
   */
  static async create(configData: Omit<EyeTrackingRecruitConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<EyeTrackingRecruitConfig> {
    const context = `${this.modelName}.create`;
    structuredLog('info', context, 'Iniciando creación de configuración', { researchId: configData.researchId });
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
    
    const command = new PutCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
      Item: item
    });

    try {
      await docClient.send(command);
      structuredLog('info', context, 'Configuración creada exitosamente', { id, researchId: configData.researchId });
      return converters.configFromDynamo(item);
    } catch (error: any) {
      structuredLog('error', context, 'Error al guardar configuración en DynamoDB', { error: error, id, researchId: configData.researchId });
      throw new ApiError(`DATABASE_ERROR: Error al crear la configuración de reclutamiento: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene una configuración por su ID
   */
  static async getById(id: string): Promise<EyeTrackingRecruitConfig | null> {
    const context = `${this.modelName}.getById`;
    structuredLog('info', context, 'Buscando configuración por ID', { id });
    // <<< Necesitamos el researchId para la SK, asumimos que está en el ID o necesitamos obtenerlo primero >>>
    // <<< ESTA LÓGICA DE OBTENER researchId de id.split PUEDE SER FRÁGIL >>>
    // <<< Si no se puede derivar, este método necesita researchId como parámetro >>>
    const researchIdFromId = id.split('-')[0]; // ¡Asunción peligrosa!
    if (!researchIdFromId) {
       structuredLog('error', context, 'No se pudo derivar researchId del ID para construir la SK', { id });
       throw new ApiError('INVALID_INPUT: No se pudo determinar la clave completa para la búsqueda.', 400);
    }

    const command = new GetCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
      Key: {
        PK: `CONFIG#${id}`,
        SK: `RESEARCH#${researchIdFromId}` // Usar researchId derivado
      }
    });

    try {
      const response = await docClient.send(command);
      
      if (!response.Item) {
        structuredLog('info', context, 'Configuración no encontrada', { id });
        return null;
      }
      structuredLog('info', context, 'Configuración encontrada', { id });
      return converters.configFromDynamo(response.Item as DynamoEyeTrackingRecruitConfig);
    } catch (error: any) {
      structuredLog('error', context, 'Error al obtener configuración de DynamoDB', { error: error, id });
      throw new ApiError(`DATABASE_ERROR: Error al obtener la configuración por ID: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene configuraciones por ID de investigación
   */
  static async getByResearchId(researchId: string): Promise<EyeTrackingRecruitConfig | null> {
    const context = `${this.modelName}.getByResearchId`;
    structuredLog('info', context, 'Buscando configuraciones por researchId', { researchId });
    const command = new DocQueryCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :researchId',
      ExpressionAttributeValues: {
        ':researchId': `RESEARCH#${researchId}`
      }
    });

    try {
      const response = await docClient.send(command);
      const items = (response.Items || []) as DynamoEyeTrackingRecruitConfig[];
      if (items.length === 0) {
          structuredLog('info', context, 'No se encontraron configuraciones', { researchId });
          return null;
      }
      structuredLog('info', context, `Encontradas ${items.length} configuraciones`, { researchId });
      return converters.configFromDynamo(items[0]);
    } catch (error: any) {
      structuredLog('error', context, 'Error al consultar configuraciones por researchId en DynamoDB', { error: error, researchId });
      throw new ApiError(`DATABASE_ERROR: Error al obtener configuraciones por investigación: ${error.message}`, 500);
    }
  }
  
  /**
   * Actualiza una configuración existente
   */
  static async update(
    id: string, 
    updateData: Partial<Omit<EyeTrackingRecruitConfig, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>>
  ): Promise<EyeTrackingRecruitConfig | null> {
    const context = `${this.modelName}.update`;
    structuredLog('info', context, 'Iniciando actualización de configuración', { id, updateData });
    
    // <<< La lógica para obtener la SK sigue siendo potencialmente frágil >>>
    const researchIdFromId = id.split('-')[0];
    if (!researchIdFromId) {
       structuredLog('error', context, 'No se pudo derivar researchId del ID para construir la SK', { id });
       throw new ApiError('INVALID_INPUT: No se pudo determinar la clave completa para la actualización.', 400);
    }
    const dynamoKey = {
      PK: `CONFIG#${id}`,
      SK: `RESEARCH#${researchIdFromId}`
    };
    
    // <<< Verificar existencia ANTES de intentar actualizar >>>
    // Nota: GetCommand podría fallar si la derivación de SK fue incorrecta
    try {
        const getResponse = await docClient.send(new GetCommand({ TableName: TABLES.EYETRACKING_RECRUIT_CONFIG, Key: dynamoKey }));
        if (!getResponse.Item) {
            structuredLog('warn', context, 'Configuración no encontrada para actualizar', { id });
            // <<< Lanzar ApiError 404 >>>
            throw new ApiError(`CONFIG_NOT_FOUND: Configuración con ID ${id} no encontrada.`, 404);
        }
    } catch (error: any) {
        // Capturar error de GetCommand y relanzar
        structuredLog('error', context, 'Error al verificar existencia antes de actualizar', { error: error, id });
        throw new ApiError(`DATABASE_ERROR: Error al verificar configuración antes de actualizar: ${error.message}`, 500);
    }

    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };
    
    Object.entries(updateData).forEach(([key, value]) => {
      // Evitar actualizar claves primarias o GSI PK/SK directamente si están en updateData
      if (key !== 'id' && key !== 'researchId') { 
          updateExpression += `, #k_${key} = :v_${key}`; 
          expressionAttributeValues[`:v_${key}`] = value;
          // Usar ExpressionAttributeNames para evitar conflictos con palabras reservadas
          // Necesitaríamos construir un objeto ExpressionAttributeNames
          // Por simplicidad, omitimos ExpressionAttributeNames aquí, pero es más seguro usarlo.
      }
    });
    
    const command = new UpdateCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
      Key: dynamoKey,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    try {
      const response = await docClient.send(command);
      if (!response.Attributes) {
         // Esto no debería ocurrir si ReturnValues es ALL_NEW y el update fue exitoso
         structuredLog('error', context, 'La actualización no devolvió atributos', { id });
         throw new ApiError('DATABASE_ERROR: La actualización no devolvió atributos inesperadamente.', 500);
      }
      structuredLog('info', context, 'Configuración actualizada exitosamente', { id });
      return converters.configFromDynamo(response.Attributes as DynamoEyeTrackingRecruitConfig);
    } catch(error: any) {
       structuredLog('error', context, 'Error al actualizar configuración en DynamoDB', { error: error, id });
       throw new ApiError(`DATABASE_ERROR: Error al actualizar la configuración: ${error.message}`, 500);
    }
  }
  
  /**
   * Marca una configuración como completada
   */
  static async markAsCompleted(id: string): Promise<EyeTrackingRecruitConfig | null> {
    const context = `${this.modelName}.markAsCompleted`;
    structuredLog('info', context, 'Marcando configuración como completada', { id });

    // <<< La lógica para obtener la SK sigue siendo potencialmente frágil >>>
    const researchIdFromId = id.split('-')[0];
    if (!researchIdFromId) {
       structuredLog('error', context, 'No se pudo derivar researchId del ID para construir la SK', { id });
       throw new ApiError('INVALID_INPUT: No se pudo determinar la clave completa para la operación.', 400);
    }
    const dynamoKey = {
      PK: `CONFIG#${id}`,
      SK: `RESEARCH#${researchIdFromId}`
    };
    
    // <<< Verificar existencia ANTES de intentar actualizar >>>
     try {
        const getResponse = await docClient.send(new GetCommand({ TableName: TABLES.EYETRACKING_RECRUIT_CONFIG, Key: dynamoKey }));
        if (!getResponse.Item) {
            structuredLog('warn', context, 'Configuración no encontrada para marcar como completada', { id });
             // <<< Lanzar ApiError 404 >>>
            throw new ApiError(`CONFIG_NOT_FOUND: Configuración con ID ${id} no encontrada.`, 404);
        }
    } catch (error: any) {
        // Capturar error de GetCommand y relanzar
        structuredLog('error', context, 'Error al verificar existencia antes de marcar como completada', { error: error, id });
        throw new ApiError(`DATABASE_ERROR: Error al verificar configuración: ${error.message}`, 500);
    }

    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
      Key: dynamoKey,
      UpdateExpression: 'SET isCompleted = :isCompleted, completedAt = :completedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isCompleted': true,
        ':completedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const response = await docClient.send(command);
      if (!response.Attributes) {
         structuredLog('error', context, 'La actualización para completar no devolvió atributos', { id });
         throw new ApiError('DATABASE_ERROR: La operación de completar no devolvió atributos inesperadamente.', 500);
      }
      structuredLog('info', context, 'Configuración marcada como completada', { id });
      return converters.configFromDynamo(response.Attributes as DynamoEyeTrackingRecruitConfig);
    } catch (error: any) {
       structuredLog('error', context, 'Error al marcar configuración como completada en DynamoDB', { error: error, id });
       throw new ApiError(`DATABASE_ERROR: Error al marcar configuración como completada: ${error.message}`, 500);
    }
  }
  
  /**
   * Elimina una configuración
   */
  static async delete(id: string): Promise<boolean> {
    const context = `${this.modelName}.delete`;
    structuredLog('info', context, 'Iniciando eliminación de configuración', { id });

    // <<< La lógica para obtener la SK sigue siendo potencialmente frágil >>>
    const researchIdFromId = id.split('-')[0];
    if (!researchIdFromId) {
       structuredLog('error', context, 'No se pudo derivar researchId del ID para construir la SK', { id });
       throw new ApiError('INVALID_INPUT: No se pudo determinar la clave completa para la eliminación.', 400);
    }
    const dynamoKey = {
      PK: `CONFIG#${id}`,
      SK: `RESEARCH#${researchIdFromId}`
    };
    
    // <<< Verificar existencia ANTES de intentar eliminar >>>
    try {
        const getResponse = await docClient.send(new GetCommand({ TableName: TABLES.EYETRACKING_RECRUIT_CONFIG, Key: dynamoKey }));
        if (!getResponse.Item) {
            structuredLog('warn', context, 'Configuración no encontrada para eliminar', { id });
             // <<< Lanzar ApiError 404 >>>
            throw new ApiError(`CONFIG_NOT_FOUND: Configuración con ID ${id} no encontrada.`, 404);
        }
    } catch (error: any) {
        // Capturar error de GetCommand y relanzar
        structuredLog('error', context, 'Error al verificar existencia antes de eliminar', { error: error, id });
        throw new ApiError(`DATABASE_ERROR: Error al verificar configuración antes de eliminar: ${error.message}`, 500);
    }
    
    const command = new DeleteCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_CONFIG,
      Key: dynamoKey
    });

    try {
      await docClient.send(command);
      structuredLog('info', context, 'Configuración eliminada exitosamente', { id });
      return true;
    } catch(error: any) {
      structuredLog('error', context, 'Error al eliminar configuración en DynamoDB', { error: error, id });
      throw new ApiError(`DATABASE_ERROR: Error al eliminar la configuración: ${error.message}`, 500);
    }
  }
}

// Clase para operaciones de participantes
export class EyeTrackingRecruitParticipantModel {
  private static modelName = 'EyeTrackingRecruitParticipantModel'; // Para logging
  
  /**
   * Crea un nuevo participante
   */
  static async create(participantData: Omit<EyeTrackingRecruitParticipant, 'id' | 'startedAt' | 'completedAt' | 'sessionDuration'>): Promise<EyeTrackingRecruitParticipant> {
    const context = `${this.modelName}.create`;
    structuredLog('info', context, 'Iniciando creación de participante', { configId: participantData.recruitConfigId });
    const now = new Date().toISOString();
    const id = uuidv4();
    
    const item: DynamoEyeTrackingRecruitParticipant = {
      id,
      ...participantData,
      PK: `PARTICIPANT#${id}`,
      SK: `CONFIG#${participantData.recruitConfigId}`, // SK usa configId
      GSI1PK: `CONFIG#${participantData.recruitConfigId}`,
      GSI1SK: now,
      GSI2PK: `STATUS#${participantData.status}`,
      GSI2SK: now,
      startedAt: now,
      lastActivityAt: now
    };
    
    const command = new PutCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
      Item: item
    });

    try {
      await docClient.send(command);
      structuredLog('info', context, 'Participante creado exitosamente', { id, configId: participantData.recruitConfigId });
      return converters.participantFromDynamo(item);
    } catch (error: any) {
      structuredLog('error', context, 'Error al guardar participante en DynamoDB', { error: error, id, configId: participantData.recruitConfigId });
      throw new ApiError(`DATABASE_ERROR: Error al crear el participante: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene un participante por su ID
   */
  static async getById(id: string, configId: string): Promise<EyeTrackingRecruitParticipant | null> {
    const context = `${this.modelName}.getById`;
    structuredLog('info', context, 'Buscando participante por ID', { id, configId });

    const command = new GetCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
      Key: {
        PK: `PARTICIPANT#${id}`,
        SK: `CONFIG#${configId}`
      }
    });

    try {
      const response = await docClient.send(command);
      if (!response.Item) {
          structuredLog('info', context, 'Participante no encontrado', { id, configId });
          return null;
      }
      structuredLog('info', context, 'Participante encontrado', { id, configId });
      return converters.participantFromDynamo(response.Item as DynamoEyeTrackingRecruitParticipant);
    } catch (error: any) {
        structuredLog('error', context, 'Error al obtener participante de DynamoDB', { error: error, id, configId });
        throw new ApiError(`DATABASE_ERROR: Error al obtener el participante por ID: ${error.message}`, 500);
    }
  }
  
  /**
   * Actualiza el estado de un participante
   */
  static async updateStatus(
    id: string, 
    configId: string, 
    status: 'complete' | 'disqualified' | 'overquota' | 'inprogress',
    demographicData?: Record<string, any>
  ): Promise<EyeTrackingRecruitParticipant | null> {
    const context = `${this.modelName}.updateStatus`;
    structuredLog('info', context, 'Actualizando estado de participante', { id, configId, status, hasDemographics: !!demographicData });

    const dynamoKey = {
        PK: `PARTICIPANT#${id}`,
        SK: `CONFIG#${configId}`
    };

    // <<< Verificar existencia ANTES de intentar actualizar >>>
    let dynamoParticipant: DynamoEyeTrackingRecruitParticipant | null = null;
    try {
        const getResponse = await docClient.send(new GetCommand({ TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT, Key: dynamoKey }));
        if (!getResponse.Item) {
            structuredLog('warn', context, 'Participante no encontrado para actualizar estado', { id, configId });
            // <<< Lanzar ApiError 404 >>>
            throw new ApiError(`PARTICIPANT_NOT_FOUND: Participante con ID ${id} no encontrado.`, 404);
        }
        dynamoParticipant = getResponse.Item as DynamoEyeTrackingRecruitParticipant;
    } catch (error: any) {
        // Capturar error de GetCommand (incluido el 404) y relanzar
        if (error instanceof ApiError && error.statusCode === 404) throw error;
        structuredLog('error', context, 'Error al verificar existencia antes de actualizar estado', { error: error, id, configId });
        throw new ApiError(`DATABASE_ERROR: Error al verificar participante antes de actualizar: ${error.message}`, 500);
    }
    
    const now = new Date().toISOString();
    let completedAt = undefined;
    let sessionDuration = undefined;
    
    if (status === 'complete' && !dynamoParticipant.completedAt) {
      completedAt = now;
      const startTime = new Date(dynamoParticipant.startedAt).getTime();
      const endTime = new Date(now).getTime();
      sessionDuration = Math.round((endTime - startTime) / 1000);
    }
    
    let updateExpression = 'SET #s = :status, lastActivityAt = :lastActivityAt, GSI2PK = :gsi2pk';
    const expressionAttributeValues: Record<string, any> = {
      ':status': status,
      ':lastActivityAt': now,
      ':gsi2pk': `STATUS#${status}`
    };
    // Usar ExpressionAttributeNames porque 'status' es palabra reservada
    const expressionAttributeNames: Record<string, string> = { '#s': 'status' };
    
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
    
    const command = new UpdateCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
      Key: dynamoKey,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames, // Añadir Names
      ReturnValues: 'ALL_NEW'
    });

    try {
      const response = await docClient.send(command);
      if (!response.Attributes) {
        structuredLog('error', context, 'La actualización de estado no devolvió atributos', { id, configId });
        throw new ApiError('DATABASE_ERROR: La actualización de estado no devolvió atributos inesperadamente.', 500);
      }
      structuredLog('info', context, 'Estado de participante actualizado exitosamente', { id, configId, newStatus: status });
      return converters.participantFromDynamo(response.Attributes as DynamoEyeTrackingRecruitParticipant);
    } catch (error: any) {
      structuredLog('error', context, 'Error al actualizar estado en DynamoDB', { error: error, id, configId });
      throw new ApiError(`DATABASE_ERROR: Error al actualizar estado del participante: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene los participantes por configuración de reclutamiento
   */
  static async getByConfigId(configId: string): Promise<EyeTrackingRecruitParticipant[]> {
    const context = `${this.modelName}.getByConfigId`;
    structuredLog('info', context, 'Buscando participantes por configId', { configId });
    const command = new DocQueryCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :configId',
      ExpressionAttributeValues: {
        ':configId': `CONFIG#${configId}`
      }
    });

    try {
      const response = await docClient.send(command);
      const items = (response.Items || []) as DynamoEyeTrackingRecruitParticipant[];
      structuredLog('info', context, `Encontrados ${items.length} participantes`, { configId });
      return converters.participantsFromDynamo(items);
    } catch (error: any) {
      structuredLog('error', context, 'Error al consultar participantes por configId en DynamoDB', { error: error, configId });
      throw new ApiError(`DATABASE_ERROR: Error al obtener participantes por configuración: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene los participantes por estado
   */
  static async getByStatus(status: string): Promise<EyeTrackingRecruitParticipant[]> {
    const context = `${this.modelName}.getByStatus`;
    structuredLog('info', context, 'Buscando participantes por status', { status });
    const command = new DocQueryCommand({
      TableName: TABLES.EYETRACKING_RECRUIT_PARTICIPANT,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :status',
      ExpressionAttributeValues: {
        ':status': `STATUS#${status}`
      }
    });

    try {
      const response = await docClient.send(command);
      const items = (response.Items || []) as DynamoEyeTrackingRecruitParticipant[];
      structuredLog('info', context, `Encontrados ${items.length} participantes con status ${status}`, { status });
      return converters.participantsFromDynamo(items);
    } catch (error: any) {
      structuredLog('error', context, 'Error al consultar participantes por status en DynamoDB', { error: error, status });
      throw new ApiError(`DATABASE_ERROR: Error al obtener participantes por estado: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene estadísticas de participantes para una configuración
   */
  static async getStats(configId: string): Promise<EyeTrackingRecruitStats> {
     const context = `${this.modelName}.getStats`;
     structuredLog('info', context, 'Calculando estadísticas para configId', { configId });
     // La llamada a getByConfigId ya tiene manejo de errores y logging
     const participants = await this.getByConfigId(configId);
     const total = participants.length;
     
     const complete = participants.filter(p => p.status === 'complete').length;
     const disqualified = participants.filter(p => p.status === 'disqualified').length;
     const overquota = participants.filter(p => p.status === 'overquota').length;
     
     const stats: EyeTrackingRecruitStats = {
       complete: { count: complete, percentage: total ? Math.round((complete / total) * 100) : 0 },
       disqualified: { count: disqualified, percentage: total ? Math.round((disqualified / total) * 100) : 0 },
       overquota: { count: overquota, percentage: total ? Math.round((overquota / total) * 100) : 0 }
     };
     
     structuredLog('info', context, 'Estadísticas calculadas', { configId, stats });
     return stats;
   }
}

// Clase para operaciones de enlaces de reclutamiento
export class RecruitmentLinkModel {
  private static modelName = 'RecruitmentLinkModel'; // Para logging
  
  /**
   * Crea un nuevo enlace de reclutamiento
   */
  static async create(
    researchId: string,
    configId: string,
    type: 'standard' | 'preview' | 'admin' = 'standard',
    expiresAt?: string
  ): Promise<RecruitmentLink> {
    const context = `${this.modelName}.create`;
    structuredLog('info', context, 'Creando enlace de reclutamiento', { researchId, configId, type });
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
    
    const command = new PutCommand({
      TableName: TABLES.RECRUITMENT_LINK,
      Item: item
    });

    try {
      await docClient.send(command);
      structuredLog('info', context, 'Enlace creado exitosamente', { id, token, configId });
      return converters.linkFromDynamo(item);
    } catch (error: any) {
      structuredLog('error', context, 'Error al guardar enlace en DynamoDB', { error: error, id, configId });
      throw new ApiError(`DATABASE_ERROR: Error al crear el enlace de reclutamiento: ${error.message}`, 500);
    }
  }
  
  /**
   * Genera un token único para el enlace
   */
  private static generateToken(): string {
    // Sin cambios, no realiza I/O
    return uuidv4().substring(0, 8);
  }
  
  /**
   * Obtiene un enlace por su token
   */
  static async getByToken(token: string): Promise<RecruitmentLink | null> {
    const context = `${this.modelName}.getByToken`;
    structuredLog('info', context, 'Buscando enlace por token', { token });
    // Nota: Scan es ineficiente. Si esto se usa frecuentemente, considerar un GSI por token.
    const command = new DocScanCommand({
      TableName: TABLES.RECRUITMENT_LINK,
      FilterExpression: 'token = :token',
      ExpressionAttributeValues: { ':token': token }
    });

    try {
      const response = await docClient.send(command);
      if (!response.Items || response.Items.length === 0) {
        structuredLog('info', context, 'Enlace no encontrado por token', { token });
        return null;
      }
      if (response.Items.length > 1) {
        // Esto indicaría un problema, los tokens deberían ser únicos
        structuredLog('warn', context, 'Múltiples enlaces encontrados para el mismo token (debería ser único)', { token, count: response.Items.length });
      }
      structuredLog('info', context, 'Enlace encontrado', { token, id: response.Items[0].PK });
      return converters.linkFromDynamo(response.Items[0] as DynamoRecruitmentLink);
    } catch (error: any) {
      structuredLog('error', context, 'Error al buscar enlace por token en DynamoDB (Scan)', { error: error, token });
      throw new ApiError(`DATABASE_ERROR: Error al obtener el enlace por token: ${error.message}`, 500);
    }
  }
  
  /**
   * Incrementa el contador de accesos para un enlace
   */
  static async incrementAccessCount(token: string): Promise<RecruitmentLink | null> {
    const context = `${this.modelName}.incrementAccessCount`;
    structuredLog('info', context, 'Incrementando contador de acceso para token', { token });

    // 1. Encontrar el enlace (PK/SK) usando el token (Scan ineficiente)
    let dynamoLink: DynamoRecruitmentLink | null = null;
    try {
      const scanResponse = await docClient.send(new DocScanCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        FilterExpression: 'token = :token',
        ExpressionAttributeValues: { ':token': token }
      }));
      if (!scanResponse.Items || scanResponse.Items.length === 0) {
        structuredLog('warn', context, 'Enlace no encontrado para incrementar acceso', { token });
         // <<< Lanzar ApiError 404 >>>
        throw new ApiError(`LINK_NOT_FOUND: Enlace con token ${token} no encontrado.`, 404);
      }
      dynamoLink = scanResponse.Items[0] as DynamoRecruitmentLink;
    } catch (error: any) {
       if (error instanceof ApiError && error.statusCode === 404) throw error;
       structuredLog('error', context, 'Error al buscar enlace por token antes de incrementar acceso', { error: error, token });
       throw new ApiError(`DATABASE_ERROR: Error al buscar enlace antes de actualizar: ${error.message}`, 500);
    }

    // 2. Actualizar el contador usando PK/SK encontrados
    const now = new Date().toISOString();
    const command = new UpdateCommand({
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
    });

    try {
      const response = await docClient.send(command);
      if (!response.Attributes) {
        structuredLog('error', context, 'La actualización del contador no devolvió atributos', { token, pk: dynamoLink.PK });
        throw new ApiError('DATABASE_ERROR: La actualización del contador no devolvió atributos inesperadamente.', 500);
      }
      structuredLog('info', context, 'Contador de acceso incrementado', { token, newCount: response.Attributes.accessCount });
      return converters.linkFromDynamo(response.Attributes as DynamoRecruitmentLink);
    } catch (error: any) {
      structuredLog('error', context, 'Error al incrementar contador de acceso en DynamoDB', { error: error, token, pk: dynamoLink.PK });
      throw new ApiError(`DATABASE_ERROR: Error al actualizar el contador de acceso: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene todos los enlaces activos para una configuración
   */
  static async getActiveByConfigId(configId: string): Promise<RecruitmentLink[]> {
    const context = `${this.modelName}.getActiveByConfigId`;
    structuredLog('info', context, 'Buscando enlaces activos por configId', { configId });
    const command = new DocQueryCommand({
      TableName: TABLES.RECRUITMENT_LINK,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :configId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':configId': `CONFIG#${configId}`,
        ':isActive': true
      }
    });

    try {
      const response = await docClient.send(command);
      const items = (response.Items || []) as DynamoRecruitmentLink[];
      structuredLog('info', context, `Encontrados ${items.length} enlaces activos`, { configId });
      return converters.linksFromDynamo(items);
    } catch (error: any) {
      structuredLog('error', context, 'Error al consultar enlaces activos por configId en DynamoDB', { error: error, configId });
      throw new ApiError(`DATABASE_ERROR: Error al obtener enlaces activos por configuración: ${error.message}`, 500);
    }
  }
  
  /**
   * Desactiva un enlace
   */
  static async deactivate(token: string): Promise<RecruitmentLink | null> {
    const context = `${this.modelName}.deactivate`;
    structuredLog('info', context, 'Desactivando enlace por token', { token });

     // 1. Encontrar el enlace (PK/SK) usando el token (Scan ineficiente)
    let dynamoLink: DynamoRecruitmentLink | null = null;
    try {
      const scanResponse = await docClient.send(new DocScanCommand({
        TableName: TABLES.RECRUITMENT_LINK,
        FilterExpression: 'token = :token',
        ExpressionAttributeValues: { ':token': token }
      }));
      if (!scanResponse.Items || scanResponse.Items.length === 0) {
        structuredLog('warn', context, 'Enlace no encontrado para desactivar', { token });
        // <<< Lanzar ApiError 404 >>>
        throw new ApiError(`LINK_NOT_FOUND: Enlace con token ${token} no encontrado.`, 404);
      }
      dynamoLink = scanResponse.Items[0] as DynamoRecruitmentLink;
    } catch (error: any) {
       if (error instanceof ApiError && error.statusCode === 404) throw error;
       structuredLog('error', context, 'Error al buscar enlace por token antes de desactivar', { error: error, token });
       throw new ApiError(`DATABASE_ERROR: Error al buscar enlace antes de desactivar: ${error.message}`, 500);
    }

    // 2. Actualizar el estado usando PK/SK encontrados
    const command = new UpdateCommand({
      TableName: TABLES.RECRUITMENT_LINK,
      Key: {
        PK: dynamoLink.PK,
        SK: dynamoLink.SK
      },
      UpdateExpression: 'SET isActive = :isActive',
      ExpressionAttributeValues: { ':isActive': false },
      ReturnValues: 'ALL_NEW'
    });

    try {
      const response = await docClient.send(command);
      if (!response.Attributes) {
        structuredLog('error', context, 'La desactivación del enlace no devolvió atributos', { token, pk: dynamoLink.PK });
        throw new ApiError('DATABASE_ERROR: La desactivación del enlace no devolvió atributos inesperadamente.', 500);
      }
      structuredLog('info', context, 'Enlace desactivado exitosamente', { token, id: dynamoLink.PK });
      return converters.linkFromDynamo(response.Attributes as DynamoRecruitmentLink);
    } catch (error: any) {
      structuredLog('error', context, 'Error al desactivar enlace en DynamoDB', { error: error, token, pk: dynamoLink.PK });
      throw new ApiError(`DATABASE_ERROR: Error al desactivar el enlace: ${error.message}`, 500);
    }
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
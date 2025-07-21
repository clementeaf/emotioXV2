import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateModuleResponseDto,
  ModuleResponse,
  ParticipantResponsesDocument,
  UpdateModuleResponseDto
} from '../models/moduleResponse.model';
import { ApiError } from '../utils/errors';
import { quotaManager } from '../utils/quotaManager';

const RESEARCH_INDEX = 'ResearchIndex';
const RESEARCH_PARTICIPANT_INDEX = 'ResearchParticipantIndex';

// Utilidad para serializar metadata antes de guardar en DynamoDB
function serializeMetadata(metadata: any): string | undefined {
  if (!metadata) return undefined;
  try {
    return JSON.stringify(metadata);
  } catch {
    return undefined;
  }
}

// Utilidad para deserializar metadata al leer de DynamoDB
function deserializeMetadata(metadata: any): any {
  if (!metadata) return undefined;
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch {
    return undefined;
  }
}

export class ModuleResponseService {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;

  constructor() {
    this.tableName = process.env.MODULE_RESPONSES_TABLE || 'ModuleResponses';
    if (!this.tableName) {
      throw new Error('FATAL ERROR: MODULE_RESPONSES_TABLE environment variable is not set.');
    }

    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({
      region,
      ...(process.env.IS_OFFLINE === 'true' && { endpoint: 'http://localhost:8000' })
    });

    const marshallOptions = { removeUndefinedValues: true };
    const unmarshallOptions = { wrapNumbers: false };
    const translateConfig = { marshallOptions, unmarshallOptions };
    this.dynamoClient = DynamoDBDocumentClient.from(client, translateConfig);

    console.log(`[ModuleResponseService] Initialized for table: ${this.tableName} in region: ${region}`);
  }

  /**
   * Crea un documento de respuestas nuevo para un participante
   * @param data Datos iniciales para el documento
   */
  private async createNewDocument(
    researchId: string,
    participantId: string,
    initialResponse: ModuleResponse
  ): Promise<ModuleResponse> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Mantener metadata como objeto en memoria
    const responseForMemory = {
      ...initialResponse,
      metadata: initialResponse.metadata
    };

    const newDocument: ParticipantResponsesDocument = {
      id,
      researchId,
      participantId,
      responses: [responseForMemory],
      metadata: initialResponse.metadata || {},
      createdAt: now,
      updatedAt: now,
      isCompleted: false
    };

    // Serializar metadata solo para guardar en DynamoDB
    const itemToSave = {
      ...newDocument,
      responses: newDocument.responses.map(r => ({
        ...r,
        metadata: serializeMetadata(r.metadata)
      })),
      metadata: serializeMetadata(newDocument.metadata)
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: itemToSave,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    try {
      await this.dynamoClient.send(command);

      // NUEVO: Manejar consistencia eventual de DynamoDB con retry
      let createdDoc: ParticipantResponsesDocument | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries && !createdDoc) {
        try {
          // Pequeño delay para permitir que DynamoDB propague la escritura
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
          }

          createdDoc = await this.findByResearchAndParticipant(researchId, participantId);

          if (createdDoc && createdDoc.responses && createdDoc.responses.length > 0) {
            console.log(`[ModuleResponseService.createNewDocument] ✅ Documento recuperado exitosamente en intento ${retryCount + 1}`);
            return createdDoc.responses[0];
          }
        } catch (retryError) {
          console.warn(`[ModuleResponseService.createNewDocument] ⚠️ Intento ${retryCount + 1} falló:`, retryError);
        }

        retryCount++;
      }

      // Si llegamos aquí, no pudimos recuperar el documento después de los retries
      console.error(`[ModuleResponseService.createNewDocument] ❌ No se pudo recuperar el documento después de ${maxRetries} intentos`);

      // NUEVO: En lugar de fallar, devolver la respuesta que acabamos de crear
      // Esto es más robusto que fallar completamente
      console.log(`[ModuleResponseService.createNewDocument] 🔄 Devolviendo respuesta creada sin recuperación de DynamoDB`);
      return initialResponse;

    } catch (error: any) {
      console.error('[ModuleResponseService.createNewDocument] Error:', error);
      if (error.name === 'ConditionalCheckFailedException') {
        throw new ApiError('Conflict: Document ID collision.', 409);
      }
      throw new ApiError(`Database Error: Could not create response document - ${error.message}`, 500);
    }
  }

  /**
   * Encuentra un documento de respuestas por research y participante
   */
  async findByResearchAndParticipant(
    researchId: string,
    participantId: string
  ): Promise<ParticipantResponsesDocument | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: RESEARCH_PARTICIPANT_INDEX,
      KeyConditionExpression: 'researchId = :rid AND participantId = :pid',
      ExpressionAttributeValues: {
        ':rid': researchId,
        ':pid': participantId
      },
      Limit: 1
    });

    try {
      console.log(`[ModuleResponseService.findByResearchAndParticipant] Querying DDB: Table=${this.tableName}, Index=${RESEARCH_PARTICIPANT_INDEX}, researchId=${researchId}, participantId=${participantId}`);
      const result = await this.dynamoClient.send(command);
      console.log(`[ModuleResponseService.findByResearchAndParticipant] Query result items count: ${result.Items?.length || 0}`);

      if (!result.Items || result.Items.length === 0) {
        console.log(`[ModuleResponseService.findByResearchAndParticipant] No documents found for researchId=${researchId}, participantId=${participantId}`);
        return null;
      }

      const rawDocument = result.Items[0] as ParticipantResponsesDocument;
      console.log(`[ModuleResponseService.findByResearchAndParticipant] Raw document metadata:`, rawDocument.metadata);

      // NUEVO: Validación adicional para asegurar que el documento tiene la estructura esperada
      if (!rawDocument.responses || !Array.isArray(rawDocument.responses)) {
        console.warn(`[ModuleResponseService.findByResearchAndParticipant] ⚠️ Documento encontrado pero sin array de respuestas válido`);
        return null;
      }

      // Deserializar metadata del documento y de cada respuesta
      const processedDocument = {
        ...rawDocument,
        metadata: deserializeMetadata(rawDocument.metadata),
        responses: (rawDocument.responses || []).map(r => ({
          ...r,
          metadata: deserializeMetadata(r.metadata)
        }))
      };

      console.log(`[ModuleResponseService.findByResearchAndParticipant] Processed document metadata:`, processedDocument.metadata);
      console.log(`[ModuleResponseService.findByResearchAndParticipant] Processed responses count:`, processedDocument.responses.length);

      return processedDocument;
    } catch (error: any) {
      console.error('[ModuleResponseService.findByResearchAndParticipant] Full DDB Error object:', JSON.stringify(error, null, 2));
      console.error('[ModuleResponseService.findByResearchAndParticipant] DDB Error Name:', error.name);
      console.error('[ModuleResponseService.findByResearchAndParticipant] DDB Error Message:', error.message);

      // NUEVO: Manejar errores específicos de DynamoDB de manera más granular
      if (error.name === 'ResourceNotFoundException') {
        console.error('[ModuleResponseService.findByResearchAndParticipant] Table or index not found');
        throw new ApiError('Database configuration error: Table or index not found', 500);
      }

      if (error.name === 'ValidationException') {
        console.error('[ModuleResponseService.findByResearchAndParticipant] Invalid query parameters');
        throw new ApiError('Database query error: Invalid parameters', 500);
      }

      // Para otros errores, propagar un error más detallado
      throw new ApiError(
        `Database Query Failed in findByResearchAndParticipant: ${error.name} - ${error.message}`,
        500
      );
    }
  }

  /**
   * Crea o actualiza una respuesta de módulo
   * Si el documento no existe, lo crea con la primera respuesta
   * Si el documento existe, agrega o actualiza la respuesta al arreglo
   */
  async saveModuleResponse(
    createDto: CreateModuleResponseDto
  ): Promise<ParticipantResponsesDocument> {
    const { researchId, participantId, questionKey, responses, metadata } = createDto;

    const existingDocument = await this.findByResearchAndParticipant(researchId, participantId);

    let savedDocument: ParticipantResponsesDocument;

    if (!existingDocument) {
      // Crear nuevo documento con las responses
      savedDocument = await this.createNewDocumentWithResponses(researchId, participantId, responses, metadata);
    } else {
      // Actualizar documento existente con las nuevas responses
      savedDocument = await this.updateDocumentWithResponses(existingDocument, responses, metadata);
    }

    // 🎯 VERIFICAR CUOTA SI ES THANK_YOU_SCREEN
    let quotaResult = null;
    if (questionKey === 'thank_you_screen') {
      try {
        console.log(`[ModuleResponseService] 🎯 Verificando cuota para participante ${participantId} en investigación ${researchId}`);
        quotaResult = await quotaManager.checkQuotaAndMarkParticipant(researchId, participantId);
        console.log(`[ModuleResponseService.saveModuleResponse] ✅ Resultado de cuota:`, quotaResult);

        // 🎯 AGREGAR RESULTADO DE CUOTA AL DOCUMENTO
        savedDocument.quotaResult = quotaResult;

      } catch (error) {
        console.error(`[ModuleResponseService.saveModuleResponse] ❌ Error verificando cuota:`, error);
        // No fallar el guardado si falla la verificación de cuota
      }
    }

    return savedDocument;
  }

  /**
   * Actualiza una respuesta específica en un documento
   */
  async updateModuleResponse(
    researchId: string,
    participantId: string,
    responseId: string,
    updateDto: UpdateModuleResponseDto
  ): Promise<ParticipantResponsesDocument> {
    // Buscar documento existente
    const existingDocument = await this.findByResearchAndParticipant(researchId, participantId);

    if (!existingDocument) {
      throw new ApiError('Not Found: No document exists for this research and participant.', 404);
    }

    // Actualizar documento con las nuevas responses
    const updatedDocument = await this.updateDocumentWithResponses(existingDocument, updateDto.responses, updateDto.metadata);
    return updatedDocument;
  }

  /**
   * Crea un nuevo documento con responses
   */
  private async createNewDocumentWithResponses(
    researchId: string,
    participantId: string,
    responses: Array<{ questionKey: string; response: any; timestamp: string }>,
    metadata: any
  ): Promise<ParticipantResponsesDocument> {
    const documentId = uuidv4();
    const now = new Date().toISOString();

    const newDocument: ParticipantResponsesDocument = {
      id: documentId,
      researchId,
      participantId,
      responses: responses.map(r => ({
        ...r,
        createdAt: now, // Timestamp de creación
        updatedAt: undefined, // No hay actualización en creación
        metadata: {}
      })),
      metadata: metadata || {},
      createdAt: now,
      updatedAt: now,
      isCompleted: false
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...newDocument,
        metadata: serializeMetadata(newDocument.metadata),
        responses: newDocument.responses.map(r => ({
          ...r,
          metadata: serializeMetadata(r.metadata)
        }))
      }
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[ModuleResponseService.createNewDocumentWithResponses] ✅ Documento creado: ${documentId}`);
      return newDocument;
    } catch (error: any) {
      console.error('[ModuleResponseService.createNewDocumentWithResponses] Error:', error);
      throw new ApiError(`Database Error: Could not create new document - ${error.message}`, 500);
    }
  }

  /**
   * Actualiza un documento existente con nuevas responses
   */
  private async updateDocumentWithResponses(
    existingDocument: ParticipantResponsesDocument,
    newResponses: Array<{ questionKey: string; response: any; timestamp: string }>,
    metadata: any
  ): Promise<ParticipantResponsesDocument> {
    const now = new Date().toISOString();

    // Combinar responses existentes con nuevas responses
    const updatedResponses = [...existingDocument.responses];

    for (const newResponse of newResponses) {
      const existingIndex = updatedResponses.findIndex(r => r.questionKey === newResponse.questionKey);

      if (existingIndex >= 0) {
        // Actualizar respuesta existente
        updatedResponses[existingIndex] = {
          ...updatedResponses[existingIndex],
          response: newResponse.response,
          timestamp: newResponse.timestamp,
          updatedAt: now // Timestamp de actualización
        };
      } else {
        // Agregar nueva respuesta
        updatedResponses.push({
          ...newResponse,
          createdAt: now, // Timestamp de creación
          updatedAt: undefined, // No hay actualización en creación
          metadata: {}
        });
      }
    }

    const updateExpression = 'SET #responses = :responses, #updatedAt = :updatedAt, #metadata = :metadata';
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: existingDocument.id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#responses': 'responses',
        '#updatedAt': 'updatedAt',
        '#metadata': 'metadata'
      },
      ExpressionAttributeValues: {
        ':responses': updatedResponses.map(r => ({
          ...r,
          metadata: serializeMetadata(r.metadata)
        })),
        ':updatedAt': now,
        ':metadata': serializeMetadata(metadata || existingDocument.metadata)
      },
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.dynamoClient.send(command);
      const updatedDocument = result.Attributes as ParticipantResponsesDocument;

      // Deserializar metadata antes de devolver
      return {
        ...updatedDocument,
        metadata: deserializeMetadata(updatedDocument.metadata),
        responses: (updatedDocument.responses || []).map(r => ({
          ...r,
          metadata: deserializeMetadata(r.metadata)
        }))
      };
    } catch (error: any) {
      console.error('[ModuleResponseService.updateDocumentWithResponses] Error:', error);
      throw new ApiError(`Database Error: Could not update document - ${error.message}`, 500);
    }
  }

  /**
   * Obtiene todas las respuestas para un research y un participante
   */
  async getResponsesForParticipant(
    researchId: string,
    participantId: string
  ): Promise<ParticipantResponsesDocument | null> {
    const doc = await this.findByResearchAndParticipant(researchId, participantId);
    if (!doc) return null;
    return {
      ...doc,
      responses: (doc.responses || []).map(r => ({
        ...r,
        metadata: deserializeMetadata(r.metadata)
      })),
      metadata: deserializeMetadata(doc.metadata)
    };
  }

  /**
   * Marca un documento de respuestas como completado
   */
  async markAsCompleted(
    researchId: string,
    participantId: string
  ): Promise<ParticipantResponsesDocument | null> {
    const existingDocument = await this.findByResearchAndParticipant(researchId, participantId);

    if (!existingDocument) {
      throw new ApiError('Not Found: No document exists for this research and participant.', 404);
    }

    const now = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: existingDocument.id },
      UpdateExpression: 'SET #isCompleted = :completed, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#isCompleted': 'isCompleted',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':completed': true,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.dynamoClient.send(command);
      return result.Attributes as ParticipantResponsesDocument;
    } catch (error: any) {
      console.error('[ModuleResponseService.markAsCompleted] Error:', error);
      throw new ApiError(`Database Error: Could not mark document as completed - ${error.message}`, 500);
    }
  }

  /**
   * Obtiene todas las respuestas para un research específico
   */
  async getResponsesByResearch(researchId: string): Promise<ParticipantResponsesDocument[]> {
    const docs = await (async () => {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: RESEARCH_INDEX,
        KeyConditionExpression: 'researchId = :rid',
        ExpressionAttributeValues: {
          ':rid': researchId
        }
      });
      try {
        const result = await this.dynamoClient.send(command);
        return (result.Items as ParticipantResponsesDocument[]) || [];
      } catch (error: any) {
        console.error('[ModuleResponseService.getResponsesByResearch] Error:', error);
        throw new ApiError(`Database Error: Could not retrieve responses by research - ${error.message}`, 500);
      }
    })();
    return docs.map(doc => ({
      ...doc,
      responses: (doc.responses || []).map(r => ({
        ...r,
        metadata: deserializeMetadata(r.metadata)
      })),
      metadata: deserializeMetadata(doc.metadata)
    }));
  }

  /**
   * Elimina todas las respuestas de un participante específico en un research
   */
  async deleteAllResponses(
    researchId: string,
    participantId: string
  ): Promise<boolean> {
    // Buscar el documento existente
    const existingDocument = await this.findByResearchAndParticipant(researchId, participantId);

    if (!existingDocument) {
      console.log(`[ModuleResponseService.deleteAllResponses] No document found for researchId=${researchId}, participantId=${participantId}`);
      return false; // No hay nada que eliminar
    }

    // Eliminar completamente el documento
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id: existingDocument.id }
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[ModuleResponseService.deleteAllResponses] Successfully deleted document for researchId=${researchId}, participantId=${participantId}, documentId=${existingDocument.id}`);
      return true;
    } catch (error: any) {
      console.error('[ModuleResponseService.deleteAllResponses] Error:', error);
      throw new ApiError(`Database Error: Could not delete responses - ${error.message}`, 500);
    }
  }

  /**
   * Obtener todos los participantes de una investigación
   */
  async getParticipantsByResearch(researchId: string): Promise<Array<{ id: string; name?: string; email?: string; status?: string; progress?: number }>> {
    try {
      console.log(`[ModuleResponseService.getParticipantsByResearch] 🔍 Obteniendo participantes para research: ${researchId}`);

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: RESEARCH_INDEX,
        KeyConditionExpression: 'researchId = :rid',
        ExpressionAttributeValues: {
          ':rid': researchId
        }
      });

      const result = await this.dynamoClient.send(command);

      if (!result.Items || result.Items.length === 0) {
        console.log(`[ModuleResponseService.getParticipantsByResearch] 📭 No se encontraron participantes para research: ${researchId}`);
        return [];
      }

      // Extraer participantes únicos
      const participantsMap = new Map<string, { id: string; name?: string; email?: string; status?: string; progress?: number }>();

      for (const item of result.Items) {
        const participantId = item.participantId;
        if (participantId && !participantsMap.has(participantId)) {
          participantsMap.set(participantId, {
            id: participantId,
            name: item.participantName || 'Participante',
            email: item.participantEmail,
            status: item.isCompleted ? 'Completado' : 'En progreso',
            progress: item.responses ? Math.round((item.responses.length / 12) * 100) : 0 // Asumiendo 12 preguntas totales
          });
        }
      }

      const participants = Array.from(participantsMap.values());
      console.log(`[ModuleResponseService.getParticipantsByResearch] ✅ Encontrados ${participants.length} participantes únicos`);

      return participants;
    } catch (error: any) {
      console.error('[ModuleResponseService.getParticipantsByResearch] Error:', error);
      throw new ApiError(`Database Error: Could not get participants - ${error.message}`, 500);
    }
  }
}

// Exportar una instancia del servicio para ser usada en toda la aplicación
export const moduleResponseService = new ModuleResponseService();

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { 
  ParticipantResponsesDocument, 
  ModuleResponse, 
  CreateModuleResponseDto, 
  UpdateModuleResponseDto 
} from '../models/moduleResponse.model';
import { ApiError } from '../utils/errors';

// Nombres de los índices secundarios globales
const RESEARCH_INDEX = 'ResearchIndex';
const RESEARCH_PARTICIPANT_INDEX = 'ResearchParticipantIndex';

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
  ): Promise<ParticipantResponsesDocument> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const newDocument: ParticipantResponsesDocument = {
      id,
      researchId,
      participantId,
      responses: [initialResponse],
      createdAt: now,
      updatedAt: now,
      isCompleted: false
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: newDocument,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    try {
      await this.dynamoClient.send(command);
      return newDocument;
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
      return (result.Items?.[0] as ParticipantResponsesDocument) || null;
    } catch (error: any) {
      console.error('[ModuleResponseService.findByResearchAndParticipant] Full DDB Error object:', JSON.stringify(error, null, 2));
      console.error('[ModuleResponseService.findByResearchAndParticipant] DDB Error Name:', error.name);
      console.error('[ModuleResponseService.findByResearchAndParticipant] DDB Error Message:', error.message);
      // Propagar un error más detallado, sin pasar el objeto error original al constructor si no lo soporta.
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
  ): Promise<ModuleResponse> {
    const { researchId, participantId, stepType, stepTitle, response } = createDto;
    
    const existingDocument = await this.findByResearchAndParticipant(researchId, participantId);
    
    const responseId = uuidv4();
    const now = new Date().toISOString();
    
    const moduleResponse: ModuleResponse = {
      id: responseId,
      stepType,
      stepTitle,
      response,
      createdAt: now
    };

    if (!existingDocument) {
      await this.createNewDocument(researchId, participantId, moduleResponse);
      return moduleResponse;
    }
    
    const existingResponseIndex = existingDocument.responses.findIndex(
      r => r.stepType === stepType
    );
    
    let updateExpression: string;
    let expressionAttributeNames: Record<string, string> = {
      '#responses': 'responses',
      '#updatedAt': 'updatedAt' // Para el updatedAt del documento principal
    };
    let expressionAttributeValues: Record<string, any> = {
      ':updatedAt': now // Para el updatedAt del documento principal
    };
    
    if (existingResponseIndex >= 0) {
      expressionAttributeNames['#nestedResponse'] = 'response'; // Alias para el campo 'response' anidado
      expressionAttributeNames['#nestedUpdatedAt'] = 'updatedAt'; // Alias para el campo 'updatedAt' anidado

      updateExpression = `SET 
        #responses[${existingResponseIndex}].#nestedResponse = :responseValue, 
        #responses[${existingResponseIndex}].#nestedUpdatedAt = :responseNestedUpdatedAt, 
        #updatedAt = :updatedAt`; // #updatedAt aquí es el del documento principal
      
      expressionAttributeValues[':responseValue'] = response;
      expressionAttributeValues[':responseNestedUpdatedAt'] = now; // Valor para el updatedAt anidado
    } else {
      updateExpression = 'SET #responses = list_append(if_not_exists(#responses, :empty_list), :newResponse), #updatedAt = :updatedAt';
      expressionAttributeValues[':newResponse'] = [moduleResponse];
      expressionAttributeValues[':empty_list'] = []; // Necesario para if_not_exists en list_append la primera vez
    }
    
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: existingDocument.id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      const updatedDocument = result.Attributes as ParticipantResponsesDocument;
      
      if (existingResponseIndex >= 0) {
        return updatedDocument.responses[existingResponseIndex];
      } else {
        // Devolver la última respuesta añadida, que es la que acabamos de insertar
        return updatedDocument.responses[updatedDocument.responses.length - 1];
      }
    } catch (error: any) {
      console.error('[ModuleResponseService.saveModuleResponse] Error DDB Object:', JSON.stringify(error, null, 2));
      console.error('[ModuleResponseService.saveModuleResponse] Error Name:', error.name);
      console.error('[ModuleResponseService.saveModuleResponse] Error Message:', error.message);
      throw new ApiError(`Database Error: Could not save module response - ${error.name}: ${error.message}`, 500);
    }
  }

  /**
   * Actualiza una respuesta específica en un documento
   */
  async updateModuleResponse(
    researchId: string,
    participantId: string,
    responseId: string,
    updateDto: UpdateModuleResponseDto
  ): Promise<ModuleResponse | null> {
    // Buscar documento existente
    const existingDocument = await this.findByResearchAndParticipant(researchId, participantId);
    
    if (!existingDocument) {
      throw new ApiError('Not Found: No document exists for this research and participant.', 404);
    }
    
    // Buscar índice de la respuesta en el array
    const responseIndex = existingDocument.responses.findIndex(r => r.id === responseId);
    
    if (responseIndex === -1) {
      throw new ApiError('Not Found: Response ID not found in document.', 404);
    }
    
    const now = new Date().toISOString();
    
    // Actualizar sólo el campo 'response' y el timestamp
    const updateExpression = `SET 
      #responses[${responseIndex}].#nestedResponse = :newResponse, 
      #responses[${responseIndex}].#nestedUpdatedAt = :updatedAtTimestamp, 
      #docUpdatedAt = :updatedAtTimestamp`;
    
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: existingDocument.id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#responses': 'responses',
        '#nestedResponse': 'response', // Alias para el campo 'response' anidado
        '#nestedUpdatedAt': 'updatedAt', // Alias para el campo 'updatedAt' anidado
        '#docUpdatedAt': 'updatedAt' // Para el 'updatedAt' del documento principal
      },
      ExpressionAttributeValues: {
        ':newResponse': updateDto.response,
        ':updatedAtTimestamp': now // Usar un nombre de placeholder diferente para evitar colisión con el nombre de atributo
      },
      ReturnValues: 'ALL_NEW'
    });
    
    try {
      const result = await this.dynamoClient.send(command);
      const updatedDocument = result.Attributes as ParticipantResponsesDocument;
      return updatedDocument.responses[responseIndex];
    } catch (error: any) {
      console.error('[ModuleResponseService.updateModuleResponse] Error:', error);
      throw new ApiError(`Database Error: Could not update module response - ${error.message}`, 500);
    }
  }

  /**
   * Obtiene todas las respuestas para un research y un participante
   */
  async getResponsesForParticipant(
    researchId: string, 
    participantId: string
  ): Promise<ParticipantResponsesDocument | null> {
    return this.findByResearchAndParticipant(researchId, participantId);
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
  }
}

// Exportar una instancia del servicio para ser usada en toda la aplicación
export const moduleResponseService = new ModuleResponseService(); 
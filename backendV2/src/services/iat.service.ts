import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  IATTestConfigModel,
  IATSessionModel,
  IATResultsModel,
  IATStatisticalAnalysisModel,
  IATEmotionalIntegrationModel,
  IAT_TABLE_NAMES,
  IAT_SESSION_STATUS,
  validateIATTestConfig,
  validateIATSession,
  validateIATResults,
  validateIATStatisticalAnalysis,
  validateIATEmotionalIntegration
} from '../models/iat.model';
import { ApiError } from '../utils/errors';

/**
 * @fileoverview Servicio IAT para operaciones de base de datos
 * @description Maneja todas las operaciones CRUD para Implicit Association Test
 * @version 1.0.0
 * @author EmotioXV2 Team
 */

export class IATService {
  private readonly dynamoClient: DynamoDBDocumentClient;

  constructor() {
    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({
      region
    });
    const marshallOptions = { removeUndefinedValues: true };
    const unmarshallOptions = { wrapNumbers: false };
    const translateConfig = { marshallOptions, unmarshallOptions };
    this.dynamoClient = DynamoDBDocumentClient.from(client, translateConfig);
    console.log(`[IATService] Initialized in region: ${region}`);
  }

  // ======================================================================
  // 🎯 CONFIGURACIONES DE PRUEBA IAT
  // ======================================================================

  /**
   * Crea una nueva configuración de prueba IAT
   */
  async createTestConfig(configData: Omit<IATTestConfigModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<IATTestConfigModel> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newConfig: IATTestConfigModel = {
      id,
      ...configData,
      createdAt: now,
      updatedAt: now
    };

    // Validar datos antes de guardar
    const validatedConfig = validateIATTestConfig(newConfig);

    const command = new PutCommand({
      TableName: IAT_TABLE_NAMES.TEST_CONFIG,
      Item: validatedConfig,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[IATService.createTestConfig] Created config: ${id}`);
      return validatedConfig;
    } catch (error: unknown) {
      console.error('[IATService.createTestConfig] Error:', error);
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new ApiError('Conflict: Test configuration ID already exists.', 409);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not create test configuration - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene una configuración de prueba por ID
   */
  async getTestConfigById(id: string): Promise<IATTestConfigModel | null> {
    const command = new GetCommand({
      TableName: IAT_TABLE_NAMES.TEST_CONFIG,
      Key: { id }
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Item) return null;
      
      const validatedConfig = validateIATTestConfig(result.Item);
      return validatedConfig;
    } catch (error: unknown) {
      console.error('[IATService.getTestConfigById] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve test configuration - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene configuraciones por creador
   */
  async getTestConfigsByCreator(createdBy: string): Promise<IATTestConfigModel[]> {
    const command = new QueryCommand({
      TableName: IAT_TABLE_NAMES.TEST_CONFIG,
      IndexName: 'CreatedByIndex',
      KeyConditionExpression: 'createdBy = :createdBy',
      ExpressionAttributeValues: {
        ':createdBy': createdBy
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      const configs = (result.Items || []).map(item => validateIATTestConfig(item));
      return configs;
    } catch (error: unknown) {
      console.error('[IATService.getTestConfigsByCreator] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve test configurations - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene configuraciones por estado
   */
  async getTestConfigsByStatus(status: string): Promise<IATTestConfigModel[]> {
    const command = new QueryCommand({
      TableName: IAT_TABLE_NAMES.TEST_CONFIG,
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      const configs = (result.Items || []).map(item => validateIATTestConfig(item));
      return configs;
    } catch (error: unknown) {
      console.error('[IATService.getTestConfigsByStatus] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve test configurations by status - ${errorMessage}`, 500);
    }
  }

  /**
   * Actualiza una configuración de prueba
   */
  async updateTestConfig(id: string, updates: Partial<IATTestConfigModel>): Promise<IATTestConfigModel> {
    const now = new Date().toISOString();
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, unknown> = {
      ':updatedAt': now
    };
    const expressionAttributeNames: Record<string, string> = {};

    // Construir expresión de actualización dinámicamente
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
        updateExpression += `, ${attributeName} = ${attributeValue}`;
      }
    });

    const command = new UpdateCommand({
      TableName: IAT_TABLE_NAMES.TEST_CONFIG,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.dynamoClient.send(command);
      const updatedConfig = validateIATTestConfig(result.Attributes);
      console.log(`[IATService.updateTestConfig] Updated config: ${id}`);
      return updatedConfig;
    } catch (error: unknown) {
      console.error('[IATService.updateTestConfig] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not update test configuration - ${errorMessage}`, 500);
    }
  }

  // ======================================================================
  // 🎯 SESIONES IAT
  // ======================================================================

  /**
   * Crea una nueva sesión IAT
   */
  async createSession(sessionData: Omit<IATSessionModel, 'sessionId' | 'createdAt' | 'updatedAt'>): Promise<IATSessionModel> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    const newSession: IATSessionModel = {
      sessionId,
      ...sessionData,
      createdAt: now,
      updatedAt: now
    };

    // Validar datos antes de guardar
    const validatedSession = validateIATSession(newSession);

    const command = new PutCommand({
      TableName: IAT_TABLE_NAMES.SESSION,
      Item: validatedSession,
      ConditionExpression: 'attribute_not_exists(sessionId)'
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[IATService.createSession] Created session: ${sessionId}`);
      return validatedSession;
    } catch (error: unknown) {
      console.error('[IATService.createSession] Error:', error);
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new ApiError('Conflict: Session ID already exists.', 409);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not create session - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene una sesión por ID
   */
  async getSessionById(sessionId: string): Promise<IATSessionModel | null> {
    const command = new GetCommand({
      TableName: IAT_TABLE_NAMES.SESSION,
      Key: { sessionId }
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Item) return null;
      
      const validatedSession = validateIATSession(result.Item);
      return validatedSession;
    } catch (error: unknown) {
      console.error('[IATService.getSessionById] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve session - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene sesiones por participante
   */
  async getSessionsByParticipant(participantId: string): Promise<IATSessionModel[]> {
    const command = new QueryCommand({
      TableName: IAT_TABLE_NAMES.SESSION,
      IndexName: 'ParticipantIndex',
      KeyConditionExpression: 'participantId = :participantId',
      ExpressionAttributeValues: {
        ':participantId': participantId
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      const sessions = (result.Items || []).map(item => validateIATSession(item));
      return sessions;
    } catch (error: unknown) {
      console.error('[IATService.getSessionsByParticipant] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve sessions by participant - ${errorMessage}`, 500);
    }
  }

  /**
   * Actualiza el estado de una sesión
   */
  async updateSessionStatus(sessionId: string, status: string, progress?: number): Promise<IATSessionModel> {
    const now = new Date().toISOString();
    let updateExpression = 'SET #status = :status, lastActivity = :lastActivity, updatedAt = :updatedAt';
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status'
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ':status': status,
      ':lastActivity': now,
      ':updatedAt': now
    };

    if (progress !== undefined) {
      updateExpression += ', progress = :progress';
      expressionAttributeValues[':progress'] = progress;
    }

    const command = new UpdateCommand({
      TableName: IAT_TABLE_NAMES.SESSION,
      Key: { sessionId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.dynamoClient.send(command);
      const updatedSession = validateIATSession(result.Attributes);
      console.log(`[IATService.updateSessionStatus] Updated session: ${sessionId} to status: ${status}`);
      return updatedSession;
    } catch (error: unknown) {
      console.error('[IATService.updateSessionStatus] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not update session status - ${errorMessage}`, 500);
    }
  }

  /**
   * Agrega una respuesta a una sesión
   */
  async addResponseToSession(sessionId: string, response: IATSessionModel['responses'][0]): Promise<IATSessionModel> {
    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: IAT_TABLE_NAMES.SESSION,
      Key: { sessionId },
      UpdateExpression: 'SET responses = list_append(if_not_exists(responses, :emptyList), :response), lastActivity = :lastActivity, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':response': [response],
        ':emptyList': [],
        ':lastActivity': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await this.dynamoClient.send(command);
      const updatedSession = validateIATSession(result.Attributes);
      console.log(`[IATService.addResponseToSession] Added response to session: ${sessionId}`);
      return updatedSession;
    } catch (error: unknown) {
      console.error('[IATService.addResponseToSession] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not add response to session - ${errorMessage}`, 500);
    }
  }

  // ======================================================================
  // 🎯 RESULTADOS IAT
  // ======================================================================

  /**
   * Guarda resultados completos de IAT
   */
  async saveResults(resultsData: Omit<IATResultsModel, 'resultId' | 'createdAt' | 'updatedAt'>): Promise<IATResultsModel> {
    const resultId = uuidv4();
    const now = new Date().toISOString();
    const newResults: IATResultsModel = {
      resultId,
      ...resultsData,
      createdAt: now,
      updatedAt: now
    };

    // Validar datos antes de guardar
    const validatedResults = validateIATResults(newResults);

    const command = new PutCommand({
      TableName: IAT_TABLE_NAMES.RESULTS,
      Item: validatedResults,
      ConditionExpression: 'attribute_not_exists(resultId)'
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[IATService.saveResults] Saved results: ${resultId}`);
      return validatedResults;
    } catch (error: unknown) {
      console.error('[IATService.saveResults] Error:', error);
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new ApiError('Conflict: Results ID already exists.', 409);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not save results - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene resultados por ID
   */
  async getResultsById(resultId: string): Promise<IATResultsModel | null> {
    const command = new GetCommand({
      TableName: IAT_TABLE_NAMES.RESULTS,
      Key: { resultId }
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Item) return null;
      
      const validatedResults = validateIATResults(result.Item);
      return validatedResults;
    } catch (error: unknown) {
      console.error('[IATService.getResultsById] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve results - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene resultados por participante
   */
  async getResultsByParticipant(participantId: string): Promise<IATResultsModel[]> {
    const command = new QueryCommand({
      TableName: IAT_TABLE_NAMES.RESULTS,
      IndexName: 'ParticipantIndex',
      KeyConditionExpression: 'participantId = :participantId',
      ExpressionAttributeValues: {
        ':participantId': participantId
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      const results = (result.Items || []).map(item => validateIATResults(item));
      return results;
    } catch (error: unknown) {
      console.error('[IATService.getResultsByParticipant] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve results by participant - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene resultados por prueba
   */
  async getResultsByTest(testId: string): Promise<IATResultsModel[]> {
    const command = new QueryCommand({
      TableName: IAT_TABLE_NAMES.RESULTS,
      IndexName: 'TestIndex',
      KeyConditionExpression: 'testId = :testId',
      ExpressionAttributeValues: {
        ':testId': testId
      }
    });

    try {
      const result = await this.dynamoClient.send(command);
      const results = (result.Items || []).map(item => validateIATResults(item));
      return results;
    } catch (error: unknown) {
      console.error('[IATService.getResultsByTest] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve results by test - ${errorMessage}`, 500);
    }
  }

  // ======================================================================
  // 🎯 ANÁLISIS ESTADÍSTICO
  // ======================================================================

  /**
   * Guarda análisis estadístico
   */
  async saveStatisticalAnalysis(analysisData: Omit<IATStatisticalAnalysisModel, 'analysisId' | 'createdAt' | 'updatedAt'>): Promise<IATStatisticalAnalysisModel> {
    const analysisId = uuidv4();
    const now = new Date().toISOString();
    const newAnalysis: IATStatisticalAnalysisModel = {
      analysisId,
      ...analysisData,
      createdAt: now,
      updatedAt: now
    };

    // Validar datos antes de guardar
    const validatedAnalysis = validateIATStatisticalAnalysis(newAnalysis);

    const command = new PutCommand({
      TableName: IAT_TABLE_NAMES.ANALYSIS,
      Item: validatedAnalysis,
      ConditionExpression: 'attribute_not_exists(analysisId)'
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[IATService.saveStatisticalAnalysis] Saved analysis: ${analysisId}`);
      return validatedAnalysis;
    } catch (error: unknown) {
      console.error('[IATService.saveStatisticalAnalysis] Error:', error);
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new ApiError('Conflict: Analysis ID already exists.', 409);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not save statistical analysis - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene análisis por ID de resultado
   */
  async getAnalysisByResultId(resultId: string): Promise<IATStatisticalAnalysisModel | null> {
    const command = new QueryCommand({
      TableName: IAT_TABLE_NAMES.ANALYSIS,
      IndexName: 'ResultIndex',
      KeyConditionExpression: 'resultId = :resultId',
      ExpressionAttributeValues: {
        ':resultId': resultId
      },
      Limit: 1
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Items || result.Items.length === 0) return null;
      
      const validatedAnalysis = validateIATStatisticalAnalysis(result.Items[0]);
      return validatedAnalysis;
    } catch (error: unknown) {
      console.error('[IATService.getAnalysisByResultId] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve statistical analysis - ${errorMessage}`, 500);
    }
  }

  // ======================================================================
  // 🎯 INTEGRACIÓN EMOCIONAL
  // ======================================================================

  /**
   * Guarda integración emocional
   */
  async saveEmotionalIntegration(integrationData: Omit<IATEmotionalIntegrationModel, 'integrationId' | 'createdAt' | 'updatedAt'>): Promise<IATEmotionalIntegrationModel> {
    const integrationId = uuidv4();
    const now = new Date().toISOString();
    const newIntegration: IATEmotionalIntegrationModel = {
      integrationId,
      ...integrationData,
      createdAt: now,
      updatedAt: now
    };

    // Validar datos antes de guardar
    const validatedIntegration = validateIATEmotionalIntegration(newIntegration);

    const command = new PutCommand({
      TableName: IAT_TABLE_NAMES.INTEGRATION,
      Item: validatedIntegration,
      ConditionExpression: 'attribute_not_exists(integrationId)'
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`[IATService.saveEmotionalIntegration] Saved integration: ${integrationId}`);
      return validatedIntegration;
    } catch (error: unknown) {
      console.error('[IATService.saveEmotionalIntegration] Error:', error);
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new ApiError('Conflict: Integration ID already exists.', 409);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not save emotional integration - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene integración emocional por ID de resultado
   */
  async getEmotionalIntegrationByResultId(resultId: string): Promise<IATEmotionalIntegrationModel | null> {
    const command = new QueryCommand({
      TableName: IAT_TABLE_NAMES.INTEGRATION,
      IndexName: 'ResultIndex',
      KeyConditionExpression: 'resultId = :resultId',
      ExpressionAttributeValues: {
        ':resultId': resultId
      },
      Limit: 1
    });

    try {
      const result = await this.dynamoClient.send(command);
      if (!result.Items || result.Items.length === 0) return null;
      
      const validatedIntegration = validateIATEmotionalIntegration(result.Items[0]);
      return validatedIntegration;
    } catch (error: unknown) {
      console.error('[IATService.getEmotionalIntegrationByResultId] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve emotional integration - ${errorMessage}`, 500);
    }
  }

  // ======================================================================
  // 🎯 UTILIDADES Y MÉTODOS DE APOYO
  // ======================================================================

  /**
   * Elimina una sesión y todos sus datos relacionados
   */
  async deleteSessionAndRelatedData(sessionId: string): Promise<void> {
    try {
      console.log(`[IATService.deleteSessionAndRelatedData] Starting deletion for session: ${sessionId}`);

      // Obtener la sesión primero
      const session = await this.getSessionById(sessionId);
      if (!session) {
        console.log(`[IATService.deleteSessionAndRelatedData] Session not found: ${sessionId}`);
        return;
      }

      // Eliminar resultados relacionados
      const results = await this.getResultsByParticipant(session.participantId);
      for (const result of results) {
        // Eliminar análisis estadístico
        const analysis = await this.getAnalysisByResultId(result.resultId);
        if (analysis) {
          await this.dynamoClient.send(new DeleteCommand({
            TableName: IAT_TABLE_NAMES.ANALYSIS,
            Key: { analysisId: analysis.analysisId }
          }));
        }

        // Eliminar integración emocional
        const integration = await this.getEmotionalIntegrationByResultId(result.resultId);
        if (integration) {
          await this.dynamoClient.send(new DeleteCommand({
            TableName: IAT_TABLE_NAMES.INTEGRATION,
            Key: { integrationId: integration.integrationId }
          }));
        }

        // Eliminar resultados
        await this.dynamoClient.send(new DeleteCommand({
          TableName: IAT_TABLE_NAMES.RESULTS,
          Key: { resultId: result.resultId }
        }));
      }

      // Eliminar la sesión
      await this.dynamoClient.send(new DeleteCommand({
        TableName: IAT_TABLE_NAMES.SESSION,
        Key: { sessionId }
      }));

      console.log(`[IATService.deleteSessionAndRelatedData] Successfully deleted session and related data: ${sessionId}`);
    } catch (error: unknown) {
      console.error(`[IATService.deleteSessionAndRelatedData] Error deleting session data:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not delete session and related data - ${errorMessage}`, 500);
    }
  }

  /**
   * Obtiene estadísticas generales de IAT
   */
  async getIATStatistics(): Promise<{
    totalTests: number;
    totalSessions: number;
    totalResults: number;
    activeSessions: number;
    completedSessions: number;
  }> {
    try {
      // Obtener conteos de cada tabla
      const [testConfigs, sessions, results] = await Promise.all([
        this.dynamoClient.send(new ScanCommand({ TableName: IAT_TABLE_NAMES.TEST_CONFIG, Select: 'COUNT' })),
        this.dynamoClient.send(new ScanCommand({ TableName: IAT_TABLE_NAMES.SESSION, Select: 'COUNT' })),
        this.dynamoClient.send(new ScanCommand({ TableName: IAT_TABLE_NAMES.RESULTS, Select: 'COUNT' }))
      ]);

      // Obtener sesiones activas y completadas
      const activeSessionsResult = await this.dynamoClient.send(new QueryCommand({
        TableName: IAT_TABLE_NAMES.SESSION,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': IAT_SESSION_STATUS.COMPLETED },
        Select: 'COUNT'
      }));

      const completedSessionsResult = await this.dynamoClient.send(new QueryCommand({
        TableName: IAT_TABLE_NAMES.SESSION,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': IAT_SESSION_STATUS.COMPLETED },
        Select: 'COUNT'
      }));

      return {
        totalTests: testConfigs.Count || 0,
        totalSessions: sessions.Count || 0,
        totalResults: results.Count || 0,
        activeSessions: activeSessionsResult.Count || 0,
        completedSessions: completedSessionsResult.Count || 0
      };
    } catch (error: unknown) {
      console.error('[IATService.getIATStatistics] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Database Error: Could not retrieve IAT statistics - ${errorMessage}`, 500);
    }
  }
}

export const iatService = new IATService();

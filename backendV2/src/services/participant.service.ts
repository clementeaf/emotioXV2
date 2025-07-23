import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../models/participant.model';
import { ApiError } from '../utils/errors';

const EMAIL_INDEX_NAME = 'EmailIndex';

export class ParticipantService {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;

  constructor() {
    this.tableName = process.env.PARTICIPANT_TABLE!;
    if (!this.tableName) {
      throw new Error('FATAL ERROR: PARTICIPANT_TABLE environment variable is not set.');
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
    console.log(`[ParticipantService] Initialized for table: ${this.tableName} in region: ${region}`);
  }

  /**
   * Crea un nuevo participante
   */
  async create(participantData: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Participant> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newParticipant: Participant = {
      id,
      ...participantData,
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: newParticipant,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    try {
      await this.dynamoClient.send(command);
      return newParticipant;
    } catch (error: any) {
      console.error('[ParticipantService.create] Error:', error);
      if (error.name === 'ConditionalCheckFailedException') {
        throw new ApiError('Conflict: Participant ID collision or already exists.', 409);
      }
      throw new ApiError(`Database Error: Could not create participant - ${error.message}`, 500);
    }
  }

  /**
   * Obtiene un participante por su ID
   */
  async findById(id: string): Promise<Participant | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id }
    });

    try {
      const result = await this.dynamoClient.send(command);
      return result.Item as Participant || null;
    } catch (error: any) {
      console.error('[ParticipantService.findById] Error:', error);
      throw new ApiError(`Database Error: Could not retrieve participant by ID - ${error.message}`, 500);
    }
  }

  /**
   * Obtiene un participante por su email usando GSI
   */
  async findByEmail(email: string): Promise<Participant | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: EMAIL_INDEX_NAME,
      KeyConditionExpression: 'email = :emailVal',
      ExpressionAttributeValues: {
        ':emailVal': email
      },
      Limit: 1
    });

    try {
      const result = await this.dynamoClient.send(command);
      return result.Items?.[0] as Participant || null;
    } catch (error: any) {
      console.error('[ParticipantService.findByEmail] Error:', error);
      if ((error as Error).message?.includes('index')) {
        console.error(`Error: GSI '${EMAIL_INDEX_NAME}' not found or not configured correctly for table ${this.tableName}.`);
        throw new ApiError(`Configuration Error: Missing index for email lookup.`, 500);
      }
      throw new ApiError(`Database Error: Could not retrieve participant by email - ${error.message}`, 500);
    }
  }

  /**
   * Obtiene todos los participantes (Usar con precaución)
   */
  async findAll(): Promise<Participant[]> {
    console.warn('[ParticipantService.findAll] Executing Scan operation. Avoid in production for large tables.');
    const command = new ScanCommand({
      TableName: this.tableName
    });

    try {
      const result = await this.dynamoClient.send(command);
      return (result.Items as Participant[]) || [];
    } catch (error: any) {
      console.error('[ParticipantService.findAll] Error:', error);
      throw new ApiError(`Database Error: Could not retrieve all participants - ${error.message}`, 500);
    }
  }

  /**
   * Elimina un participante por su ID
   */
  async delete(id: string): Promise<Participant | null> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
      ReturnValues: 'ALL_OLD'
    });
    try {
      const result = await this.dynamoClient.send(command);
      return result.Attributes as Participant || null;
    } catch (error: any) {
      console.error('[ParticipantService.delete] Error:', error);
      throw new ApiError(`Database Error: Could not delete participant - ${error.message}`, 500);
    }
  }

  /**
   * Elimina todos los datos de un participante
   */
  async deleteParticipantData(researchId: string, participantId: string): Promise<void> {

    try {
      console.log(`[ParticipantService.deleteParticipantData] Iniciando eliminación para researchId=${researchId}, participantId=${participantId}`);

      // 🎯 ELIMINAR REGISTROS DE MODULE-RESPONSES
      try {
        const moduleResponsesQuery = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'ResearchIdIndex',
          KeyConditionExpression: 'researchId = :researchId',
          FilterExpression: 'participantId = :participantId',
          ExpressionAttributeValues: {
            ':researchId': researchId,
            ':participantId': participantId
          }
        });

        const moduleResponses = await this.dynamoClient.send(moduleResponsesQuery);

        if (moduleResponses.Items && moduleResponses.Items.length > 0) {
          // 🎯 ELIMINAR CADA REGISTRO
          const deletePromises = moduleResponses.Items.map(item => {
            const deleteCommand = new DeleteCommand({
              TableName: this.tableName,
              Key: {
                id: item.id,
                sk: item.sk
              }
            });
            return this.dynamoClient.send(deleteCommand);
          });

          await Promise.all(deletePromises);
          console.log(`[ParticipantService.deleteParticipantData] Registros de module-responses eliminados`, {
            count: moduleResponses.Items.length
          });
        } else {
          console.log(`[ParticipantService.deleteParticipantData] No se encontraron registros de module-responses para eliminar`);
        }
      } catch (error) {
        console.warn(`[ParticipantService.deleteParticipantData] Error eliminando module-responses:`, error);
        // Continuar con el proceso aunque falle esta parte
      }

      // 🎯 ELIMINAR REGISTROS DE PARTICIPANTS
      try {
        const participantsQuery = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'ResearchIdIndex',
          KeyConditionExpression: 'researchId = :researchId',
          FilterExpression: 'participantId = :participantId',
          ExpressionAttributeValues: {
            ':researchId': researchId,
            ':participantId': participantId
          }
        });

        const participants = await this.dynamoClient.send(participantsQuery);

        if (participants.Items && participants.Items.length > 0) {
          // 🎯 ELIMINAR CADA REGISTRO
          const deletePromises = participants.Items.map(item => {
            const deleteCommand = new DeleteCommand({
              TableName: this.tableName,
              Key: {
                id: item.id,
                sk: item.sk
              }
            });
            return this.dynamoClient.send(deleteCommand);
          });

          await Promise.all(deletePromises);
          console.log(`[ParticipantService.deleteParticipantData] Registros de participants eliminados`, {
            count: participants.Items.length
          });
        } else {
          console.log(`[ParticipantService.deleteParticipantData] No se encontraron registros de participants para eliminar`);
        }
      } catch (error) {
        console.warn(`[ParticipantService.deleteParticipantData] Error eliminando participants:`, error);
        // Continuar con el proceso aunque falle esta parte
      }

      // 🎯 ELIMINAR REGISTROS DE LOCATION-TRACKING
      try {
        const locationQuery = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'ResearchIdIndex',
          KeyConditionExpression: 'researchId = :researchId',
          FilterExpression: 'participantId = :participantId',
          ExpressionAttributeValues: {
            ':researchId': researchId,
            ':participantId': participantId
          }
        });

        const locations = await this.dynamoClient.send(locationQuery);

        if (locations.Items && locations.Items.length > 0) {
          // 🎯 ELIMINAR CADA REGISTRO
          const deletePromises = locations.Items.map(item => {
            const deleteCommand = new DeleteCommand({
              TableName: this.tableName,
              Key: {
                id: item.id,
                sk: item.sk
              }
            });
            return this.dynamoClient.send(deleteCommand);
          });

          await Promise.all(deletePromises);
          console.log(`[ParticipantService.deleteParticipantData] Registros de location-tracking eliminados`, {
            count: locations.Items.length
          });
        } else {
          console.log(`[ParticipantService.deleteParticipantData] No se encontraron registros de location-tracking para eliminar`);
        }
      } catch (error) {
        console.warn(`[ParticipantService.deleteParticipantData] Error eliminando location-tracking:`, error);
        // Continuar con el proceso aunque falle esta parte
      }

      console.log(`[ParticipantService.deleteParticipantData] Proceso de eliminación completado`, {
        researchId,
        participantId
      });

    } catch (error) {
      console.error(`[ParticipantService.deleteParticipantData] Error general eliminando datos de participante`, { error });
      throw error;
    }
  }

  /**
   * Elimina todos los datos de un participante (método alternativo más simple)
   */
  async deleteParticipantDataSimple(researchId: string, participantId: string): Promise<void> {
    try {
      console.log(`[ParticipantService.deleteParticipantDataSimple] Iniciando eliminación simple para researchId=${researchId}, participantId=${participantId}`);

      // 🎯 ESCANEAR TODA LA TABLA PARA ENCONTRAR REGISTROS RELACIONADOS
      const scanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'researchId = :researchId AND participantId = :participantId',
        ExpressionAttributeValues: {
          ':researchId': researchId,
          ':participantId': participantId
        }
      });

      const scanResult = await this.dynamoClient.send(scanCommand);

      if (scanResult.Items && scanResult.Items.length > 0) {
        console.log(`[ParticipantService.deleteParticipantDataSimple] Encontrados ${scanResult.Items.length} registros para eliminar`);

        // 🎯 ELIMINAR CADA REGISTRO ENCONTRADO
        const deletePromises = scanResult.Items.map(item => {
          const deleteCommand = new DeleteCommand({
            TableName: this.tableName,
            Key: {
              id: item.id,
              sk: item.sk || item.id // Usar id como fallback si sk no existe
            }
          });
          return this.dynamoClient.send(deleteCommand);
        });

        await Promise.all(deletePromises);
        console.log(`[ParticipantService.deleteParticipantDataSimple] Registros eliminados exitosamente`, {
          count: scanResult.Items.length
        });
      } else {
        console.log(`[ParticipantService.deleteParticipantDataSimple] No se encontraron registros para eliminar`);
      }

      console.log(`[ParticipantService.deleteParticipantDataSimple] Proceso de eliminación completado`, {
        researchId,
        participantId
      });

    } catch (error) {
      console.error(`[ParticipantService.deleteParticipantDataSimple] Error eliminando datos de participante`, { error });
      throw error;
    }
  }
}

export const participantService = new ParticipantService();

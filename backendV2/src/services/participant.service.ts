import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../models/participant.model';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.APP_REGION || 'us-east-1',
  ...(process.env.IS_OFFLINE === 'true' && {
    endpoint: 'http://localhost:8000'
  })
});

const TABLE_NAME = process.env.PARTICIPANT_TABLE || '';

export class ParticipantService {
  /**
   * Crea un nuevo participante
   */
  async create(participant: Omit<Participant, 'id'>): Promise<Participant> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const newParticipant: Participant = {
      id,
      ...participant,
      createdAt: now,
      updatedAt: now
    };

    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: newParticipant
    }).promise();

    return newParticipant;
  }

  /**
   * Obtiene un participante por su ID
   */
  async findById(id: string): Promise<Participant | null> {
    const result = await dynamoDb.get({
      TableName: TABLE_NAME,
      Key: { id }
    }).promise();

    return result.Item as Participant || null;
  }

  /**
   * Obtiene un participante por su email
   */
  async findByEmail(email: string): Promise<Participant | null> {
    const result = await dynamoDb.query({
      TableName: TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }).promise();

    return result.Items?.[0] as Participant || null;
  }

  /**
   * Obtiene todos los participantes
   */
  async findAll(): Promise<Participant[]> {
    const result = await dynamoDb.scan({
      TableName: TABLE_NAME
    }).promise();

    return result.Items as Participant[] || [];
  }

  /**
   * Elimina un participante por su ID
   */
  async delete(id: string): Promise<Participant> {
    const result = await dynamoDb.delete({
      TableName: TABLE_NAME,
      Key: { id },
      ReturnValues: 'ALL_OLD'
    }).promise();

    return result.Attributes as Participant;
  }
}

// Exportamos una instancia única del servicio
export const participantService = new ParticipantService(); 
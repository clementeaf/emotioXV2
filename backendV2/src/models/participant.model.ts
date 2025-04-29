import { z } from 'zod';

/**
 * Esquema de validación para participante en DynamoDB
 */
export const ParticipantSchema = z.object({
  // Clave primaria (partition key)
  id: z.string().uuid(),
  
  // Información básica del participante
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  
  // Metadatos
  createdAt: z.string(), // ISO date string
  updatedAt: z.string()  // ISO date string
});

/**
 * Interfaz para el modelo de participante
 */
export interface Participant {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Define la estructura de la tabla DynamoDB para participantes
 */
export const ParticipantTableDefinition = {
  TableName: process.env.PARTICIPANT_TABLE || 'Participants',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'EmailIndex',
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      /*
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
      */
    }
  ],
  /*
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
  */
}; 
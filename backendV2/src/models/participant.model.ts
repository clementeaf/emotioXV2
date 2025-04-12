import { z } from 'zod';
import { Participant } from '../../../shared/interfaces/participant';

/**
 * Esquema de validación para participante en DynamoDB
 */
export const ParticipantSchema = z.object({
  // Clave primaria (partition key)
  id: z.string().uuid(),
  
  // Información básica del participante (de la interfaz compartida)
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  
  // Metadatos
  createdAt: z.number(), // Timestamp Unix en milisegundos
  updatedAt: z.number()  // Timestamp Unix en milisegundos
});

/**
 * Tipo para el modelo de participante en DynamoDB
 * Extiende la interfaz base añadiendo campos específicos de la base de datos
 */
export type ParticipantModel = Participant & {
  id: string;
  createdAt: number;
  updatedAt: number;
};

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
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
}; 
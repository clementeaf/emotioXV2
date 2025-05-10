import { z } from 'zod';

/**
 * Esquema de validación para el valor de respuesta
 */
export const ModuleResponseValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.boolean(),
  z.record(z.any()),
  z.null()
]);

/**
 * Esquema de validación para una respuesta individual de módulo
 */
export const ModuleResponseSchema = z.object({
  id: z.string().uuid(),
  stepType: z.string(),
  stepTitle: z.string(),
  response: ModuleResponseValueSchema,
  createdAt: z.string(), // ISO date string
  updatedAt: z.string().optional() // ISO date string (opcional)
});

/**
 * Esquema de validación para el documento completo de respuestas
 */
export const ParticipantResponsesDocumentSchema = z.object({
  id: z.string().uuid(), // ID único del documento
  researchId: z.string(), // ID del research
  participantId: z.string(), // ID del participante
  responses: z.array(ModuleResponseSchema), // Array de respuestas
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  isCompleted: z.boolean().default(false) // Indica si todas las respuestas están completas
});

/**
 * Esquema para crear una nueva respuesta
 */
export const CreateModuleResponseDtoSchema = z.object({
  researchId: z.string(),
  participantId: z.string(),
  stepType: z.string(),
  stepTitle: z.string(),
  response: ModuleResponseValueSchema
});

/**
 * Esquema para actualizar una respuesta existente
 */
export const UpdateModuleResponseDtoSchema = z.object({
  response: ModuleResponseValueSchema
});

/**
 * Interfaces derivadas de los esquemas
 */
export type ModuleResponseValue = z.infer<typeof ModuleResponseValueSchema>;
export type ModuleResponse = z.infer<typeof ModuleResponseSchema>;
export type ParticipantResponsesDocument = z.infer<typeof ParticipantResponsesDocumentSchema>;
export type CreateModuleResponseDto = z.infer<typeof CreateModuleResponseDtoSchema>;
export type UpdateModuleResponseDto = z.infer<typeof UpdateModuleResponseDtoSchema>;

/**
 * Define la estructura de la tabla DynamoDB para respuestas de módulos
 */
export const ModuleResponsesTableDefinition = {
  TableName: process.env.MODULE_RESPONSES_TABLE || 'ModuleResponses',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'researchId', AttributeType: 'S' },
    { AttributeName: 'participantId', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ResearchIndex',
      KeySchema: [
        { AttributeName: 'researchId', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'ParticipantIndex',
      KeySchema: [
        { AttributeName: 'participantId', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'ResearchParticipantIndex',
      KeySchema: [
        { AttributeName: 'researchId', KeyType: 'HASH' },
        { AttributeName: 'participantId', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ]
}; 
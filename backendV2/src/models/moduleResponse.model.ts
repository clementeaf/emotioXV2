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
 * Esquema de validación para metadata de la respuesta
 */
export const ResponseMetadataSchema = z.object({
  deviceInfo: z.object({
    deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
    userAgent: z.string().optional(),
    screenWidth: z.number().optional(),
    screenHeight: z.number().optional(),
    platform: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
  locationInfo: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    ipAddress: z.string().optional(),
  }).optional(),
  timingInfo: z.object({
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    duration: z.number().optional(),
    sectionTimings: z.array(z.object({
      sectionId: z.string(),
      startTime: z.number(),
      endTime: z.number().optional(),
      duration: z.number().optional(),
    })).optional(),
  }).optional(),
  sessionInfo: z.object({
    reentryCount: z.number().optional(),
    sessionStartTime: z.number().optional(),
    lastVisitTime: z.number().optional(),
    totalSessionTime: z.number().optional(),
    isFirstVisit: z.boolean().optional(),
  }).optional(),
  technicalInfo: z.object({
    browser: z.string().optional(),
    browserVersion: z.string().optional(),
    os: z.string().optional(),
    osVersion: z.string().optional(),
    connectionType: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
}).optional();

/**
 * Esquema de validación para una respuesta individual
 */
export const IndividualResponseSchema = z.object({
  questionKey: z.string(),
  response: ModuleResponseValueSchema,
  timestamp: z.string(), // ISO date string
  createdAt: z.string(), // ISO date string - cuando se creó
  updatedAt: z.string().optional(), // ISO date string - última actualización
  metadata: ResponseMetadataSchema.optional()
});

/**
 * Esquema de validación para el documento completo de respuestas
 */
export const ParticipantResponsesDocumentSchema = z.object({
  id: z.string().uuid(), // ID único del documento
  researchId: z.string(), // ID del research
  participantId: z.string(), // ID del participante
  responses: z.array(IndividualResponseSchema), // Array de respuestas individuales
  metadata: ResponseMetadataSchema, // Metadata global del documento
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  isCompleted: z.boolean().default(false), // Indica si todas las respuestas están completas
  quotaResult: z.object({
    status: z.enum(['QUALIFIED', 'DISQUALIFIED_OVERQUOTA']),
    order: z.number(),
    quotaLimit: z.number()
  }).optional() // 🎯 RESULTADO DE VERIFICACIÓN DE CUOTA
});

/**
 * Esquema para crear una nueva respuesta (CORREGIDO)
 */
export const CreateModuleResponseDtoSchema = z.object({
  researchId: z.string(),
  participantId: z.string(),
  questionKey: z.string(),
  responses: z.array(IndividualResponseSchema),
  metadata: ResponseMetadataSchema.optional() // Make metadata optional for easier testing
});

/**
 * Esquema para actualizar una respuesta existente (CORREGIDO)
 */
export const UpdateModuleResponseDtoSchema = z.object({
  researchId: z.string(),
  participantId: z.string(),
  questionKey: z.string(),
  responses: z.array(IndividualResponseSchema),
  metadata: ResponseMetadataSchema
});

// Tipos inferidos de los esquemas
export type ModuleResponse = z.infer<typeof IndividualResponseSchema>;
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

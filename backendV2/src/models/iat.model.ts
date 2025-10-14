import { z } from 'zod';

/**
 * @fileoverview Modelo IAT para DynamoDB
 * @description Esquemas de validación y definiciones de tabla para Implicit Association Test
 * @version 1.0.0
 * @author EmotioXV2 Team
 */

// ======================================================================
// 🎯 ESQUEMAS DE VALIDACIÓN ZOD
// ======================================================================

/**
 * Esquema de validación para configuración de prueba IAT
 */
export const IATTestConfigSchema = z.object({
  // Clave primaria
  id: z.string().uuid(),
  
  // Información básica
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Versión debe seguir formato semántico'),
  
  // Categorías y atributos
  categories: z.object({
    left: z.object({
      label: z.string().min(1, 'Etiqueta izquierda requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    }),
    right: z.object({
      label: z.string().min(1, 'Etiqueta derecha requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    })
  }),
  
  attributes: z.object({
    left: z.object({
      label: z.string().min(1, 'Etiqueta izquierda requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    }),
    right: z.object({
      label: z.string().min(1, 'Etiqueta derecha requerida'),
      items: z.array(z.string()).min(1, 'Al menos un elemento requerido')
    })
  }),
  
  // Configuración
  settings: z.object({
    maxResponseTime: z.number().min(1000, 'Tiempo máximo debe ser al menos 1000ms'),
    minResponseTime: z.number().min(100, 'Tiempo mínimo debe ser al menos 100ms'),
    errorPenalty: z.number().min(0, 'Penalización no puede ser negativa'),
    feedbackEnabled: z.boolean(),
    instructions: z.object({
      welcome: z.string().min(1, 'Instrucción de bienvenida requerida'),
      practice: z.string().min(1, 'Instrucción de práctica requerida'),
      test: z.string().min(1, 'Instrucción de prueba requerida'),
      completion: z.string().min(1, 'Instrucción de finalización requerida'),
      error: z.string().min(1, 'Instrucción de error requerida')
    }),
    timing: z.object({
      stimulusDuration: z.number().min(0),
      interTrialInterval: z.number().min(0),
      feedbackDuration: z.number().min(0),
      blockBreakDuration: z.number().min(0)
    })
  }),
  
  // Metadatos
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().min(1, 'Creador requerido'),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
  metadata: z.object({
    author: z.string().min(1, 'Autor requerido'),
    language: z.string().min(2, 'Idioma requerido'),
    targetAudience: z.string().min(1, 'Audiencia objetivo requerida'),
    researchPurpose: z.string().min(1, 'Propósito de investigación requerido'),
    ethicalApproval: z.boolean()
  }).optional()
});

/**
 * Esquema de validación para sesión IAT
 */
export const IATSessionSchema = z.object({
  // Clave primaria
  sessionId: z.string().uuid(),
  
  // Referencias
  testId: z.string().uuid(),
  participantId: z.string().uuid(),
  
  // Estado de la sesión
  status: z.enum(['not-started', 'instructions', 'practice', 'test', 'completed', 'abandoned', 'error']),
  currentBlock: z.number().int().min(0),
  currentTrial: z.number().int().min(0),
  progress: z.number().min(0).max(100),
  
  // Tiempos
  startTime: z.string().datetime(),
  lastActivity: z.string().datetime(),
  estimatedCompletion: z.string().datetime().optional(),
  
  // Configuración
  testConfig: IATTestConfigSchema,
  
  // Respuestas
  responses: z.array(z.object({
    trialId: z.string().uuid(),
    response: z.enum(['left', 'right']),
    responseTime: z.number().min(0),
    accuracy: z.boolean(),
    timestamp: z.string().datetime(),
    deviceInfo: z.object({
      userAgent: z.string(),
      screenResolution: z.object({
        width: z.number().int().min(1),
        height: z.number().int().min(1)
      }),
      inputMethod: z.enum(['mouse', 'touch', 'keyboard']),
      browserInfo: z.object({
        name: z.string(),
        version: z.string()
      })
    })
  })),
  
  // Metadatos
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Esquema de validación para resultados IAT
 */
export const IATResultsSchema = z.object({
  // Clave primaria
  resultId: z.string().uuid(),
  
  // Referencias
  testId: z.string().uuid(),
  sessionId: z.string().uuid(),
  participantId: z.string().uuid(),
  
  // Resultados principales
  completedAt: z.string().datetime(),
  totalDuration: z.number().min(0),
  dScore: z.number(),
  dScoreInterpretation: z.enum(['no-preference', 'slight-preference', 'moderate-preference', 'strong-preference']),
  
  // Resultados por bloque
  blockResults: z.array(z.object({
    blockId: z.string().uuid(),
    blockType: z.enum(['practice', 'test']),
    meanLatency: z.number().min(0),
    standardDeviation: z.number().min(0),
    errorRate: z.number().min(0).max(1),
    totalTrials: z.number().int().min(0),
    correctTrials: z.number().int().min(0),
    averageResponseTime: z.number().min(0)
  })),
  
  // Análisis de errores
  errorAnalysis: z.object({
    totalErrors: z.number().int().min(0),
    errorRate: z.number().min(0).max(1),
    errorPattern: z.enum(['random', 'systematic', 'mixed']),
    correctionTime: z.number().min(0),
    confidence: z.number().min(0).max(1),
    learningEffect: z.boolean()
  }),
  
  // Métricas de rendimiento
  performanceMetrics: z.object({
    overallAccuracy: z.number().min(0).max(1),
    speedAccuracy: z.number().min(0).max(1),
    consistency: z.number().min(0).max(1),
    attention: z.number().min(0).max(1),
    fatigue: z.number().min(0).max(1),
    engagement: z.number().min(0).max(1)
  }),
  
  // Datos brutos
  rawData: z.array(z.object({
    id: z.string().uuid(),
    stimulus: z.string(),
    correctCategory: z.enum(['left', 'right']),
    responseTime: z.number().min(0),
    accuracy: z.boolean(),
    timestamp: z.string().datetime(),
    participantId: z.string().uuid()
  })),
  
  // Metadatos
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Esquema de validación para análisis estadístico IAT
 */
export const IATStatisticalAnalysisSchema = z.object({
  // Clave primaria
  analysisId: z.string().uuid(),
  
  // Referencias
  resultId: z.string().uuid(),
  testId: z.string().uuid(),
  participantId: z.string().uuid(),
  
  // Cálculo D-score
  dScore: z.object({
    compatibleMean: z.number(),
    incompatibleMean: z.number(),
    compatibleSD: z.number().min(0),
    incompatibleSD: z.number().min(0),
    pooledSD: z.number().min(0),
    dScore: z.number(),
    confidenceInterval: z.object({
      lower: z.number(),
      upper: z.number()
    }),
    effectSize: z.enum(['small', 'medium', 'large'])
  }),
  
  // Métricas de calidad
  reliability: z.number().min(0).max(1),
  validity: z.number().min(0).max(1),
  
  // Detección de sesgos
  biasDetection: z.object({
    socialDesirability: z.number().min(0).max(1),
    responseBias: z.number().min(0).max(1),
    attentionBias: z.number().min(0).max(1),
    fatigueBias: z.number().min(0).max(1),
    overallBias: z.enum(['low', 'medium', 'high'])
  }),
  
  // Métricas de calidad
  qualityMetrics: z.object({
    dataQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
    completionRate: z.number().min(0).max(1),
    attentionScore: z.number().min(0).max(1),
    consistencyScore: z.number().min(0).max(1),
    reliabilityScore: z.number().min(0).max(1)
  }),
  
  // Metadatos
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Esquema de validación para integración emocional IAT
 */
export const IATEmotionalIntegrationSchema = z.object({
  // Clave primaria
  integrationId: z.string().uuid(),
  
  // Referencias
  resultId: z.string().uuid(),
  participantId: z.string().uuid(),
  
  // Línea base emocional
  emotionalBaseline: z.object({
    valence: z.number().min(-1).max(1),
    arousal: z.number().min(0).max(1),
    dominance: z.number().min(0).max(1)
  }),
  
  // Correlaciones
  correlation: z.object({
    valenceCorrelation: z.number().min(-1).max(1),
    arousalCorrelation: z.number().min(-1).max(1),
    dominanceCorrelation: z.number().min(-1).max(1),
    overallCorrelation: z.number().min(-1).max(1),
    significance: z.boolean(),
    confidenceLevel: z.number().min(0).max(1)
  }),
  
  // Validación
  validation: z.object({
    isValid: z.boolean(),
    confidence: z.number().min(0).max(1),
    discrepancies: z.array(z.object({
      type: z.enum(['valence', 'arousal', 'dominance', 'overall']),
      magnitude: z.number().min(0),
      direction: z.enum(['positive', 'negative']),
      significance: z.boolean(),
      explanation: z.string()
    })),
    recommendations: z.array(z.string())
  }),
  
  // Metadatos
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// ======================================================================
// 🎯 INTERFACES TYPESCRIPT
// ======================================================================

/**
 * Interfaz para configuración de prueba IAT
 */
export interface IATTestConfigModel extends z.infer<typeof IATTestConfigSchema> {}

/**
 * Interfaz para sesión IAT
 */
export interface IATSessionModel extends z.infer<typeof IATSessionSchema> {}

/**
 * Interfaz para resultados IAT
 */
export interface IATResultsModel extends z.infer<typeof IATResultsSchema> {}

/**
 * Interfaz para análisis estadístico IAT
 */
export interface IATStatisticalAnalysisModel extends z.infer<typeof IATStatisticalAnalysisSchema> {}

/**
 * Interfaz para integración emocional IAT
 */
export interface IATEmotionalIntegrationModel extends z.infer<typeof IATEmotionalIntegrationSchema> {}

// ======================================================================
// 🗄️ DEFINICIONES DE TABLAS DYNAMODB
// ======================================================================

/**
 * Define la estructura de la tabla DynamoDB para configuraciones IAT
 */
export const IATTestConfigTableDefinition = {
  TableName: process.env.IAT_TEST_CONFIG_TABLE || 'IATTestConfigs',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'createdBy', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CreatedByIndex',
      KeySchema: [
        { AttributeName: 'createdBy', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'StatusIndex',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ]
};

/**
 * Define la estructura de la tabla DynamoDB para sesiones IAT
 */
export const IATSessionTableDefinition = {
  TableName: process.env.IAT_SESSION_TABLE || 'IATSessions',
  KeySchema: [
    { AttributeName: 'sessionId', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'sessionId', AttributeType: 'S' },
    { AttributeName: 'participantId', AttributeType: 'S' },
    { AttributeName: 'testId', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ParticipantIndex',
      KeySchema: [
        { AttributeName: 'participantId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'TestIndex',
      KeySchema: [
        { AttributeName: 'testId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'StatusIndex',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ]
};

/**
 * Define la estructura de la tabla DynamoDB para resultados IAT
 */
export const IATResultsTableDefinition = {
  TableName: process.env.IAT_RESULTS_TABLE || 'IATResults',
  KeySchema: [
    { AttributeName: 'resultId', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'resultId', AttributeType: 'S' },
    { AttributeName: 'participantId', AttributeType: 'S' },
    { AttributeName: 'testId', AttributeType: 'S' },
    { AttributeName: 'sessionId', AttributeType: 'S' },
    { AttributeName: 'completedAt', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ParticipantIndex',
      KeySchema: [
        { AttributeName: 'participantId', KeyType: 'HASH' },
        { AttributeName: 'completedAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'TestIndex',
      KeySchema: [
        { AttributeName: 'testId', KeyType: 'HASH' },
        { AttributeName: 'completedAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'SessionIndex',
      KeySchema: [
        { AttributeName: 'sessionId', KeyType: 'HASH' },
        { AttributeName: 'completedAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ]
};

/**
 * Define la estructura de la tabla DynamoDB para análisis estadístico IAT
 */
export const IATStatisticalAnalysisTableDefinition = {
  TableName: process.env.IAT_ANALYSIS_TABLE || 'IATStatisticalAnalysis',
  KeySchema: [
    { AttributeName: 'analysisId', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'analysisId', AttributeType: 'S' },
    { AttributeName: 'resultId', AttributeType: 'S' },
    { AttributeName: 'participantId', AttributeType: 'S' },
    { AttributeName: 'testId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ResultIndex',
      KeySchema: [
        { AttributeName: 'resultId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'ParticipantIndex',
      KeySchema: [
        { AttributeName: 'participantId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'TestIndex',
      KeySchema: [
        { AttributeName: 'testId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ]
};

/**
 * Define la estructura de la tabla DynamoDB para integración emocional IAT
 */
export const IATEmotionalIntegrationTableDefinition = {
  TableName: process.env.IAT_INTEGRATION_TABLE || 'IATEmotionalIntegration',
  KeySchema: [
    { AttributeName: 'integrationId', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'integrationId', AttributeType: 'S' },
    { AttributeName: 'resultId', AttributeType: 'S' },
    { AttributeName: 'participantId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ResultIndex',
      KeySchema: [
        { AttributeName: 'resultId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'ParticipantIndex',
      KeySchema: [
        { AttributeName: 'participantId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ]
};

// ======================================================================
// 🎯 UTILIDADES DE VALIDACIÓN
// ======================================================================

/**
 * Valida una configuración de prueba IAT
 */
export function validateIATTestConfig(data: unknown): IATTestConfigModel {
  return IATTestConfigSchema.parse(data);
}

/**
 * Valida una sesión IAT
 */
export function validateIATSession(data: unknown): IATSessionModel {
  return IATSessionSchema.parse(data);
}

/**
 * Valida resultados IAT
 */
export function validateIATResults(data: unknown): IATResultsModel {
  return IATResultsSchema.parse(data);
}

/**
 * Valida análisis estadístico IAT
 */
export function validateIATStatisticalAnalysis(data: unknown): IATStatisticalAnalysisModel {
  return IATStatisticalAnalysisSchema.parse(data);
}

/**
 * Valida integración emocional IAT
 */
export function validateIATEmotionalIntegration(data: unknown): IATEmotionalIntegrationModel {
  return IATEmotionalIntegrationSchema.parse(data);
}

// ======================================================================
// 🎯 CONSTANTES Y CONFIGURACIONES
// ======================================================================

/**
 * Nombres de tablas IAT
 */
export const IAT_TABLE_NAMES = {
  TEST_CONFIG: process.env.IAT_TEST_CONFIG_TABLE || 'IATTestConfigs',
  SESSION: process.env.IAT_SESSION_TABLE || 'IATSessions',
  RESULTS: process.env.IAT_RESULTS_TABLE || 'IATResults',
  ANALYSIS: process.env.IAT_ANALYSIS_TABLE || 'IATStatisticalAnalysis',
  INTEGRATION: process.env.IAT_INTEGRATION_TABLE || 'IATEmotionalIntegration'
} as const;

/**
 * Estados válidos para sesiones IAT
 */
export const IAT_SESSION_STATUS = {
  NOT_STARTED: 'not-started',
  INSTRUCTIONS: 'instructions',
  PRACTICE: 'practice',
  TEST: 'test',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  ERROR: 'error'
} as const;

/**
 * Estados válidos para configuraciones IAT
 */
export const IAT_TEST_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;

/**
 * Tipos de entrada válidos para IAT
 */
export const IAT_INPUT_METHODS = {
  MOUSE: 'mouse',
  TOUCH: 'touch',
  KEYBOARD: 'keyboard'
} as const;

/**
 * Patrones de error válidos para IAT
 */
export const IAT_ERROR_PATTERNS = {
  RANDOM: 'random',
  SYSTEMATIC: 'systematic',
  MIXED: 'mixed'
} as const;

/**
 * Calidades de datos válidas para IAT
 */
export const IAT_DATA_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
} as const;

/**
 * Niveles de sesgo válidos para IAT
 */
export const IAT_BIAS_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

/**
 * Tamaños de efecto válidos para IAT
 */
export const IAT_EFFECT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

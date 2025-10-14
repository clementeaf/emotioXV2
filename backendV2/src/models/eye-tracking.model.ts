import { z } from 'zod';
// Importaciones de tipos compartidos (se usan en esquemas Zod)

/**
 * Esquemas Zod para validación de datos de Eye Tracking
 */

// Esquema para GazePoint
export const GazePointSchema = z.object({
  x: z.number().min(0).max(10000),
  y: z.number().min(0).max(10000),
  timestamp: z.number().positive(),
  leftEye: z.object({
    x: z.number(),
    y: z.number(),
    pupilSize: z.number().positive(),
    validity: z.number().min(0).max(1)
  }).optional(),
  rightEye: z.object({
    x: z.number(),
    y: z.number(),
    pupilSize: z.number().positive(),
    validity: z.number().min(0).max(1)
  }).optional()
});

// Esquema para EyeTrackerConfig
export const EyeTrackerConfigSchema = z.object({
  deviceId: z.string().optional(),
  sampleRate: z.number().min(30).max(120).default(60),
  enableCalibration: z.boolean().default(true),
  calibrationPoints: z.number().min(3).max(16).default(9),
  trackingMode: z.enum(['screen', 'world']).default('screen'),
  smoothing: z.boolean().default(true),
  smoothingFactor: z.number().min(0).max(1).default(0.7)
});

// Esquema para CalibrationData
export const CalibrationDataSchema = z.object({
  points: z.array(z.object({
    x: z.number(),
    y: z.number(),
    leftEye: z.object({
      x: z.number(),
      y: z.number()
    }),
    rightEye: z.object({
      x: z.number(),
      y: z.number()
    })
  })),
  accuracy: z.number().min(0).max(10),
  timestamp: z.number().positive()
});

// Esquema para AreaOfInterest
export const AreaOfInterestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  type: z.enum(['rectangle', 'circle', 'polygon']),
  points: z.array(z.object({
    x: z.number(),
    y: z.number()
  })).optional()
});

// Esquema para FixationData
export const FixationDataSchema = z.object({
  startTime: z.number().positive(),
  endTime: z.number().positive(),
  duration: z.number().positive(),
  x: z.number(),
  y: z.number(),
  confidence: z.number().min(0).max(1),
  areaOfInterest: z.string().optional()
});

// Esquema para SaccadeData
export const SaccadeDataSchema = z.object({
  startTime: z.number().positive(),
  endTime: z.number().positive(),
  duration: z.number().positive(),
  startX: z.number(),
  startY: z.number(),
  endX: z.number(),
  endY: z.number(),
  amplitude: z.number().positive(),
  velocity: z.number().positive(),
  direction: z.number().min(0).max(360)
});

// Esquema para AttentionMetrics
export const AttentionMetricsSchema = z.object({
  totalFixations: z.number().min(0),
  averageFixationDuration: z.number().positive(),
  totalSaccades: z.number().min(0),
  averageSaccadeVelocity: z.number().positive(),
  scanPathLength: z.number().positive(),
  areasOfInterest: z.array(z.object({
    aoi: AreaOfInterestSchema,
    fixationCount: z.number().min(0),
    totalTime: z.number().min(0),
    firstFixationTime: z.number().min(0)
  })),
  heatMapData: z.array(z.object({
    x: z.number(),
    y: z.number(),
    intensity: z.number().min(0).max(1)
  }))
});

// Esquema para EyeTrackingSession
export const EyeTrackingSessionSchema = z.object({
  sessionId: z.string().uuid(),
  participantId: z.string().min(1).max(100),
  testId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['disconnected', 'connecting', 'connected', 'calibrating', 'tracking', 'error']),
  config: EyeTrackerConfigSchema,
  gazeData: z.array(GazePointSchema),
  calibrationData: CalibrationDataSchema.optional(),
  metadata: z.object({
    deviceInfo: z.object({
      screenWidth: z.number().positive(),
      screenHeight: z.number().positive(),
      devicePixelRatio: z.number().positive(),
      userAgent: z.string()
    }),
    sessionDuration: z.number().min(0),
    totalGazePoints: z.number().min(0),
    averageAccuracy: z.number().min(0)
  })
});

// Esquema para EyeTrackingAnalysis
export const EyeTrackingAnalysisSchema = z.object({
  sessionId: z.string().uuid(),
  participantId: z.string().min(1).max(100),
  analysisId: z.string().uuid(),
  createdAt: z.string().datetime(),
  fixations: z.array(FixationDataSchema),
  saccades: z.array(SaccadeDataSchema),
  attentionMetrics: AttentionMetricsSchema,
  areasOfInterest: z.array(AreaOfInterestSchema),
  qualityMetrics: z.object({
    dataLossRate: z.number().min(0).max(1),
    averageAccuracy: z.number().min(0),
    trackingStability: z.number().min(0).max(1),
    calibrationQuality: z.number().min(0).max(1)
  }),
  recommendations: z.array(z.string())
});

// Esquema para IATEyeTrackingConfig
export const IATEyeTrackingConfigSchema = z.object({
  testId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  iatConfig: z.object({
    categories: z.object({
      left: z.array(z.string()),
      right: z.array(z.string())
    }),
    attributes: z.object({
      left: z.array(z.string()),
      right: z.array(z.string())
    }),
    blocks: z.array(z.object({
      type: z.string(),
      trials: z.number().positive(),
      isPractice: z.boolean()
    }))
  }),
  eyeTrackingConfig: EyeTrackerConfigSchema,
  areasOfInterest: z.array(AreaOfInterestSchema),
  analysisSettings: z.object({
    fixationThreshold: z.number().positive(),
    saccadeThreshold: z.number().positive(),
    smoothingEnabled: z.boolean()
  })
});

// Esquema para IATEyeTrackingResults
export const IATEyeTrackingResultsSchema = z.object({
  sessionId: z.string().uuid(),
  participantId: z.string().min(1).max(100),
  testId: z.string().uuid(),
  iatResults: z.object({
    dScore: z.number(),
    interpretation: z.string(),
    significance: z.boolean(),
    effectSize: z.string()
  }),
  eyeTrackingResults: EyeTrackingAnalysisSchema,
  combinedAnalysis: z.object({
    attentionBias: z.number(),
    visualPreference: z.string(),
    cognitiveLoad: z.number(),
    engagementLevel: z.number()
  }),
  createdAt: z.string().datetime()
});

/**
 * Interfaces TypeScript derivadas de los esquemas Zod
 */
export type GazePointModel = z.infer<typeof GazePointSchema>;
export type EyeTrackerConfigModel = z.infer<typeof EyeTrackerConfigSchema>;
export type CalibrationDataModel = z.infer<typeof CalibrationDataSchema>;
export type AreaOfInterestModel = z.infer<typeof AreaOfInterestSchema>;
export type FixationDataModel = z.infer<typeof FixationDataSchema>;
export type SaccadeDataModel = z.infer<typeof SaccadeDataSchema>;
export type AttentionMetricsModel = z.infer<typeof AttentionMetricsSchema>;
export type EyeTrackingSessionModel = z.infer<typeof EyeTrackingSessionSchema>;
export type EyeTrackingAnalysisModel = z.infer<typeof EyeTrackingAnalysisSchema>;
export type IATEyeTrackingConfigModel = z.infer<typeof IATEyeTrackingConfigSchema>;
export type IATEyeTrackingResultsModel = z.infer<typeof IATEyeTrackingResultsSchema>;

/**
 * Definiciones de tablas DynamoDB para Eye Tracking
 */
export const EYE_TRACKING_TABLES = {
  EYE_TRACKING_SESSIONS: {
    TableName: process.env.EYE_TRACKING_SESSIONS_TABLE || 'eye-tracking-sessions',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' },
      { AttributeName: 'startTime', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'participant-index',
        KeySchema: [
          { AttributeName: 'participantId', KeyType: 'HASH' },
          { AttributeName: 'startTime', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      SSEEnabled: true
    }
  },
  
  EYE_TRACKING_ANALYSES: {
    TableName: process.env.EYE_TRACKING_ANALYSES_TABLE || 'eye-tracking-analyses',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'analysisId', AttributeType: 'S' },
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'analysisId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'session-index',
        KeySchema: [
          { AttributeName: 'sessionId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'participant-index',
        KeySchema: [
          { AttributeName: 'participantId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      SSEEnabled: true
    }
  },
  
  IAT_EYE_TRACKING_CONFIGS: {
    TableName: process.env.IAT_EYE_TRACKING_CONFIGS_TABLE || 'iat-eye-tracking-configs',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'testId', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'testId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'name-index',
        KeySchema: [
          { AttributeName: 'name', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      SSEEnabled: true
    }
  },
  
  IAT_EYE_TRACKING_RESULTS: {
    TableName: process.env.IAT_EYE_TRACKING_RESULTS_TABLE || 'iat-eye-tracking-results',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' },
      { AttributeName: 'testId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'participant-index',
        KeySchema: [
          { AttributeName: 'participantId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'test-index',
        KeySchema: [
          { AttributeName: 'testId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      SSEEnabled: true
    }
  }
} as const;

/**
 * Utilidades de validación
 */
export function validateGazePoint(data: unknown): GazePointModel {
  return GazePointSchema.parse(data);
}

export function validateEyeTrackingSession(data: unknown): EyeTrackingSessionModel {
  return EyeTrackingSessionSchema.parse(data);
}

export function validateEyeTrackingAnalysis(data: unknown): EyeTrackingAnalysisModel {
  return EyeTrackingAnalysisSchema.parse(data);
}

export function validateIATEyeTrackingConfig(data: unknown): IATEyeTrackingConfigModel {
  return IATEyeTrackingConfigSchema.parse(data);
}

export function validateIATEyeTrackingResults(data: unknown): IATEyeTrackingResultsModel {
  return IATEyeTrackingResultsSchema.parse(data);
}

/**
 * Constantes para Eye Tracking
 */
export const EYE_TRACKING_CONSTANTS = {
  MAX_GAZE_POINTS_PER_SESSION: 100000,
  MAX_SESSION_DURATION: 3600000, // 1 hour in ms
  DEFAULT_SAMPLE_RATE: 60,
  MIN_ACCURACY_THRESHOLD: 0.5,
  MAX_ACCURACY_THRESHOLD: 2.0,
  FIXATION_THRESHOLD: 100, // ms
  SACCADE_THRESHOLD: 30, // degrees/ms
} as const;

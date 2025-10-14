/**
 * @fileoverview TypeScript interfaces for Implicit Association Test (IAT) integration
 * @description Strict typing for IAT functionality in EmotioXV2 system
 * @version 1.0.0
 * @author EmotioXV2 Team
 */

// ======================================================================
// 🎯 CORE IAT INTERFACES
// ======================================================================

/**
 * Represents a single IAT trial with strict typing
 */
export interface IATTrial {
  readonly id: string;
  readonly stimulus: string;
  readonly correctCategory: 'left' | 'right';
  readonly responseTime: number;
  readonly accuracy: boolean;
  readonly timestamp: number;
  readonly participantId: string;
}

/**
 * Represents an IAT block configuration
 */
export interface IATBlock {
  readonly id: string;
  readonly type: 'practice' | 'test';
  readonly trials: readonly IATTrial[];
  readonly instructions: string;
  readonly order: number;
  readonly expectedDuration: number;
}

/**
 * Represents the complete IAT test configuration
 */
export interface IATTestConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly categories: IATCategories;
  readonly attributes: IATAttributes;
  readonly blocks: readonly IATBlock[];
  readonly settings: IATSettings;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Categories for IAT test (left and right sides)
 */
export interface IATCategories {
  readonly left: {
    readonly label: string;
    readonly items: readonly string[];
  };
  readonly right: {
    readonly label: string;
    readonly items: readonly string[];
  };
}

/**
 * Attributes for IAT test (positive/negative associations)
 */
export interface IATAttributes {
  readonly left: {
    readonly label: string;
    readonly items: readonly string[];
  };
  readonly right: {
    readonly label: string;
    readonly items: readonly string[];
  };
}

/**
 * IAT test settings and parameters
 */
export interface IATSettings {
  readonly maxResponseTime: number;
  readonly minResponseTime: number;
  readonly errorPenalty: number;
  readonly feedbackEnabled: boolean;
  readonly instructions: IATInstructions;
  readonly timing: IATTiming;
}

/**
 * Instructions for IAT test
 */
export interface IATInstructions {
  readonly welcome: string;
  readonly practice: string;
  readonly test: string;
  readonly completion: string;
  readonly error: string;
}

/**
 * Timing configuration for IAT test
 */
export interface IATTiming {
  readonly stimulusDuration: number;
  readonly interTrialInterval: number;
  readonly feedbackDuration: number;
  readonly blockBreakDuration: number;
}

// ======================================================================
// 📊 RESULTS AND ANALYSIS INTERFACES
// ======================================================================

/**
 * Complete IAT test results
 */
export interface IATResults {
  readonly testId: string;
  readonly participantId: string;
  readonly completedAt: number;
  readonly totalDuration: number;
  readonly dScore: number;
  readonly dScoreInterpretation: DScoreInterpretation;
  readonly blockResults: readonly IATBlockResult[];
  readonly errorAnalysis: IATErrorAnalysis;
  readonly performanceMetrics: IATPerformanceMetrics;
  readonly rawData: readonly IATTrial[];
}

/**
 * D-score interpretation levels
 */
export type DScoreInterpretation = 
  | 'no-preference'
  | 'slight-preference'
  | 'moderate-preference'
  | 'strong-preference';

/**
 * Results for a specific IAT block
 */
export interface IATBlockResult {
  readonly blockId: string;
  readonly blockType: 'practice' | 'test';
  readonly meanLatency: number;
  readonly standardDeviation: number;
  readonly errorRate: number;
  readonly totalTrials: number;
  readonly correctTrials: number;
  readonly averageResponseTime: number;
}

/**
 * Error analysis for IAT results
 */
export interface IATErrorAnalysis {
  readonly totalErrors: number;
  readonly errorRate: number;
  readonly errorPattern: 'random' | 'systematic' | 'mixed';
  readonly correctionTime: number;
  readonly confidence: number;
  readonly learningEffect: boolean;
}

/**
 * Performance metrics for IAT test
 */
export interface IATPerformanceMetrics {
  readonly overallAccuracy: number;
  readonly speedAccuracy: number;
  readonly consistency: number;
  readonly attention: number;
  readonly fatigue: number;
  readonly engagement: number;
}

// ======================================================================
// 🎮 RESPONSE AND INTERACTION INTERFACES
// ======================================================================

/**
 * User response to an IAT trial
 */
export interface IATResponse {
  readonly trialId: string;
  readonly participantId: string;
  readonly response: 'left' | 'right';
  readonly responseTime: number;
  readonly accuracy: boolean;
  readonly timestamp: number;
  readonly deviceInfo: IATDeviceInfo;
}

/**
 * Device information for IAT responses
 */
export interface IATDeviceInfo {
  readonly userAgent: string;
  readonly screenResolution: {
    readonly width: number;
    readonly height: number;
  };
  readonly inputMethod: 'mouse' | 'touch' | 'keyboard';
  readonly browserInfo: {
    readonly name: string;
    readonly version: string;
  };
}

/**
 * IAT test session state
 */
export interface IATSession {
  readonly sessionId: string;
  readonly participantId: string;
  readonly testConfig: IATTestConfig;
  readonly currentBlock: number;
  readonly currentTrial: number;
  readonly startTime: number;
  readonly responses: readonly IATResponse[];
  readonly status: IATSessionStatus;
  readonly progress: number;
}

/**
 * IAT session status
 */
export type IATSessionStatus = 
  | 'not-started'
  | 'instructions'
  | 'practice'
  | 'test'
  | 'completed'
  | 'abandoned'
  | 'error';

// ======================================================================
// 🔧 CALCULATION AND UTILITY INTERFACES
// ======================================================================

/**
 * D-score calculation parameters
 */
export interface DScoreCalculation {
  readonly compatibleMean: number;
  readonly incompatibleMean: number;
  readonly compatibleSD: number;
  readonly incompatibleSD: number;
  readonly pooledSD: number;
  readonly dScore: number;
  readonly confidenceInterval: {
    readonly lower: number;
    readonly upper: number;
  };
  readonly effectSize: 'small' | 'medium' | 'large';
}

/**
 * Statistical analysis for IAT results
 */
export interface IATStatisticalAnalysis {
  readonly dScore: DScoreCalculation;
  readonly reliability: number;
  readonly validity: number;
  readonly biasDetection: IATBiasDetection;
  readonly qualityMetrics: IATQualityMetrics;
}

/**
 * Bias detection in IAT results
 */
export interface IATBiasDetection {
  readonly socialDesirability: number;
  readonly responseBias: number;
  readonly attentionBias: number;
  readonly fatigueBias: number;
  readonly overallBias: 'low' | 'medium' | 'high';
}

/**
 * Quality metrics for IAT results
 */
export interface IATQualityMetrics {
  readonly dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  readonly completionRate: number;
  readonly attentionScore: number;
  readonly consistencyScore: number;
  readonly reliabilityScore: number;
}

// ======================================================================
// 🎯 INTEGRATION INTERFACES
// ======================================================================

/**
 * Integration with EmotioXV2 emotional assessment
 */
export interface IATEmotionalIntegration {
  readonly emotionalBaseline: {
    readonly valence: number;
    readonly arousal: number;
    readonly dominance: number;
  };
  readonly iatResults: IATResults;
  readonly correlation: IATEmotionalCorrelation;
  readonly validation: IATValidationResults;
}

/**
 * Correlation between IAT and emotional measures
 */
export interface IATEmotionalCorrelation {
  readonly valenceCorrelation: number;
  readonly arousalCorrelation: number;
  readonly dominanceCorrelation: number;
  readonly overallCorrelation: number;
  readonly significance: boolean;
  readonly confidenceLevel: number;
}

/**
 * Validation results for IAT integration
 */
export interface IATValidationResults {
  readonly isValid: boolean;
  readonly confidence: number;
  readonly discrepancies: readonly IATDiscrepancy[];
  readonly recommendations: readonly string[];
}

/**
 * Discrepancy between IAT and emotional measures
 */
export interface IATDiscrepancy {
  readonly type: 'valence' | 'arousal' | 'dominance' | 'overall';
  readonly magnitude: number;
  readonly direction: 'positive' | 'negative';
  readonly significance: boolean;
  readonly explanation: string;
}

// ======================================================================
// 📋 API REQUEST/RESPONSE INTERFACES
// ======================================================================

/**
 * Request to create a new IAT test
 */
export interface CreateIATTestRequest {
  readonly name: string;
  readonly description: string;
  readonly categories: IATCategories;
  readonly attributes: IATAttributes;
  readonly settings: IATSettings;
  readonly metadata: IATTestMetadata;
}

/**
 * Metadata for IAT test
 */
export interface IATTestMetadata {
  readonly author: string;
  readonly version: string;
  readonly language: string;
  readonly targetAudience: string;
  readonly researchPurpose: string;
  readonly ethicalApproval: boolean;
}

/**
 * Response for IAT test creation
 */
export interface CreateIATTestResponse {
  readonly success: boolean;
  readonly testId: string;
  readonly message: string;
  readonly validationErrors: readonly string[];
}

/**
 * Request to submit IAT response
 */
export interface SubmitIATResponseRequest {
  readonly sessionId: string;
  readonly trialId: string;
  readonly response: 'left' | 'right';
  readonly responseTime: number;
  readonly deviceInfo: IATDeviceInfo;
}

/**
 * Response for IAT response submission
 */
export interface SubmitIATResponseResponse {
  readonly success: boolean;
  readonly accuracy: boolean;
  readonly feedback: string;
  readonly nextTrial: IATTrial | null;
  readonly sessionComplete: boolean;
}

/**
 * Request to get IAT results
 */
export interface GetIATResultsRequest {
  readonly sessionId: string;
  readonly includeRawData: boolean;
  readonly includeAnalysis: boolean;
}

/**
 * Response for IAT results
 */
export interface GetIATResultsResponse {
  readonly success: boolean;
  readonly results: IATResults | null;
  readonly analysis: IATStatisticalAnalysis | null;
  readonly integration: IATEmotionalIntegration | null;
  readonly error: string | null;
}

// ======================================================================
// 🎨 UI COMPONENT INTERFACES
// ======================================================================

/**
 * Props for IAT test component
 */
export interface IATTestComponentProps {
  readonly testConfig: IATTestConfig;
  readonly onComplete: (results: IATResults) => void;
  readonly onError: (error: IATError) => void;
  readonly onProgress: (progress: number) => void;
  readonly className?: string;
  readonly disabled?: boolean;
}

/**
 * Props for IAT trial component
 */
export interface IATTrialComponentProps {
  readonly trial: IATTrial;
  readonly onResponse: (response: 'left' | 'right') => void;
  readonly onTimeout: () => void;
  readonly timeRemaining: number;
  readonly showFeedback: boolean;
  readonly feedback: string;
}

/**
 * Props for IAT results component
 */
export interface IATResultsComponentProps {
  readonly results: IATResults;
  readonly analysis: IATStatisticalAnalysis;
  readonly integration: IATEmotionalIntegration | null;
  readonly showRawData: boolean;
  readonly onExport: (format: 'json' | 'csv' | 'pdf') => void;
}

/**
 * IAT error interface
 */
export interface IATError {
  readonly code: string;
  readonly message: string;
  readonly details: Record<string, unknown>;
  readonly timestamp: number;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

// ======================================================================
// 🔄 STATE MANAGEMENT INTERFACES
// ======================================================================

/**
 * IAT state for state management
 */
export interface IATState {
  readonly currentTest: IATTestConfig | null;
  readonly currentSession: IATSession | null;
  readonly results: IATResults | null;
  readonly loading: boolean;
  readonly error: IATError | null;
  readonly progress: number;
}

/**
 * IAT actions for state management
 */
export interface IATActions {
  readonly startTest: (testId: string) => Promise<void>;
  readonly submitResponse: (response: IATResponse) => Promise<void>;
  readonly completeTest: () => Promise<IATResults>;
  readonly resetTest: () => void;
  readonly setError: (error: IATError) => void;
  readonly clearError: () => void;
}

// ======================================================================
// 📊 EXPORT AND UTILITY TYPES
// ======================================================================

/**
 * Export format for IAT data
 */
export type IATExportFormat = 'json' | 'csv' | 'pdf' | 'excel';

/**
 * IAT data export interface
 */
export interface IATDataExport {
  readonly format: IATExportFormat;
  readonly data: IATResults;
  readonly metadata: {
    readonly exportedAt: number;
    readonly version: string;
    readonly participantId: string;
  };
  readonly filename: string;
}

/**
 * IAT configuration validation result
 */
export interface IATConfigValidation {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

// ======================================================================
// 🎯 TYPE GUARDS
// ======================================================================

/**
 * Type guard to check if object is IATTrial
 */
export function isIATTrial(obj: unknown): obj is IATTrial {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as IATTrial).id === 'string' &&
    typeof (obj as IATTrial).stimulus === 'string' &&
    ((obj as IATTrial).correctCategory === 'left' || (obj as IATTrial).correctCategory === 'right') &&
    typeof (obj as IATTrial).responseTime === 'number' &&
    typeof (obj as IATTrial).accuracy === 'boolean' &&
    typeof (obj as IATTrial).timestamp === 'number' &&
    typeof (obj as IATTrial).participantId === 'string'
  );
}

/**
 * Type guard to check if object is IATResults
 */
export function isIATResults(obj: unknown): obj is IATResults {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as IATResults).testId === 'string' &&
    typeof (obj as IATResults).participantId === 'string' &&
    typeof (obj as IATResults).completedAt === 'number' &&
    typeof (obj as IATResults).totalDuration === 'number' &&
    typeof (obj as IATResults).dScore === 'number' &&
    Array.isArray((obj as IATResults).blockResults) &&
    Array.isArray((obj as IATResults).rawData)
  );
}

/**
 * Type guard to check if object is IATError
 */
export function isIATError(obj: unknown): obj is IATError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as IATError).code === 'string' &&
    typeof (obj as IATError).message === 'string' &&
    typeof (obj as IATError).timestamp === 'number' &&
    ['low', 'medium', 'high', 'critical'].includes((obj as IATError).severity)
  );
}

// ======================================================================
// 🎯 CONSTANTS
// ======================================================================

/**
 * Default IAT settings
 */
export const DEFAULT_IAT_SETTINGS: IATSettings = {
  maxResponseTime: 10000,
  minResponseTime: 200,
  errorPenalty: 300,
  feedbackEnabled: true,
  instructions: {
    welcome: 'Welcome to the Implicit Association Test',
    practice: 'This is a practice block. Please respond as quickly and accurately as possible.',
    test: 'This is the test block. Please respond as quickly and accurately as possible.',
    completion: 'Thank you for completing the test.',
    error: 'Please try again.'
  },
  timing: {
    stimulusDuration: 0,
    interTrialInterval: 250,
    feedbackDuration: 1000,
    blockBreakDuration: 2000
  }
} as const;

/**
 * IAT error codes
 */
export const IAT_ERROR_CODES = {
  INVALID_RESPONSE: 'IAT_INVALID_RESPONSE',
  TIMEOUT: 'IAT_TIMEOUT',
  NETWORK_ERROR: 'IAT_NETWORK_ERROR',
  VALIDATION_ERROR: 'IAT_VALIDATION_ERROR',
  SESSION_EXPIRED: 'IAT_SESSION_EXPIRED',
  TEST_NOT_FOUND: 'IAT_TEST_NOT_FOUND',
  PARTICIPANT_NOT_FOUND: 'IAT_PARTICIPANT_NOT_FOUND'
} as const;

/**
 * IAT test status
 */
export const IAT_TEST_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;

// ======================================================================
// 🎯 UTILITY TYPES
// ======================================================================

/**
 * Extract keys from IAT interfaces
 */
export type IATKeys = keyof IATTrial | keyof IATResults | keyof IATTestConfig;

/**
 * Make all properties optional for partial updates
 */
export type PartialIATTestConfig = Partial<IATTestConfig>;

/**
 * Make all properties required
 */
export type RequiredIATResults = Required<IATResults>;

/**
 * Extract response type from IAT response
 */
export type IATResponseType = IATResponse['response'];

/**
 * Extract block type from IAT block
 */
export type IATBlockType = IATBlock['type'];

/**
 * Extract session status from IAT session
 */
export type IATSessionStatusType = IATSession['status'];

/**
 * Eye Tracking Types - Centralized type definitions for eye tracking functionality
 * Re-exports from shared interfaces and defines frontend-specific types
 */

// Re-export eye tracking types from shared interfaces
export * from '../../../shared/interfaces/eye-tracking.interface';
export * from '../../../shared/interfaces/eyeTrackingRecruit.interface';

// Frontend-specific eye tracking types

// Eye tracking data management
export interface EyeTrackingData {
  id: string;
  researchId: string;
  buildConfig?: EyeTrackingBuildConfig;
  recruitConfig?: EyeTrackingRecruitFormDataLocal;
  results?: EyeTrackingResults;
  build?: any;
  recruit?: any;
  createdAt: string;
  updatedAt: string;
}

export interface EyeTrackingBuildConfig extends EyeTrackingFormData {
  status: 'draft' | 'configured' | 'active' | 'completed';
  validationErrors?: string[];
}

export interface EyeTrackingRecruitConfigExtended extends EyeTrackingRecruitFormData {
  status: 'draft' | 'active' | 'paused' | 'completed';
  generatedLink?: string;
  participantCount?: number;
  completedCount?: number;
}

export interface EyeTrackingResults {
  researchId: string;
  participants: EyeTrackingParticipantResult[];
  aggregatedData: EyeTrackingAggregatedData;
  visualizations: EyeTrackingVisualization[];
  exportFormats: string[];
}

export interface EyeTrackingParticipantResult {
  participantId: string;
  sessionId: string;
  gazeData: GazePoint[];
  fixations: Fixation[];
  saccades: Saccade[];
  aoiData: AOIData[];
  heatmapData: HeatmapPoint[];
  metadata: {
    sessionDuration: number;
    calibrationAccuracy: number;
    dataQuality: 'high' | 'medium' | 'low';
    deviceInfo: DeviceInfo;
  };
}

export interface GazePoint {
  timestamp: number;
  x: number;
  y: number;
  stimulusId: string;
  confidence: number;
}

export interface Fixation {
  id: string;
  startTime: number;
  duration: number;
  x: number;
  y: number;
  stimulusId: string;
}

export interface Saccade {
  id: string;
  startTime: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  velocity: number;
  amplitude: number;
}

export interface AOIData {
  aoiId: string;
  participantId: string;
  fixationCount: number;
  totalDwellTime: number;
  firstFixationTime: number;
  averageFixationDuration: number;
  visitCount: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  stimulusId: string;
}

export interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
}

export interface EyeTrackingAggregatedData {
  totalParticipants: number;
  averageSessionDuration: number;
  averageFixationDuration: number;
  averageSaccadeVelocity: number;
  stimulusSummary: StimulusSummary[];
  aoiSummary: AOISummary[];
}

export interface StimulusSummary {
  stimulusId: string;
  fileName: string;
  totalViewingTime: number;
  averageViewingTime: number;
  uniqueViewers: number;
  popularAreas: PopularArea[];
}

export interface AOISummary {
  aoiId: string;
  name: string;
  stimulusId: string;
  averageDwellTime: number;
  viewerCount: number;
  attentionPercentage: number;
}

export interface PopularArea {
  x: number;
  y: number;
  width: number;
  height: number;
  popularity: number;
}

export interface EyeTrackingVisualization {
  type: 'heatmap' | 'gazepath' | 'aoiChart' | 'timeline';
  stimulusId: string;
  data: any;
  metadata: {
    participantFilter?: string[];
    timeRange?: [number, number];
    settings: any;
  };
}

// Hook return types
export interface UseEyeTrackingDataOptions {
  includeBuild?: boolean;
  includeRecruit?: boolean;
  includeResults?: boolean;
  autoRefresh?: boolean;
  enabled?: boolean;
  type?: string;
}

export interface UseEyeTrackingDataReturn {
  // Data
  data?: EyeTrackingData;
  eyeTrackingData: EyeTrackingData | null;
  buildConfig: EyeTrackingBuildConfig | null;
  recruitConfig: EyeTrackingRecruitConfig | null;
  results: EyeTrackingResults | null;
  
  // State
  isLoading: boolean;
  isLoadingBuild: boolean;
  isLoadingRecruit: boolean;
  isLoadingResults: boolean;
  error: string | null;
  
  // Actions
  saveBuildConfig: (config: Partial<EyeTrackingBuildConfig>) => Promise<void>;
  saveRecruitConfig: (config: Partial<EyeTrackingRecruitConfig>) => Promise<void>;
  generateRecruitmentLink: () => Promise<string>;
  exportResults: (format: 'csv' | 'json' | 'xlsx') => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Validation
  validateBuildConfig: () => string[];
  validateRecruitConfig: () => string[];
}

// Form data types for frontend components - using types from shared interfaces
// Note: DemographicQuestions, LinkConfig, etc. are exported from eyeTrackingRecruit.interface.ts
export interface EyeTrackingRecruitFormDataLocal {
  researchId: string;
  demographicQuestions: DemographicQuestions;
  linkConfig: LinkConfig;
  participantLimit: ParticipantLimit;
  backlinks: Backlinks;
  researchUrl: string;
  parameterOptions: ParameterOptions;
}

// Additional utility types
export type EyeTrackingStage = 'build' | 'recruit' | 'results';

export interface EyeTrackingError {
  stage: EyeTrackingStage;
  field?: string;
  message: string;
  code?: string;
}

export interface EyeTrackingValidation {
  isValid: boolean;
  errors: EyeTrackingError[];
  warnings: string[];
}

// Export format options
export interface EyeTrackingExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  includeRawData: boolean;
  includeVisualizations: boolean;
  participantFilter?: string[];
  stimulusFilter?: string[];
  timeRange?: [number, number];
}

// Analysis options
export interface EyeTrackingAnalysisOptions {
  includeHeatmaps: boolean;
  includeGazePaths: boolean;
  includeAOIAnalysis: boolean;
  includeComparisons: boolean;
  fixationThreshold: number;
  saccadeVelocityThreshold: number;
}
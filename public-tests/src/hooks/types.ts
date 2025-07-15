export interface UseQuestionResponseProps {
  currentStepKey: string;
  previousResponse?: Record<string, unknown>;
  questionType: string;
}

export interface UseQuestionResponseReturn {
  selectedValue: string;
  textValue: string;
  setSelectedValue: (value: string) => void;
  setTextValue: (value: string) => void;
  hasPreviousResponse: boolean;
  demographicsValues: Record<string, string>;
}

export interface UseNavigationStateProps {
  onContinue?: () => void;
  buttonText?: string;
}

export interface UseNavigationStateReturn {
  isNavigating: boolean;
  isSuccess: boolean;
  buttonText: string;
  isButtonDisabled: boolean;
  handleContinue: () => Promise<void>;
}

export interface UseSubmitStateProps {
  onSuccess?: () => void;
  buttonText?: string;
  hasPreviousResponse?: boolean;
}

export interface UseSubmitStateReturn {
  isSubmitting: boolean;
  isSuccess: boolean;
  buttonText: string;
  isButtonDisabled: boolean;
  handleSubmit: (submitFn: () => Promise<void>) => Promise<void>;
}

export interface UseDeleteStateProps {
  onSuccess?: () => void;
  buttonText?: string;
  showToasts?: boolean;
}

export interface UseDeleteStateReturn {
  isDeleting: boolean;
  buttonText: string;
  isButtonDisabled: boolean;
  handleDelete: (deleteFn: () => Promise<void>) => Promise<void>;
}

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  platform: string;
  language: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  connectionType?: string;
  timezone: string;
}

export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  city?: string;
  country?: string;
  region?: string;
  ipAddress?: string;
  method: 'gps' | 'ip' | 'none';
  timestamp: number;
}

export interface SessionInfo {
  reentryCount: number;
  sessionStartTime: number;
  lastVisitTime: number;
  totalSessionTime: number;
  isFirstVisit: boolean;
  currentStepKey: string;
  stepProgress: number;
}

export interface TimingInfo {
  startTime: number;
  endTime?: number;
  duration?: number;
  sectionTimings: Array<{
    sectionId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
  }>;
}

export interface ConsolidatedMetadata {
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
  sessionInfo: SessionInfo;
  timingInfo: TimingInfo;
}

export interface ParticipantDataReturn {
  // Métodos de respuestas
  sendResponse: (questionKey: string, response: unknown) => Promise<boolean>;
  getResponse: (questionKey: string) => Promise<unknown | null>;
  updateResponse: (questionKey: string, newResponse: unknown) => Promise<boolean>;
  deleteAllResponses: () => Promise<boolean>;

  // Metadata automática
  metadata: ConsolidatedMetadata;

  // Estados
  isLoading: boolean;
  error: string | null;

  // Métodos de control
  startSession: () => void;
  endSession: () => void;
  updateCurrentStep: (stepKey: string) => void;
  updateProgress: (progress: number) => void;
}

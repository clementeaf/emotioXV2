export interface DemographicQuestion {
  enabled: boolean;
  required: boolean;
  options?: string[];
  disqualifyingAges?: string[];
}

export interface DemographicQuestions {
  age: DemographicQuestion;
  country: DemographicQuestion;
  gender: DemographicQuestion;
  educationLevel: DemographicQuestion;
  householdIncome: DemographicQuestion;
  employmentStatus: DemographicQuestion;
  dailyHoursOnline: DemographicQuestion;
  technicalProficiency: DemographicQuestion;
}

export interface LinkConfig {
  allowMobile: boolean;
  allowMobileDevices?: boolean;
  trackLocation: boolean;
  allowMultipleAttempts: boolean;
}

export interface ParticipantLimit {
  enabled: boolean;
  value: number;
}

export interface Backlinks {
  complete: string;
  disqualified: string;
  overquota: string;
}

export interface ParameterOptions {
  saveDeviceInfo: boolean;
  saveLocationInfo: boolean;
  saveResponseTimes: boolean;
  saveUserJourney: boolean;
}

export interface EyeTrackingRecruitFormData {
  id?: string;
  researchId: string;
  demographicQuestions: DemographicQuestions;
  linkConfig: LinkConfig;
  participantLimit: ParticipantLimit;
  backlinks: Backlinks;
  researchUrl: string;
  parameterOptions: ParameterOptions;
  questionKey: string;
}

export type DemographicQuestionKeys = keyof DemographicQuestions;
export type LinkConfigKeys = keyof LinkConfig;
export type ParameterOptionKeys = keyof ParameterOptions;
export type BacklinkKeys = keyof Backlinks;

export interface EyeTrackingRecruitStats {
  complete: {
    count: number;
    percentage: number;
    label: string;
    description: string;
  };
  disqualified: {
    count: number;
    percentage: number;
    label: string;
    description: string;
  };
  overquota: {
    count: number;
    percentage: number;
    label: string;
    description: string;
  };
}

export interface CreateEyeTrackingRecruitRequest {
  researchId: string;
  demographicQuestions: DemographicQuestions;
  linkConfig: {
    allowMobile?: boolean;
    allowMobileDevices?: boolean;
    trackLocation: boolean;
    allowMultipleAttempts: boolean;
  };
  participantLimit: ParticipantLimit;
  backlinks: Backlinks;
  researchUrl: string;
  parameterOptions: ParameterOptions;
}

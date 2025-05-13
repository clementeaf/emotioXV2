export interface ApiDemographicQuestion {
    enabled: boolean;
    required: boolean;
    options?: string[];
}

export interface ApiDemographicQuestions {
    age?: ApiDemographicQuestion;
    country?: ApiDemographicQuestion;
    gender?: ApiDemographicQuestion;
    educationLevel?: ApiDemographicQuestion;
    householdIncome?: ApiDemographicQuestion;
    employmentStatus?: ApiDemographicQuestion;
    dailyHoursOnline?: ApiDemographicQuestion;
    technicalProficiency?: ApiDemographicQuestion;
    [key: string]: ApiDemographicQuestion | undefined;
}

export interface ExtendedEyeTrackingData {
    demographicQuestions?: ApiDemographicQuestions;
    id?: string;
    researchId?: string;
    backlinks?: {
        complete: string;
        disqualified: string;
        overquota: string;
    };
    createdAt?: string;
    updatedAt?: string;
    linkConfig?: {
        allowMobile: boolean;
        trackLocation: boolean;
        allowMultipleAttempts: boolean;
    };
    parameterOptions?: {
        saveDeviceInfo: boolean;
        saveLocationInfo: boolean;
        saveResponseTimes: boolean;
        saveUserJourney: boolean;
    };
    participantLimit?: {
        enabled: boolean;
        value: number;
    };
    metadata?: {
        createdAt: string;
        updatedAt: string;
        lastModifiedBy: string;
    };
}

export interface DemographicStepProps {
    researchId: string;
    token?: string | null;
    stepConfig?: any;
    onStepComplete?: (answer?: any) => void;
    onError: (errorMessage: string, stepType: string) => void;
}
export declare enum ResearchType {
    EYE_TRACKING = "eye-tracking",
    ATTENTION_PREDICTION = "attention-prediction",
    COGNITIVE_ANALYSIS = "cognitive-analysis"
}
export declare enum ResearchStatus {
    DRAFT = "draft",
    IN_PROGRESS = "in-progress",
    COMPLETED = "completed",
    ARCHIVED = "archived"
}
export declare enum ResearchStage {
    BUILD = "build",
    RECRUIT = "recruit",
    RESULTS = "results"
}
export interface ResearchConfig {
    basic: {
        title: string;
        description: string;
        type: ResearchType;
        targetParticipants: number;
        objectives: string[];
        tags?: string[];
    };
    stages: {
        build: {
            hasWelcomeScreen: boolean;
            hasSmartVOC: boolean;
            hasCognitiveTasks: boolean;
            hasEyeTracking: boolean;
            hasThankYouScreen: boolean;
        };
        recruit: {
            hasScreener: boolean;
            hasWelcomeScreen: boolean;
            hasImplicitAssociation: boolean;
            hasCognitiveTask: boolean;
            hasEyeTracking: boolean;
            hasThankYouScreen: boolean;
        };
    };
    metadata?: {
        version?: string;
        lastUpdated?: Date;
        lastModifiedBy?: string;
    };
}
export interface ResearchValidation {
    basic: {
        title: {
            minLength: number;
            maxLength: number;
            required: boolean;
        };
        description: {
            minLength: number;
            maxLength: number;
            required: boolean;
        };
        targetParticipants: {
            min: number;
            max: number;
            required: boolean;
        };
        objectives: {
            minItems: number;
            maxItems: number;
            required: boolean;
        };
    };
}
export declare const DEFAULT_RESEARCH_VALIDATION: ResearchValidation;
export declare const DEFAULT_RESEARCH_CONFIG: ResearchConfig;
export interface ResearchRecord extends ResearchConfig {
    id: string;
    userId: string;
    status: ResearchStatus;
    currentStage: ResearchStage;
    stageProgress: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export type ResearchFormData = Omit<ResearchConfig, 'metadata' | 'stages'> & {
    stages?: Partial<ResearchConfig['stages']>;
};
export interface ResearchUpdate {
    id: string;
    updates: Partial<ResearchFormData>;
}
export interface ResearchCreationResponse {
    id: string;
    status: ResearchStatus;
    message: string;
}
//# sourceMappingURL=research.interface.d.ts.map
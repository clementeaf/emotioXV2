export interface AvailableFormsResponse {
  steps: string[];
  stepsConfiguration: StepConfiguration[];
  researchId: string;
  count: number;
}

export interface StepConfiguration {
  questionKey: string;
  contentConfiguration: Record<string, unknown>;
}

export interface ModuleResponse {
  id: string;
  researchId: string;
  participantId: string;
  questionKey: string;
  responses: Array<{
    questionKey: string;
    response: Record<string, unknown>;
    timestamp: string;
  }>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  quotaResult?: {
    status: 'QUALIFIED' | 'DISQUALIFIED_OVERQUOTA';
    order: number;
    quotaLimit: number;
  };
}

export interface ParticipantResponsesDocument {
  id: string;
  researchId: string;
  participantId: string;
  responses: ModuleResponse[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
}

// Corregido para coincidir exactamente con el backend
export interface CreateModuleResponseDto {
  researchId: string;
  participantId: string;
  questionKey: string;
  responses: Array<{
    questionKey: string;
    response: Record<string, unknown>;
    timestamp: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  metadata: Record<string, unknown>;
}

// Corregido para coincidir exactamente con el backend
export interface UpdateModuleResponseDto {
  researchId: string;
  participantId: string;
  questionKey: string;
  responses: Array<{
    questionKey: string;
    response: Record<string, unknown>;
    timestamp: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  metadata: Record<string, unknown>;
}

export interface ApiResponse<T = Record<string, unknown>> {
  data: T;
  status: number;
  message?: string;
}

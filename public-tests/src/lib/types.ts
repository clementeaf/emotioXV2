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

export interface CreateModuleResponseDto {
  researchId: string;
  participantId: string;
  questionKey: string;
  responses: Array<{
    questionKey: string;
    response: Record<string, unknown>;
    timestamp: string;
  }>;
  metadata: Record<string, unknown>;
}

export interface UpdateModuleResponseDto {
  questionKey: string;
  responses: Array<{
    questionKey: string;
    response: Record<string, unknown>;
    timestamp: string;
  }>;
  metadata: Record<string, unknown>;
}

export interface ApiResponse<T = Record<string, unknown>> {
  data: T;
  status: number;
  message?: string;
}

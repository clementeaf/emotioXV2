import { ParticipantFlowStep } from './flow';

export interface ModuleResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  stepTitle: string;
  stepType: string;
  response: unknown;
  participantId?: string;
  researchId?: string;
}

export interface ResponsesData {
  participantId?: string;
  researchId: string;
  startTime: number;
  endTime?: number;
  modules: {
    demographic?: ModuleResponse;
    feedback?: ModuleResponse;
    welcome?: ModuleResponse;
    eye_tracking: ModuleResponse[];
    cognitive_task: ModuleResponse[];
    smartvoc: ModuleResponse[];
    all_steps: ModuleResponse[];
    [key: string]: ModuleResponse | ModuleResponse[] | undefined;
  };
}

export interface ExpandedStep {
  id: string;
  name: string;
  type: string;
  config?: { [key: string]: unknown };
}

export interface ParticipantInfo {
  id: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface ParticipantState {
  researchId: string | null;
  token: string | null;
  participantId: string | null;
  error: string | null;
  isFlowLoading: boolean;
  currentStep: ParticipantFlowStep;
  expandedSteps: ExpandedStep[];
  currentStepIndex: number;
  maxVisitedIndex: number;
  completedRelevantSteps: number;
  totalRelevantSteps: number;
  responsesData: ResponsesData;
  setResearchId: (id: string | null) => void;
  setToken: (token: string | null) => void;
  setParticipant: (participant: ParticipantInfo) => void;
  setError: (error: string | null) => void;
  setCurrentStep: (step: ParticipantFlowStep) => void;
  setCurrentStepIndex: (index: number) => void;
  setExpandedSteps: (steps: ExpandedStep[]) => void;
  setIsFlowLoading: (loading: boolean) => void;

  // Métodos de flujo
  handleLoginSuccess: (participant: ParticipantInfo) => void;
  goToNextStep: (answer?: unknown) => void;
  navigateToStep: (targetIndex: number) => void;

  // Métodos de respuestas
  saveStepResponse: (stepIndex: number, answer: unknown) => void;
  getStepResponse: (stepIndex: number) => unknown;
  hasStepBeenAnswered: (stepIndex: number) => boolean;
  getAnsweredStepIndices: () => number[];
  getResponsesJson: () => string;

  // Nueva acción
  setLoadedResponses: (loadedStepResponses: ModuleResponse[]) => void;

  // Persistencia forzada
  forceSaveToLocalStorage: () => void;

  // Limpieza de datos
  cleanupPreviousParticipantData: (currentResearchId: string, currentParticipantId: string) => void;

  // Reset y utilidades
  resetStore: () => void;
  calculateProgress: () => void;
}

// Tipos para Store de datos de participantes
export interface ParticipantDataState {
  researchId: string | null;
  token: string | null;
  participantId: string | null;
  error: string | null;

  // Actions
  setResearchId: (id: string | null) => void;
  setToken: (token: string | null) => void;
  setParticipant: (participant: ParticipantInfo) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

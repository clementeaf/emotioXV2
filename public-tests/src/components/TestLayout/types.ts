export interface Question {
  title?: string;
  questionKey?: string;
  config?: Record<string, unknown>;
  choices?: Choice[];
  files?: unknown[];
}

export interface SidebarStep {
  label: string;
  questionKey: string;
}

export interface StepData {
  originalSk: string;
  derivedType?: string;
  config: {
    title?: string;
    questions?: Question[];
    questionKey?: string;
    [key: string]: unknown;
  };
  questionKey?: string;
}

export type StepSearchResult =
  | StepData
  | (Question & { parentStep: StepData })
  | Question
  | StepData['config']
  | { demographicQuestions: Question[]; parentStep: StepData }
  | undefined;

export interface ScreenStep {
  title?: string;
  description?: string;
  message?: string;
  startButtonText?: string;
  questionKey?: string;
  [key: string]: unknown;
}

export interface StepItemProps {
  step: SidebarStep;
  isActive: boolean;
  onClick: () => void;
}

export interface StepsListProps {
  steps: SidebarStep[];
  currentStepKey: string;
  onStepClick?: (step: SidebarStep, index: number) => void;
}

export interface TestLayoutRendererProps {
  data: StepData[] | undefined;
  isLoading: boolean;
  error: any;
  sidebarSteps?: SidebarStep[]; // Steps del sidebar para coordinación de navegación
}

export interface TestLayoutSidebarProps {
  steps: SidebarStep[];
  isLoading: boolean;
  error: any;
}

export interface DemographicQuestion {
  key: string;
  enabled: boolean;
  required: boolean;
  options: Array<string | { value: string; label: string }>;
  // Puedes agregar más campos según tu estructura real
}

export type StepType = 'screen' | 'demographics' | 'parent' | 'question' | 'unknown';


export interface ScaleRangeQuestionProps {
  min?: number;
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
  value?: number;
  onChange?: (value: number) => void;
}
export interface Choice {
  id: string;
  text: string;
  isQualify?: boolean;
  isDisqualify?: boolean;
}

export interface SingleAndMultipleChoiceQuestionProps {
  choices: Choice[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export interface PreferenceFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface PreferenceTestTaskProps {
  stepConfig: any;
  selectedImageId?: string | null;
  onImageSelect?: (imageId: string) => void;
}

/**
 * Interfaz para la respuesta de un módulo
 * ESTRUCTURA EXACTA REQUERIDA:
 */
export interface ModuleResponseData {
  participantId: string;    // ✅ ID del participante
  researchId: string;       // ✅ Research ID
  questionKey: string;      // ✅ Para identificar el formulario
  response: unknown;        // ✅ Respuesta dinámica del componente
}

export interface QuestionComponentProps {
  question: Question;
  currentStepKey: string;
  previousResponse?: Record<string, unknown>;
}

export interface DemographicFormProps {
  questions: DemographicQuestion[];
  previousResponse?: Record<string, unknown>;
}

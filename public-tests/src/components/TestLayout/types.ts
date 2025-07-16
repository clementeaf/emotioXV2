import { AvailableFormsResponse } from '../../lib/types';

export interface Question {
  title?: string;
  questionKey?: string;
  type?: string; // NUEVO: tipo de pregunta (csat, ces, cv, etc.)
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
  step: { title: string; questionKey: string };
  isActive: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export interface StepsListProps {
  steps: SidebarStep[];
  currentStepKey: string;
  isStepEnabled?: (index: number) => boolean;
  onStepClick?: (step: SidebarStep, index: number) => void;
}



export interface TestLayoutSidebarProps {
  steps: SidebarStep[];
  isLoading: boolean;
  error: Error | null;
}

export interface DemographicQuestion {
  key: string;
  enabled: boolean;
  required: boolean;
  options: Array<string | { value: string; label: string }>;
  // Puedes agregar más campos según tu estructura real
}

export type StepType = 'screen' | 'demographics' | 'parent' | 'question' | 'smart-voc' | 'unknown';


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
  stepConfig: Record<string, unknown>;
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
}

export interface DemographicFormProps {
  questions: DemographicQuestion[];
  previousResponse?: Record<string, unknown>;
}

export interface UseSidebarLogicProps {
  researchId?: string;
  onStepsReady?: (steps: SidebarStep[]) => void;
  onNavigateToStep?: (stepKey: string) => void;
  onDeleteAllResponses?: () => Promise<void>;
}

export interface CustomStep {
  title: string;
  questionKey: string;
}

export interface UseSidebarLogicReturn {
  // Estado de la API
  formsData: AvailableFormsResponse | undefined; // Datos tal como llegan de la API
  steps: CustomStep[]; // Array con {title, questionKey}
  totalSteps: number;
  isLoading: boolean;
  error: Error | null;

  // Estado del sidebar
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Estado del paso actual
  selectedQuestionKey: string;

  // Funciones de navegación
  isStepEnabled: (stepIndex: number) => boolean;
  handleStepClick: (questionKey: string) => void;

  // Funciones de eliminación
  handleDeleteAllResponses: () => Promise<void>;
  isDeleting: boolean;
  deleteButtonText: string;
  isDeleteDisabled: boolean;

  // Funciones de API
  refetchForms: () => void;
}

// Tipo para los steps que vienen del hook
export interface CustomStep {
  title: string;
  questionKey: string;
}

export interface CustomStepsListProps {
  steps: CustomStep[];
  currentStepKey: string;
  isStepEnabled?: (index: number) => boolean;
}

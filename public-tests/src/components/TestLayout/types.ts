export interface Question {
  title?: string;
  questionKey?: string;
  config?: Record<string, unknown>;
  choices?: Choice[];
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

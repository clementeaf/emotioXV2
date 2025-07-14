export interface Question {
  title?: string;
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
    [key: string]: unknown;
  };
}

export interface StepItemProps {
  step: SidebarStep;
  isActive: boolean;
  onClick: () => void;
}

export interface StepsListProps {
  steps: SidebarStep[];
  currentStep: number;
  onStepClick?: (step: SidebarStep, index: number) => void;
}

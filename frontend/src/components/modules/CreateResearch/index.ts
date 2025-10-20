/**
 * Módulo CreateResearch - Todo lo relacionado con la creación de investigaciones
 * 
 * Este módulo centraliza todos los componentes, hooks, tipos y utilidades
 * relacionados con el flujo de creación de nuevas investigaciones.
 */

// Componentes principales
export { NewResearchContent } from './NewResearchContent';
export { CreateResearchFormOptimized } from './CreateResearchFormOptimized';
export { ResearchConfirmation } from './ResearchConfirmation';
export { ResearchStageManager } from './ResearchStageManager';
export { ResearchTransition } from './ResearchTransition';

// Secciones del flujo
export { CreateSection } from './sections/CreateSection';
export { ErrorSection } from './sections/ErrorSection';
export { StagesSection } from './sections/StagesSection';
export { SuccessSection } from './sections/SuccessSection';

// Componentes del formulario
export { BasicInfoStep } from './components/BasicInfoStep';
export { FormActions } from './components/FormActions';
export { FormSteps } from './components/FormSteps';
export { ResearchSummary } from './components/ResearchSummary';
export { ResearchTypeStep } from './components/ResearchTypeStep';
export { TechniqueStep } from './components/TechniqueStep';

// Hooks
export { useStageManager } from './hooks/useStageManager';
export { default as useCreateResearchForm } from './components/useCreateResearchForm';

// Re-exportar interfaces desde shared
export type {
  SuccessData,
  CreateSectionProps,
  SuccessSectionProps,
  StagesSectionProps,
  ErrorSectionProps,
  ResearchCreationStep,
  ResearchCreationConfig,
  ConfirmationModalProps
} from '../../../shared/interfaces/research-creation.interface';

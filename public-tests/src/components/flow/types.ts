import { Participant } from "../../../../shared/interfaces/participant";
import { ParticipantFlowStep } from "../../types/flow";

// Props del Handler (se mantienen igual)
export interface CognitiveTaskHandlerProps {
    researchId: string;
    token: string;
    onComplete: () => void;
    onError: (message: string) => void;
}

export interface CurrentStepProps {
    stepType: string;
    stepConfig?: unknown;
    stepId?: string;
    stepName?: string;
    researchId: string;
    token?: string | null;
    instructions?: string;
    onLoginSuccess?: (participant: Participant & { id: string }) => void;
    onStepComplete?: (answer?: unknown) => void;
    onError: (errorMessage: string, stepType: string) => void;
    savedResponse?: any;
}

// Props que necesita este componente para funcionar
export interface CurrentStepRendererProps {
    currentStep: ParticipantFlowStep;
    researchId: string;
    token: string | null;
    onLoginSuccess: (participant: Participant & { id: string }) => void;
    onStepComplete: () => void;
    onError: (errorMessage: string, step: ParticipantFlowStep) => void;
}

export interface FlowStepContentProps {
    currentStep: ParticipantFlowStep;
    researchId: string | undefined;
    token: string | null;
    error: string | null;
    // Callbacks
    handleLoginSuccess: (participant: Participant & { id: string }) => void;
    handleStepComplete: () => void;
    handleError: (errorMessage: string, step: ParticipantFlowStep) => void;
}

// Reutilizar la interfaz temporal (o idealmente importar la real)
export interface SmartVOCConfig {
    id?: string;
    researchId: string;
    title?: string;
    instructions?: string;
    finishButtonText?: string;
    // ... otros campos específicos ...
}

// Interfaz para una pregunta individual (¡Esta es una suposición! Debe ajustarse a la API real)
export interface SmartVOCQuestion {
    id?: string; // Identificador único de la pregunta si existe
    type: 'CSAT' | 'CES' | 'CV' | 'NEV' | 'NPS' | 'VOC'; // Tipo de pregunta
    questionText: string;
    instructions?: string;
    companyName?: string;
    scaleSize?: number;
    leftLabel?: string;
    rightLabel?: string;
    placeholder?: string;
    // ... otros campos específicos por tipo?
}

// Interfaz para la configuración general (¡Suposición!)
export interface SmartVOCConfig {
    id?: string;
    researchId: string;
    title?: string; // Título general del paso SmartVOC (si existe)
    instructions?: string; // Instrucciones generales (si existen)
    questions?: SmartVOCQuestion[]; // Array de preguntas
    // ... otros campos ...
}

// Interfaz para almacenar respuestas (simple key-value por ahora)
export interface Answers {
  [questionIdOrIndex: string]: unknown; // Usar ID de pregunta si está disponible, o índice
}

export interface SmartVOCHandlerProps {
    researchId: string;
    token: string;
    onComplete: (answers: Answers) => void; // Permitir pasar las respuestas
    onError: (error: string) => void;
    stepConfig?: { // <-- Añadir stepConfig opcional
      moduleId?: string;
    };
}

export interface WelcomeStepConfig {
    title?: string;
    message?: string;
    startButtonText?: string;
}

export interface WelcomeScreenHandlerProps {
    stepConfig?: WelcomeStepConfig;
    onStepComplete: () => void;
}

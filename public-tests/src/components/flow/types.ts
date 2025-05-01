import { Participant } from "../../../../shared/interfaces/participant";
import { ParticipantFlowStep } from "../../types/flow";

// Props del Handler (se mantienen igual)
export interface CognitiveTaskHandlerProps {
    researchId: string;
    token: string;
    onComplete: () => void; 
    onError: (message: string) => void; 
}

// Props que necesita este componente para funcionar
export interface CurrentStepRendererProps {
    currentStep: ParticipantFlowStep;
    researchId: string;
    token: string | null;
    // Callbacks que vienen del padre (ParticipantFlow)
    onLoginSuccess: (participant: Participant) => void;
    onStepComplete: () => void;
    onError: (errorMessage: string, step: ParticipantFlowStep) => void;
}

export interface FlowStepContentProps {
    currentStep: ParticipantFlowStep;
    researchId: string | undefined; 
    token: string | null;
    error: string | null;
    // Callbacks
    handleLoginSuccess: (participant: Participant) => void;
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
  [questionIdOrIndex: string]: any; // Usar ID de pregunta si está disponible, o índice
}

export interface SmartVOCHandlerProps {
    researchId: string;
    token: string;
    onComplete: () => void; // Llamado cuando se completa con éxito (o no existe)
    onError: (message: string) => void; // Llamado si hay un error de carga
}
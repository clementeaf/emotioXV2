// Interfaz para las respuestas de módulos
export interface ModuleResponse {
    stepId: string;
    stepType: string;
    stepName?: string;
    question?: string;
    answer?: any;
    timestamp: number;
}

// Interfaz para el JSON completo de respuestas
export interface ResponsesData {
    participantId?: string;
    researchId: string;
    startTime: number;
    endTime?: number;
    modules: {
        demographic?: ModuleResponse;
        feedback?: ModuleResponse;
        welcome?: ModuleResponse;
        cognitive_task: ModuleResponse[];
        smartvoc: ModuleResponse[];
        all_steps: ModuleResponse[];
        [key: string]: ModuleResponse | ModuleResponse[] | undefined;
    };
}

// Estados de la carga de investigación
export enum ResearchLoadStatus {
    NOT_STARTED = 'not_started',
    LOADING = 'loading',
    LOADED = 'loaded',
    ERROR = 'error'
}

export interface UseFlowBuilderProps {
    researchFlowApiData: any; 
}
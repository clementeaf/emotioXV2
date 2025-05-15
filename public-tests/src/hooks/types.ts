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

export interface UseStepResponseManagerProps<TResponseData> {
    stepId: string;
    stepType: string;
    stepName?: string;
    initialData?: TResponseData | null;
    researchId?: string;
    participantId?: string;
  }
  
  export interface UseStepResponseManagerReturn<TResponseData> {
    responseData: TResponseData | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    responseSpecificId: string | null; 
    saveCurrentStepResponse: (dataToSave: TResponseData) => Promise<{ success: boolean; id?: string | null }>;
  }
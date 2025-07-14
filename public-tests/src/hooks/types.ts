import { ModuleResponse as StoreModuleResponse } from '../stores/participantStore';

export type ModuleResponse = StoreModuleResponse;

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

export enum ResearchLoadStatus {
    NOT_STARTED = 'not_started',
    LOADING = 'loading',
    LOADED = 'loaded',
    ERROR = 'error'
}

export interface UseFlowBuilderProps {
    researchFlowApiData: unknown;
}

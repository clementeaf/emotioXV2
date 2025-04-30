// Props del Handler (se mantienen igual)
export interface CognitiveTaskHandlerProps {
    researchId: string;
    token: string;
    onComplete: () => void; 
    onError: (message: string) => void; 
}
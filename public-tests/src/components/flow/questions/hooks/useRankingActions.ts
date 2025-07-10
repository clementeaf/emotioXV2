import { useState } from "react";
import { useResponseAPI } from "../../../../hooks/useResponseAPI";
import { useParticipantStore } from "../../../../stores/participantStore";

interface UseRankingActionsProps {
    rankedItems: string[];
    stepType: string;
    stepId?: string;
    onStepComplete: (answer: unknown) => void;
    isApiDisabled: boolean;
}

interface UseRankingActionsReturn {
    handleSaveAndProceed: () => Promise<void>;
    isSaving: boolean;
    isApiLoading: boolean;
}

const hasMessage = (obj: unknown): obj is { message: string } =>
    typeof obj === 'object' && obj !== null && 'message' in obj && typeof (obj as { message?: unknown }).message === 'string';

export const useRankingActions = ({
    rankedItems,
    stepType,
    stepId,
    onStepComplete,
    isApiDisabled
}: UseRankingActionsProps): UseRankingActionsReturn => {
    const [isSaving, setIsSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });



    const handleSaveAndProceed = async () => {
        if (isApiDisabled) {
            return;
        }

        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }

        const currentStepIdForApi = stepId || stepType;

        setIsSaving(true);
        setApiError(null);

        try {
            setApiError(null);
            let success = false;
            const payload = { response: rankedItems };
            let operationResult: unknown;

            // Note: This is a simplified version - the actual implementation
            // would need to track moduleResponseId and dataExisted state
            operationResult = await saveResponse(currentStepIdForApi, stepType, payload.response);

            if (apiHookError) {
                console.error('[useRankingActions] Hook reported error:', apiHookError);
                setApiError(typeof apiHookError === 'string' ? apiHookError : (hasMessage(operationResult) ? operationResult.message : 'Error en la operación de guardado.'));
                success = false;
            } else if (operationResult) {
                success = true;
                setApiError(null);
            } else {
                console.warn('[useRankingActions] Operation failed (hook clear, but no result received).', { operationResult });
                setApiError('La operación de guardado falló o no devolvió resultado.');
                success = false;
            }

            if (success) {
                onStepComplete(payload.response);
            } else if (!apiError) {
                 console.warn('[useRankingActions] Operation failed, setting generic error.');
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }

        } catch (error: unknown) {
            console.error('[useRankingActions] EXCEPTION during save/update:', error);
            if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
                setApiError((error as { message: string }).message);
            } else {
                setApiError('Error inesperado durante el guardado.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return {
        handleSaveAndProceed,
        isSaving,
        isApiLoading
    };
};

import { useCallback, useEffect, useState } from 'react';
import { UseStepResponseManagerProps, UseStepResponseManagerReturn } from '../types/hooks.types';
import { useResponseAPI } from './useResponseAPI';

export function useStepResponseManager<TResponseData = unknown>({
  stepId,
  stepType,
  stepName,
  initialData,
  researchId,
  participantId,
  questionKey
}: UseStepResponseManagerProps<TResponseData>): UseStepResponseManagerReturn<TResponseData> {
  const [responseData, setResponseData] = useState<TResponseData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseSpecificId, setResponseSpecificId] = useState<string | null>(null);

  // Usar useResponseAPI para las operaciones de backend
  const responseAPI = useResponseAPI({
    researchId: researchId || '',
    participantId: participantId || ''
  });

  // Cargar respuesta existente al montar el componente
  useEffect(() => {
    const loadExistingResponse = async () => {
      if (!researchId || !participantId || !stepId) return;

      setIsLoading(true);
      setError(null);

      try {
        const responses = await responseAPI.getResponses();

        if (responses && typeof responses === 'object' && responses !== null) {
          // Buscar respuesta específica por stepId o questionKey
          const existingResponse = Array.isArray(responses)
            ? responses.find((r: any) => r.stepId === stepId || r.questionKey === questionKey)
            : null;

          if (existingResponse) {
            setResponseData(existingResponse.response as TResponseData);
            setResponseSpecificId(existingResponse.id || null);
          }
        }
      } catch (err) {
        console.error('[useStepResponseManager] Error cargando respuesta existente:', err);
        setError('Error cargando respuesta existente');
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingResponse();
  }, [researchId, participantId, stepId, questionKey, responseAPI]);

  const saveCurrentStepResponse = useCallback(async (dataToSave: TResponseData): Promise<{ success: boolean; id?: string | null }> => {
    if (!researchId || !participantId || !stepId || !stepType) {
      console.error('[useStepResponseManager] Faltan datos requeridos para guardar');
      return { success: false };
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        stepId,
        stepType,
        stepTitle: stepName || stepId,
        response: dataToSave,
        questionKey: questionKey || stepId
      };

      console.log(`[useStepResponseManager] 🔑 Guardando respuesta con questionKey: ${questionKey || stepId}`, {
        stepId,
        stepType,
        questionKey: questionKey || stepId,
        hasAnswer: dataToSave !== undefined && dataToSave !== null
      });

      const result = await responseAPI.saveOrUpdateResponse(
        stepId,
        stepType,
        dataToSave,
        responseSpecificId || undefined
      );

      if (result && result.id) {
        setResponseSpecificId(result.id);
        setResponseData(dataToSave);
        console.log(`[useStepResponseManager] ✅ Respuesta guardada exitosamente:`, {
          responseId: result.id,
          questionKey: questionKey || stepId
        });
        return { success: true, id: result.id };
      } else {
        console.error(`[useStepResponseManager] ❌ questionKey inválido: ${questionKey || stepId}`);
        setError('Error guardando respuesta');
        return { success: false };
      }
    } catch (apiError) {
      console.error('[useStepResponseManager] Error guardando respuesta en API:', apiError);
      setError('Error guardando respuesta');
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [researchId, participantId, stepId, stepType, stepName, questionKey, responseAPI, responseSpecificId]);

  const hasExistingData = responseData !== null && responseData !== undefined;

  return {
    responseData,
    isLoading,
    isSaving,
    error,
    responseSpecificId,
    saveCurrentStepResponse,
    hasExistingData
  };
}

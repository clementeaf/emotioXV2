import { useMemo } from 'react';
import { UseStepResponseManagerProps, UseStepResponseManagerReturn } from '../types/hooks.types';
import { useStandardizedForm } from './useStandardizedForm';

export function useStepResponseManager<TResponseData = unknown>({
  stepId,
  stepType,
  stepName,
  initialData = null,
  researchId: propResearchId,
  participantId: propParticipantId,
  questionKey, // NUEVO: questionKey del backend
}: UseStepResponseManagerProps<TResponseData>): UseStepResponseManagerReturn<TResponseData> {

  // NUEVO: Usar questionKey del backend si está disponible
  const backendQuestionKey = questionKey || stepId;

  // Configurar props para useStandardizedForm
  const standardizedProps = useMemo(() => ({
    stepId: backendQuestionKey, // NUEVO: Usar questionKey del backend
    stepType,
    stepName: stepName || backendQuestionKey, // NUEVO: Usar questionKey como fallback
    researchId: propResearchId,
    participantId: propParticipantId,
    required: false // Por defecto false para mantener compatibilidad
  }), [backendQuestionKey, stepType, stepName, propResearchId, propParticipantId]);

  // NUEVO: Log para debugging
  console.log(`[useStepResponseManager] 🔑 Usando questionKey: ${backendQuestionKey}`, {
    originalStepId: stepId,
    questionKey,
    backendQuestionKey,
    stepType
  });

  const [state, actions] = useStandardizedForm<TResponseData>(
    {
      ...standardizedProps,
      savedResponse: initialData ?? null,
    },
    {
      // Usar valor inicial proporcionado, asegurándonos de que sea del tipo correcto
      initialValue: (initialData ?? {} as TResponseData),

      // Mapeo inteligente universal que detecta automáticamente la estructura
      extractValueFromResponse: (response: unknown): TResponseData => {
        // Si es primitivo (número, string, boolean) → devolver tal como está
        if (response === null || response === undefined ||
            typeof response === 'number' || typeof response === 'string' || typeof response === 'boolean') {
          return response as TResponseData;
        }

        // Si es objeto
        if (typeof response === 'object' && response !== null) {
          const obj = response as Record<string, unknown>;
          const keys = Object.keys(obj);

          // Si tiene solo 1 propiedad "value" → extraer obj.value
          if (keys.length === 1 && keys[0] === 'value') {
            return obj.value as TResponseData;
          }

          // Si es objeto complejo → devolver objeto completo
          return response as TResponseData;
        }

        return response as TResponseData;
      },

      // Sin validación por defecto para mantener compatibilidad
      validationRules: [],

      // Sin módulo específico para uso genérico
      moduleId: undefined
    }
  );

  // Mapear estado interno a API pública esperada
  const responseData = state.value as TResponseData | null;
  const isLoading = state.isLoading;
  const isSaving = state.isSaving;
  const error = state.error;
  const responseSpecificId = state.hasExistingData && state.responseId
    ? state.responseId
    : null;
  const hasExistingData = state.hasExistingData;

  // Wrapper para saveCurrentStepResponse que mantiene API esperada
  const saveCurrentStepResponse = async (dataToSave: TResponseData): Promise<{ success: boolean; id?: string | null }> => {

    // Actualizar valor pero pasar directamente a validateAndSave para evitar problema de async
    actions.setValue(dataToSave);

    const result = await actions.validateAndSave(dataToSave);

    if (result.success) {
      // Extraer ID de la respuesta guardada
      const id = result.data && typeof result.data === 'object' && 'id' in result.data
        ? String((result.data as { id: unknown }).id)
        : null;

      return { success: true, id };
    } else {
      console.error(`❌ [useStepResponseManager] Failed to save:`, result);
      return { success: false };
    }
  };

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

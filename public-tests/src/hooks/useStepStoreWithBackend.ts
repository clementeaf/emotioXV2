import { useEffect } from 'react';
import { useFormDataStore } from '../stores/useFormDataStore';
import { useStepStore } from '../stores/useStepStore';
import { useTestStore } from '../stores/useTestStore';
import { useModuleResponsesQuery } from './useApiQueries';

export const useStepStoreWithBackend = () => {
  const { researchId, participantId } = useTestStore();
  const { updateBackendResponses } = useStepStore();

  // Query para obtener respuestas del backend
  const { data: moduleResponses, isLoading, error } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // 🎯 SINGLE RESPONSIBILITY: Solo sincronizar backend → store
  useEffect(() => {
    if (moduleResponses?.responses && researchId && participantId) {
      console.log('[useStepStoreWithBackend] 🔄 Sincronizando con backend:', {
        responsesCount: moduleResponses.responses.length,
        questionKeys: moduleResponses.responses.map((r: { questionKey: string }) => r.questionKey)
      });

      const backendResponses = moduleResponses.responses.map((response: { questionKey: string; response: unknown }) => {
        return {
          questionKey: response.questionKey,
          response: response.response || {}
        };
      });

      updateBackendResponses(backendResponses);

      // 🎯 SINCRONIZAR CON FORM DATA STORE
      const { setFormData } = useFormDataStore.getState();
      backendResponses.forEach((backendResponse: { questionKey: string; response: unknown }) => {
        if (backendResponse.questionKey && backendResponse.response) {
          // 🎯 EXTRAER VALOR DE LA RESPUESTA
          let value = null;
          const responseData = backendResponse.response as Record<string, unknown>;
          if (responseData.value !== undefined) {
            value = responseData.value;
          } else if (responseData.selectedValue !== undefined) {
            value = responseData.selectedValue;
          } else if (responseData.response !== undefined) {
            value = responseData.response;
          } else if (responseData.age !== undefined) {
            // 🎯 CASO ESPECIAL PARA DEMOGRÁFICOS
            value = responseData.age;
          }

          // 🎯 GUARDAR EN FORM DATA STORE
          const formDataToSave = {
            value,
            selectedValue: value,
            response: backendResponse.response,
            timestamp: responseData.timestamp || new Date().toISOString()
          };

          // 🎯 PARA DEMOGRÁFICOS, GUARDAR TAMBIÉN EN EL FORMATO ESPERADO
          if (backendResponse.questionKey === 'demographics') {
            setFormData('demographics', {
              ...formDataToSave,
              age: value // 🎯 GUARDAR TAMBIÉN COMO age PARA COMPATIBILIDAD
            });
          } else {
            setFormData(backendResponse.questionKey, formDataToSave);
          }

        }
      });
    }
  }, [moduleResponses?.responses, researchId, participantId, updateBackendResponses]);

  return {
    isLoading,
    error
  };
};

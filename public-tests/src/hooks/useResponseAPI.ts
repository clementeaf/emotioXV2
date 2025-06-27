import { useCallback, useState } from 'react';
import { apiClient } from '../lib/api';
import { UseResponseAPIProps } from '../types';

export const useResponseAPI = ({ researchId, participantId }: UseResponseAPIProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getResponses = useCallback(async () => {
    if (!researchId || !participantId) {
      setError('ID de investigación o participante inválido');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getModuleResponses(researchId, participantId);

      if ((response.status === 404 || response.notFound === true)) {
        setError(null);
        return {};
      }

      if (response.error || !response.data) {
        console.error('Error obteniendo respuestas:', response);
        setError(response.message || 'Error obteniendo respuestas');
        return null;
      }

      if (response && typeof response === 'object' && response !== null && 'data' in response) {
        const dataObj = (response as { data?: unknown }).data;
        if (dataObj && typeof dataObj === 'object' && dataObj !== null && 'data' in dataObj) {
          return (dataObj as { data?: unknown }).data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error en getResponses:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [researchId, participantId]);

  // Función para guardar una nueva respuesta
  const saveResponse = useCallback(async (
    stepId: string,
    stepType: string,
    stepName: string,
    answer: unknown,
    moduleId?: string
  ) => {
    if (!researchId || !participantId || !stepId || !stepType) {
      const errorMsg = 'Datos inválidos para guardar respuesta (faltan IDs/tipo)';
      console.error(`❌ [useResponseAPI] ${errorMsg}:`, { researchId, participantId, stepId, stepType });
      setError(errorMsg);
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        researchId,
        participantId,
        stepId,
        stepType,
        stepTitle: stepName,
        response: answer,
        ...(moduleId ? { moduleId } : {})
      };

      const response = await apiClient.saveModuleResponse(payload);

      if (response.error || !response.data) {
        console.error('❌ [useResponseAPI] Error guardando respuesta:', response);
        setError(response.message || 'Error guardando respuesta');
        return null;
      }
      if (response && typeof response === 'object' && response !== null && 'data' in response) {
        const dataObj = (response as { data?: unknown }).data;
        if (dataObj && typeof dataObj === 'object' && dataObj !== null && 'data' in dataObj) {
          return (dataObj as { data?: unknown }).data;
        }
      }
      console.warn(`⚠️ [useResponseAPI] Unexpected response structure, returning null`);
      return null;
    } catch (error) {
      console.error('💥 [useResponseAPI] Exception in saveResponse:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [researchId, participantId]);

  // Ajuste en updateResponse para el linter
  const updateResponse = useCallback(async (responseId: string, answer: unknown) => {

    if (!researchId || !participantId || !responseId) {
      setError('Datos inválidos para actualizar respuesta (researchId, participantId, o responseId faltantes)');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payloadForBody = { response: answer };

      const response = await apiClient.updateModuleResponse(responseId, researchId, participantId, payloadForBody);

      if (response.error || !response.data) {
        console.error('Error actualizando respuesta:', response);
        setError(response.message || 'Error actualizando respuesta');
        return null;
      }

      if (response && typeof response === 'object' && response !== null && 'data' in response) {
        const dataObj = (response as { data?: unknown }).data;
        if (dataObj && typeof dataObj === 'object' && dataObj !== null && 'data' in dataObj) {
          return (dataObj as { data?: unknown }).data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error en updateResponse:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [researchId, participantId]);

  // Función para marcar respuestas como completadas
  const markAsCompleted = useCallback(async () => {
    if (!researchId || !participantId) {
      setError('ID de investigación o participante inválido');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.markResponsesAsCompleted(researchId, participantId);

      if (response.error || !response.data) {
        console.error('Error marcando respuestas como completadas:', response);
        setError(response.message || 'Error marcando respuestas como completadas');
        return null;
      }

      if (response && typeof response === 'object' && response !== null && 'data' in response) {
        const dataObj = (response as { data?: unknown }).data;
        if (dataObj && typeof dataObj === 'object' && dataObj !== null && 'data' in dataObj) {
          return (dataObj as { data?: unknown }).data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error en markAsCompleted:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [researchId, participantId]);

  // Función combinada para guardar o actualizar respuesta según corresponda
  const saveOrUpdateResponse = useCallback(async (
    stepId: string,
    stepType: string,
    stepName: string,
    answer: unknown,
    existingResponseId?: string,
    moduleId?: string,
  ) => {

    if (existingResponseId && existingResponseId.trim() !== '') {
      try {
        const result = await updateResponse(existingResponseId, answer);
        if (result !== null) {
          return result;
        }
      } catch (updateError) {
        console.log(`❌ [useResponseAPI] Update failed, trying save instead:`, updateError);
      }
      return saveResponse(stepId, stepType, stepName, answer, moduleId);
    } else {
      return saveResponse(stepId, stepType, stepName, answer, moduleId);
    }
  }, [saveResponse, updateResponse]);

  return {
    isLoading,
    error,
    setError,
    getResponses,
    saveResponse,
    updateResponse,
    markAsCompleted,
    saveOrUpdateResponse
  };
};

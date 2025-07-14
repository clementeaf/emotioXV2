import { useCallback, useState } from 'react';
import { ApiClient } from '../lib/api';
import { collectResponseMetadata } from '../utils/deviceInfo';

interface UseResponseAPIProps {
  researchId: string;
  participantId: string;
}

export const useResponseAPI = ({ researchId, participantId }: UseResponseAPIProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = new ApiClient();

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
  const saveResponse = async (
    stepId: string,
    stepType: string,
    responseData: unknown
  ): Promise<{ success: boolean; id?: string }> => {
    if (!researchId || !participantId || !stepId || !stepType) {
      const errorMsg = 'Datos inválidos para guardar respuesta (faltan IDs/tipo)';
      console.error(`❌ [useResponseAPI] ${errorMsg}:`, { researchId, participantId, stepId, stepType });
      setError(errorMsg);
      return { success: false };
    }
    setIsLoading(true);
    setError(null);
    try {
      // Recolectar metadata antes de enviar
      const metadata = await collectResponseMetadata();

      const payload = {
        researchId,
        participantId,
        stepId,
        stepType,
        stepTitle: (responseData as any)?.stepTitle || '', // Siempre string
        response: responseData,
        metadata,
        questionKey: (responseData as any)?.questionKey || stepId, // Usar questionKey real si existe
        ...(responseData as any)?.moduleId ? { moduleId: (responseData as any).moduleId } : {}
      };

      console.log(`🔑 [useResponseAPI] Guardando respuesta con questionKey: ${stepId}`, {
        stepId,
        stepType,
        questionKey: stepId,
        hasAnswer: responseData !== undefined && responseData !== null
      });

      const response = await apiClient.saveModuleResponse(payload);

      if (response.error || !response.data) {
        console.error('❌ [useResponseAPI] Error guardando respuesta:', response);
        setError(response.message || 'Error guardando respuesta');
        return { success: false };
      }
      if (response && typeof response === 'object' && response !== null && 'data' in response) {
        const dataObj = (response as { data?: unknown }).data;
        if (dataObj && typeof dataObj === 'object' && dataObj !== null && 'data' in dataObj) {
          const result = (dataObj as { data?: unknown }).data;
          return { success: true, id: result as string };
        }
      }
      console.warn(`⚠️ [useResponseAPI] Unexpected response structure, returning failure`);
      return { success: false };
    } catch (error) {
      console.error('💥 [useResponseAPI] Exception in saveResponse:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar una respuesta existente
  const updateResponse = useCallback(async (
    responseId: string,
    answer: unknown
  ): Promise<{ success: boolean; id?: string }> => {
    if (!researchId || !participantId || !responseId) {
      const errorMsg = 'Datos inválidos para actualizar respuesta (faltan IDs)';
      console.error(`❌ [useResponseAPI] ${errorMsg}:`, { researchId, participantId, responseId });
      setError(errorMsg);
      return { success: false };
    }
    setIsLoading(true);
    setError(null);
    try {
      const metadata = await collectResponseMetadata();

      const response = await apiClient.updateModuleResponse(
        responseId,
        researchId,
        participantId,
        {
          response: answer,
          metadata
        }
      );

      if (response.error || !response.data) {
        console.error('❌ [useResponseAPI] Error actualizando respuesta:', response);
        setError(response.message || 'Error actualizando respuesta');
        return { success: false };
      }
      if (response && typeof response === 'object' && response !== null && 'data' in response) {
        const dataObj = (response as { data?: unknown }).data;
        if (dataObj && typeof dataObj === 'object' && dataObj !== null && 'data' in dataObj) {
          const result = (dataObj as { data?: unknown }).data;
          return { success: true, id: result as string };
        }
      }
      return { success: false };
    } catch (error) {
      console.error('💥 [useResponseAPI] Exception in updateResponse:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return { success: false };
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
    answer: unknown,
    existingResponseId?: string
  ) => {

    if (existingResponseId && typeof existingResponseId === 'string' && existingResponseId.trim() !== '') {
      try {
        const result = await updateResponse(existingResponseId, answer);
        if (result.success) {
          return result;
        }
      } catch (updateError) {
        console.log(`❌ [useResponseAPI] Update failed, trying save instead:`, updateError);
      }
      return saveResponse(stepId, stepType, answer);
    } else {
      return saveResponse(stepId, stepType, answer);
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

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

interface UseResponseAPIProps {
  researchId: string;
  participantId: string;
}

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
      
      return response.data.data;
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
    answer: any,
    moduleId?: string,     
    onPostSuccess?: () => void 
  ) => {
    console.log('[useResponseAPI] saveResponse - Args:', { researchId, participantId, stepId, stepType, stepName, answer, moduleId });
    if (!researchId || !participantId || !stepId || !stepType) {
      setError('Datos inválidos para guardar respuesta (faltan IDs/tipo)');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload: any = {
        researchId,
        participantId,
        stepId,         
        stepType,
        stepTitle: stepName,
        response: answer
      };
      if (moduleId) { 
        payload.moduleId = moduleId;
      }
      const response = await apiClient.saveModuleResponse(payload);
      if (response.error || !response.data) {
        console.error('Error guardando respuesta:', response);
        setError(response.message || 'Error guardando respuesta');
        return null;
      }
      if (onPostSuccess) {
        onPostSuccess();
      }
      return response.data.data;
    } catch (error) {
      console.error('Error en saveResponse:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [researchId, participantId]);

  // Ajuste en updateResponse para el linter
  const updateResponse = useCallback(async (responseId: string, answer: any) => {
    console.log('[useResponseAPI] updateResponse - Args:', { researchId, participantId, responseId, answer });
    
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
      
      return response.data.data;
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
      
      return response.data.data;
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
    answer: any, 
    existingResponseId?: string,
    moduleId?: string, 
    onPostSuccess?: () => void
  ) => {
    if (existingResponseId) {
      return updateResponse(existingResponseId, answer);
    } else {
      return saveResponse(stepId, stepType, stepName, answer, moduleId, onPostSuccess);
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

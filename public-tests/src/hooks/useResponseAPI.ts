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
  const saveResponse = useCallback(async (stepId: string, stepType: string, stepName: string, answer: any) => {
    if (!researchId || !participantId || !stepId) {
      setError('Datos inválidos para guardar respuesta');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        researchId,
        participantId,
        stepType,
        stepTitle: stepName,
        response: answer
      };

      const response = await apiClient.saveModuleResponse(payload);
      
      if (response.error || !response.data) {
        console.error('Error guardando respuesta:', response);
        setError(response.message || 'Error guardando respuesta');
        return null;
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

  const updateResponse = useCallback(async (responseId: string, stepId: string, _stepType: string, stepName: string, answer: any) => {
    if (!researchId || !participantId || !responseId || !stepId) {
      setError('Datos inválidos para actualizar respuesta');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        response: answer 
      };

      const response = await apiClient.updateModuleResponse(responseId, researchId, participantId, payload);
      
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
    existingResponseId?: string
  ) => {
    if (existingResponseId) {
      return updateResponse(existingResponseId, stepId, stepType, stepName, answer);
    } else {
      return saveResponse(stepId, stepType, stepName, answer);
    }
  }, [saveResponse, updateResponse]);

  return {
    isLoading,
    error,
    getResponses,
    saveResponse,
    updateResponse,
    markAsCompleted,
    saveOrUpdateResponse
  };
};

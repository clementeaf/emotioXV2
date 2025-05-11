import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { ModuleResponse } from './useParticipantFlow';

interface UseResponseAPIProps {
  researchId: string;
  participantId: string;
}

export const useResponseAPI = ({ researchId, participantId }: UseResponseAPIProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener respuestas
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
      // Preparar payload según CreateModuleResponseDtoSchema
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

  // Función para actualizar una respuesta existente
  const updateResponse = useCallback(async (responseId: string, stepId: string, stepType: string, stepName: string, answer: any) => {
    if (!researchId || !participantId || !responseId || !stepId) {
      setError('Datos inválidos para actualizar respuesta');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Para actualizar, el backend (UpdateModuleResponseDtoSchema) solo espera el campo 'response' con el nuevo valor.
      // Los identificadores (researchId, participantId, responseId) se pasan por otros medios (query params o path params en el backend).
      const payload = {
        response: answer // El valor de la respuesta a actualizar
      };

      // apiClient.updateModuleResponse internamente debe construir la URL correcta con researchId y participantId si son necesarios
      // como query parameters para el endpoint de actualización. La firma del método en apiClient solo necesita responseId y el payload.
      // El controlador del backend para PUT /module-responses/{id} espera researchId y participantId como query params, y responseId en el path.
      // La función apiClient.updateModuleResponse debe estar construyendo esa URL correctamente.
      const response = await apiClient.updateModuleResponse(responseId, payload);
      
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

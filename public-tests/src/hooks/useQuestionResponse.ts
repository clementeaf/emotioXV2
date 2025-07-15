import { useCallback, useEffect, useState } from 'react';
import { useResponsesStore } from '../stores/useResponsesStore';

interface UseQuestionResponseProps {
  questionKey: string;
  stepType: string;
  stepTitle: string;
  onResponseChange?: (response: unknown) => void;
}

interface UseQuestionResponseReturn {
  // Estado de la respuesta
  response: unknown;
  hasResponse: boolean;
  hasBackendResponse: boolean; // NUEVO: Indica si la respuesta fue enviada al backend
  isLoading: boolean;
  error: string | null;

  // Métodos para manejar la respuesta
  saveResponse: (response: unknown) => Promise<boolean>;
  updateResponse: (response: unknown) => Promise<boolean>;
  deleteResponse: () => Promise<boolean>;
  clearResponse: () => void;
  markAsBackendSent: () => void; // NUEVO: Marcar como enviado al backend

  // Estado del formulario
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

export const useQuestionResponse = ({
  questionKey,
  stepType,
  stepTitle,
  onResponseChange
}: UseQuestionResponseProps): UseQuestionResponseReturn => {
  const [response, setResponse] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [hasBackendResponse, setHasBackendResponse] = useState(false); // NUEVO: Estado para respuestas del backend

  const {
    saveLocalResponse,
    getLocalResponse,
    hasLocalResponse,
    updateLocalResponse,
    deleteLocalResponse
  } = useResponsesStore();

  // Cargar respuesta existente al montar el componente
  useEffect(() => {
    const loadExistingResponse = () => {
      const existingResponse = getLocalResponse(questionKey);
      if (existingResponse) {
        setResponse(existingResponse.response);
        // NUEVO: Si hay respuesta local, asumir que fue enviada al backend
        setHasBackendResponse(true);
        console.log(`[useQuestionResponse] ✅ Respuesta cargada localmente: ${questionKey}`);
      }
    };

    loadExistingResponse();
  }, [questionKey, getLocalResponse]);

  const saveResponse = useCallback(async (newResponse: unknown): Promise<boolean> => {
    if (!questionKey) {
      console.error('[useQuestionResponse] ❌ questionKey requerido');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Guardar localmente
      saveLocalResponse(questionKey, newResponse, stepType, stepTitle);

      // Actualizar estado local
      setResponse(newResponse);
      setIsDirty(false);
      setHasBackendResponse(false); // NUEVO: Aún no enviado al backend

      // Notificar cambio si hay callback
      if (onResponseChange) {
        onResponseChange(newResponse);
      }

      console.log(`[useQuestionResponse] ✅ Respuesta guardada localmente: ${questionKey}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      console.error(`[useQuestionResponse] ❌ Error guardando respuesta: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [questionKey, stepType, stepTitle, saveLocalResponse, onResponseChange]);

  const updateResponse = useCallback(async (newResponse: unknown): Promise<boolean> => {
    if (!questionKey) {
      console.error('[useQuestionResponse] ❌ questionKey requerido');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Actualizar localmente
      updateLocalResponse(questionKey, newResponse);

      // Actualizar estado local
      setResponse(newResponse);
      setIsDirty(false);
      setHasBackendResponse(false); // NUEVO: Aún no enviado al backend

      // Notificar cambio si hay callback
      if (onResponseChange) {
        onResponseChange(newResponse);
      }

      console.log(`[useQuestionResponse] ✅ Respuesta actualizada localmente: ${questionKey}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      console.error(`[useQuestionResponse] ❌ Error actualizando respuesta: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [questionKey, updateLocalResponse, onResponseChange]);

  const deleteResponse = useCallback(async (): Promise<boolean> => {
    if (!questionKey) {
      console.error('[useQuestionResponse] ❌ questionKey requerido');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Eliminar localmente
      deleteLocalResponse(questionKey);

      // Limpiar estado local
      setResponse(null);
      setIsDirty(false);
      setHasBackendResponse(false); // NUEVO: Resetear estado

      // Notificar cambio si hay callback
      if (onResponseChange) {
        onResponseChange(null);
      }

      console.log(`[useQuestionResponse] ✅ Respuesta eliminada: ${questionKey}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      console.error(`[useQuestionResponse] ❌ Error eliminando respuesta: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [questionKey, deleteLocalResponse, onResponseChange]);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setIsDirty(false);
    setError(null);
    setHasBackendResponse(false); // NUEVO: Resetear estado
  }, []);

  // NUEVO: Método para marcar como enviado al backend
  const markAsBackendSent = useCallback(() => {
    setHasBackendResponse(true);
    console.log(`[useQuestionResponse] ✅ Marcado como enviado al backend: ${questionKey}`);
  }, [questionKey]);

  return {
    response,
    hasResponse: hasLocalResponse(questionKey),
    hasBackendResponse, // NUEVO: Retornar el estado
    isLoading,
    error,
    saveResponse,
    updateResponse,
    deleteResponse,
    clearResponse,
    markAsBackendSent, // NUEVO: Retornar el método
    isDirty,
    setIsDirty
  };
};

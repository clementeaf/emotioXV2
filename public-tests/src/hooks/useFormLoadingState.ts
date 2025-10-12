import { useCallback, useEffect, useState } from 'react';
import { useTestStore } from '../stores/useTestStore';
import { useModuleResponsesQuery } from './useApiQueries';
import { useFormDataStore } from '../stores/useFormDataStore';

interface UseFormLoadingStateProps {
  questionKey: string;
  onDataLoaded?: (data: Record<string, unknown>) => void;
}

interface UseFormLoadingStateReturn {
  isLoading: boolean;
  hasLoadedData: boolean;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
  handleInputChange: (key: string, value: unknown) => void;
  saveToStore: (data: Record<string, unknown>) => void;
}

export const useFormLoadingState = ({
  questionKey,
  onDataLoaded
}: UseFormLoadingStateProps): UseFormLoadingStateReturn => {
  // 🎯 USAR SOLO BACKEND - NO STORE LOCAL
  const { researchId, participantId } = useTestStore();
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Query para obtener respuestas existentes del backend
  const { data: moduleResponses, isLoading: isLoadingResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // 🎯 ESTABILIZAR LA FUNCIÓN DE CALLBACK
  const stableOnDataLoaded = useCallback((data: Record<string, unknown>) => {
    if (onDataLoaded) {
      onDataLoaded(data);
    }
  }, [onDataLoaded]);

  // 🎯 NO RESETEAR FORMVALUES - Mantener datos del usuario
  useEffect(() => {
    setHasLoadedData(false);
    setIsLoading(true);
    // NO resetear formValues para mantener datos del usuario
  }, [questionKey]);

  useEffect(() => {
    // Solo procesar si ya no estamos cargando las respuestas
    if (isLoadingResponses) {
      return;
    }

    // Buscar respuesta existente para este questionKey en el backend
    if (moduleResponses?.responses && Array.isArray(moduleResponses.responses)) {
      const existingResponse = moduleResponses.responses.find(
        (response) => response.questionKey === questionKey
      );

      if (existingResponse?.response) {
        setFormValues(existingResponse.response as Record<string, unknown>);
        setHasLoadedData(true);
        setIsLoading(false);

        // Callback opcional cuando se cargan los datos
        stableOnDataLoaded(existingResponse.response as Record<string, unknown>);
        return;
      }
    }

    // 🎯 SOLO BACKEND - NO STORE LOCAL
    // Si no hay datos en el backend, no cargar nada

    setIsLoading(false);
  }, [moduleResponses, isLoadingResponses, questionKey, stableOnDataLoaded]);

  const handleInputChange = useCallback((key: string, value: unknown) => {
    setFormValues(prevValues => {
      const newValues = {
        ...prevValues,
        [key]: value
      };
      return newValues;
    });
  }, []);

  // 🚨 USEEFFECT ELIMINADO: Causaba race condition donde datos del step anterior
  // se guardaban con la key del step actual. El guardado ahora se maneja
  // explícitamente a través de saveToStore() y handleInputChange()

  const saveToStore = useCallback((data: Record<string, unknown>) => {
    // 💾 Actualizar estado local inmediatamente
    setFormValues(prevValues => {
      const newLocalValues = {
        ...prevValues,
        ...data
      };
      return newLocalValues;
    });
    
    // 💾 Diferir actualización del FormDataStore global para evitar setState durante render
    setTimeout(() => {
      const { setFormData } = useFormDataStore.getState();
      const { getFormData } = useFormDataStore.getState();
      const currentFormData = getFormData(questionKey) || {};
      
      const newGlobalData = {
        ...currentFormData,
        ...data
      };
      
      setFormData(questionKey, newGlobalData);
    }, 0);
  }, [questionKey]);

  return {
    isLoading: isLoading || isLoadingResponses,
    hasLoadedData,
    formValues,
    setFormValues,
    handleInputChange,
    saveToStore
  };
};

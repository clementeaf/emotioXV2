import { useCallback, useEffect, useState } from 'react';
import { useFormDataStore } from '../stores/useFormDataStore';
import { useTestStore } from '../stores/useTestStore';
import { useModuleResponsesQuery } from './useApiQueries';

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
  const { setFormData, getFormData } = useFormDataStore();
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

  // 🎯 RESET SUAVE DEL ESTADO CUANDO CAMBIA LA PREGUNTA (NO LIMPIAR STORE)
  useEffect(() => {
    setFormValues({});
    setHasLoadedData(false);
    setIsLoading(true);
    console.log('[useFormLoadingState] 🔄 Reset suave para question:', questionKey);
  }, [questionKey]);

  useEffect(() => {
    // Solo procesar si ya no estamos cargando las respuestas
    if (isLoadingResponses) {
      return;
    }

    // Buscar respuesta existente para este questionKey en el backend
    if (moduleResponses?.responses && Array.isArray(moduleResponses.responses)) {
      const existingResponse = (moduleResponses.responses as any[]).find(
        (response: any) => response.questionKey === questionKey
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

    // Si no hay datos en el backend, cargar del store local
    const existingData = getFormData(questionKey);
    if (existingData && Object.keys(existingData).length > 0) {
      setFormValues(existingData as Record<string, unknown>);
      setHasLoadedData(true);

      // Callback opcional cuando se cargan los datos
      stableOnDataLoaded(existingData as Record<string, unknown>);
    }

    setIsLoading(false);
  }, [moduleResponses, isLoadingResponses, questionKey, stableOnDataLoaded]);

  const handleInputChange = useCallback((key: string, value: unknown) => {
    setFormValues(prevValues => {
      const newValues = {
        ...prevValues,
        [key]: value
      };

      // Guardar en el store después del render para evitar setState durante render
      setTimeout(() => {
        setFormData(questionKey, newValues);
      }, 0);

      return newValues;
    });
  }, [questionKey, setFormData]);

  // 🚨 USEEFFECT ELIMINADO: Causaba race condition donde datos del step anterior
  // se guardaban con la key del step actual. El guardado ahora se maneja
  // explícitamente a través de saveToStore() y handleInputChange()

  const saveToStore = useCallback((data: Record<string, unknown>) => {
    // 🎯 VALIDACIÓN: Solo guardar si los datos son válidos y no están vacíos
    if (data && Object.keys(data).length > 0) {
      // Usar setTimeout para evitar setState durante render
      setTimeout(() => {
        setFormData(questionKey, data);
      }, 0);
    }
  }, [questionKey, setFormData]);

  return {
    isLoading: isLoading || isLoadingResponses,
    hasLoadedData,
    formValues,
    setFormValues,
    handleInputChange,
    saveToStore
  };
};

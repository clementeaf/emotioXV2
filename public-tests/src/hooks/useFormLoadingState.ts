import { useCallback, useEffect, useState } from 'react';
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

  // 🎯 RESET SUAVE DEL ESTADO CUANDO CAMBIA LA PREGUNTA (NO LIMPIAR STORE)
  useEffect(() => {
    setFormValues({});
    setHasLoadedData(false);
    setIsLoading(true);
    // Reset logging removido
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

      // 🎯 NO GUARDAR EN STORE LOCAL - Solo en estado local temporal
      return newValues;
    });
  }, []);

  // 🚨 USEEFFECT ELIMINADO: Causaba race condition donde datos del step anterior
  // se guardaban con la key del step actual. El guardado ahora se maneja
  // explícitamente a través de saveToStore() y handleInputChange()

  const saveToStore = useCallback((data: Record<string, unknown>) => {
    // 🎯 NO GUARDAR EN STORE LOCAL - Solo actualizar estado local
    console.log('[useFormLoadingState] 🔍 saveToStore llamado:', {
      questionKey,
      data,
      currentFormValues: formValues,
      newData: data
    });
    setFormValues(data);
  }, [questionKey, formValues]);

  return {
    isLoading: isLoading || isLoadingResponses,
    hasLoadedData,
    formValues,
    setFormValues,
    handleInputChange,
    saveToStore
  };
};

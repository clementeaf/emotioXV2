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

  // 🎯 RESET COMPLETO DEL ESTADO CUANDO CAMBIA LA PREGUNTA
  useEffect(() => {
    console.log(`[useFormLoadingState] 🔄 Cambiando questionKey a: ${questionKey}`);
    
    // 🚨 LIMPIAR DATOS LOCALES PREVIOS PARA EVITAR CONTAMINACIÓN CRUZADA
    const { clearFormData } = useFormDataStore.getState();
    
    // 🎯 OBTENER LISTA DE TODOS LOS QUESTION KEYS PERSISTIDOS
    try {
      const localStorageKey = 'emotio-form-data';
      const existingData = localStorage.getItem(localStorageKey);
      if (existingData) {
        const parsed = JSON.parse(existingData);
        if (parsed.state && parsed.state.formData) {
          // 🎯 LIMPIAR SOLO LAS KEYS QUE NO SEAN LA ACTUAL
          Object.keys(parsed.state.formData).forEach(key => {
            if (key !== questionKey) {
              console.log(`[useFormLoadingState] 🧹 Limpiando datos residuales de: ${key}`);
              clearFormData(key);
            }
          });
        }
      }
    } catch (error) {
      console.warn('[useFormLoadingState] Error limpiando datos residuales:', error);
    }
    
    setFormValues({});
    setHasLoadedData(false);
    setIsLoading(true);
  }, [questionKey]);

  useEffect(() => {
    // Solo procesar si ya no estamos cargando las respuestas
    if (isLoadingResponses) {
      return;
    }

    console.log(`[useFormLoadingState] 🔄 Procesando datos para ${questionKey}:`, {
      hasModuleResponses: !!moduleResponses,
      responsesCount: moduleResponses?.responses?.length || 0,
      isLoadingResponses
    });

    // Buscar respuesta existente para este questionKey en el backend
    if (moduleResponses?.responses && Array.isArray(moduleResponses.responses)) {
      const existingResponse = (moduleResponses.responses as any[]).find(
        (response: any) => response.questionKey === questionKey
      );

      if (existingResponse?.responses?.[0]?.response) {
        console.log(`[useFormLoadingState] ✅ Datos encontrados en backend para ${questionKey}:`, existingResponse.responses[0].response);
        setFormValues(existingResponse.responses[0].response as Record<string, unknown>);
        setHasLoadedData(true);
        setIsLoading(false);

        // Callback opcional cuando se cargan los datos
        stableOnDataLoaded(existingResponse.responses[0].response as Record<string, unknown>);
        return;
      }
    }

    // Si no hay datos en el backend, cargar del store local
    const existingData = getFormData(questionKey);
    if (existingData && Object.keys(existingData).length > 0) {
      console.log(`[useFormLoadingState] ✅ Datos encontrados en store local para ${questionKey}:`, existingData);
      setFormValues(existingData as Record<string, unknown>);
      setHasLoadedData(true);

      // Callback opcional cuando se cargan los datos
      stableOnDataLoaded(existingData as Record<string, unknown>);
    } else {
      console.log(`[useFormLoadingState] ℹ️ No hay datos previos para ${questionKey}, formulario vacío`);
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
    console.log(`[useFormLoadingState] 💾 saveToStore llamado para ${questionKey}:`, data);
    
    // 🎯 VALIDACIÓN: Solo guardar si los datos son válidos y no están vacíos
    if (data && Object.keys(data).length > 0) {
      // Usar setTimeout para evitar setState durante render
      setTimeout(() => {
        setFormData(questionKey, data);
        console.log(`[useFormLoadingState] ✅ Datos guardados exitosamente para ${questionKey}`);
      }, 0);
    } else {
      console.log(`[useFormLoadingState] ⚠️ Datos vacíos o inválidos, no se guardará para ${questionKey}`);
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

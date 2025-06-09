import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { useResponseAPI } from './useResponseAPI';
import { useModuleResponses } from './useModuleResponses';
import { 
  StandardizedFormProps, 
  ValidationRule, 
  StandardizedFormState, 
  StandardizedFormActions, 
  UseStandardizedFormOptions 
} from '../types/hooks.types';

// 🚨 NUEVO: Helper para persistir user interaction entre re-mounts
const USER_INTERACTION_KEY_PREFIX = 'user_interaction_';

function getUserInteractionKey(stepId: string, stepType: string): string {
  return `${USER_INTERACTION_KEY_PREFIX}${stepId}_${stepType}`;
}

function hasUserInteracted(stepId: string, stepType: string): boolean {
  try {
    const key = getUserInteractionKey(stepId, stepType);
    return sessionStorage.getItem(key) === 'true';
  } catch (e) {
    return false;
  }
}

function setUserInteracted(stepId: string, stepType: string): void {
  try {
    const key = getUserInteractionKey(stepId, stepType);
    sessionStorage.setItem(key, 'true');
  } catch (e) {
    console.warn('[useStandardizedForm] Could not persist user interaction:', e);
  }
}

function clearUserInteraction(stepId: string, stepType: string): void {
  try {
    const key = getUserInteractionKey(stepId, stepType);
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn('[useStandardizedForm] Could not clear user interaction:', e);
  }
}

export function useStandardizedForm<T>(
  props: StandardizedFormProps,
  options: UseStandardizedFormOptions<T>
): [StandardizedFormState<T>, StandardizedFormActions<T>] {
  
  const {
    stepId,
    stepType,
    stepName,
    researchId: propResearchId,
    participantId: propParticipantId,
    savedResponse,
    savedResponseId,
    required = false,
    isMock = false
  } = props;

  const {
    initialValue,
    extractValueFromResponse,
    validationRules = [],
    enableAutoSave = false,
    moduleId
  } = options;
  const researchIdFromStore = useParticipantStore(state => state.researchId);
  const participantIdFromStore = useParticipantStore(state => state.participantId);  
  const researchId = propResearchId || researchIdFromStore;
  const participantId = propParticipantId || participantIdFromStore;
  const [value, setValueInternal] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(savedResponseId || null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const userHasInteracted = useRef<boolean>(hasUserInteracted(stepId, stepType));
  const initialLoadComplete = useRef<boolean>(false);
  
  useEffect(() => {
    const persistedInteraction = hasUserInteracted(stepId, stepType);
    if (persistedInteraction) {
      userHasInteracted.current = true;
    }
  }, [stepId, stepType]);

  const {
    saveOrUpdateResponse,
    isLoading: isSaving,
    error: apiError,
    setError: setApiError
  } = useResponseAPI({ researchId: researchId || '', participantId: participantId || '' });

  const {
    data: moduleResponsesArray,
    isLoading: isLoadingResponses,
    error: loadingError,
    fetchResponses
  } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId && !isMock)
  });

  // Enhanced setValue with logging and user interaction tracking
  const setValue = useCallback((newValue: T, isUserInteraction: boolean = false) => {
    if (value !== newValue) {
      if (isUserInteraction) {
        userHasInteracted.current = true;
        setUserInteracted(stepId, stepType);
      }
      
      setValueInternal(newValue);
    }
  }, [value, stepId, stepType]);

  // Extract previous value from saved response
  const extractedValue = useMemo(() => {
    if (savedResponse?.response) {
      try {
        return extractValueFromResponse(savedResponse.response);
      } catch (err) {
        console.warn('[useStandardizedForm] Error extracting value from saved response:', err);
      }
    }
    return initialValue;
  }, [savedResponse, extractValueFromResponse, initialValue]);

  useEffect(() => {
    if (initialLoadComplete.current) {
      return;
    }
    
    if (userHasInteracted.current && isDataLoaded && value !== initialValue) {
      initialLoadComplete.current = true;
      return;
    }
    
    if (isDataLoaded && value !== initialValue) {
      initialLoadComplete.current = true;
      return;
    }

    if (isMock) {
      setValue(savedResponse ? extractedValue : initialValue, false);
      setIsDataLoaded(true);
      setHasExistingData(!!savedResponse);
      initialLoadComplete.current = true;
      return;
    }

    // Handle saved response (from props)
    if (savedResponse) {
      setValue(extractedValue, false);
      setIsDataLoaded(true);
      setHasExistingData(true);
      initialLoadComplete.current = true;
      return;
    }

    // Wait for API responses to load
    if (isLoadingResponses) {
      return; // Still loading, don't set anything yet
    }

    // Check for API response (PRIORITY #1)
    if (!loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const response = r as { stepType?: string; stepId?: string; id?: string };
        
        // 🚨 ARREGLADO: Búsqueda más flexible que maneja stepTypes como 'smartvoc_csat'
        return (
          response.stepType === stepType ||
          response.stepId === stepId ||
          (response.stepType && stepType && response.stepType.includes(stepType)) ||
          (response.stepType && stepType && stepType.includes(response.stepType)) ||
          (response.stepId && stepId && response.stepId.includes(stepId))
        );
      });

      if (foundResponse) {
        const foundResp = foundResponse as { response?: unknown; id?: string };
        try {
          const extractedVal = extractValueFromResponse(foundResp.response);
          setValue(extractedVal, false);
          setResponseId(foundResp.id || null);
          setHasExistingData(true);
          setIsDataLoaded(true);
          initialLoadComplete.current = true;
          
          try {
            const localStorageKey = `response_${stepId}`;
            if (localStorage.getItem(localStorageKey)) {
              localStorage.removeItem(localStorageKey);
            }
          } catch (e) {
            console.warn('[useStandardizedForm] Error cleaning localStorage:', e);
          }
          
          return;
        } catch (err) {
          console.warn('[useStandardizedForm] Error extracting value from API response:', err);
        }
      }
    }
    setValue(initialValue, false);
    setHasExistingData(false);
    setIsDataLoaded(true);
    initialLoadComplete.current = true;
    
  }, [
    isMock, 
    savedResponse, 
    isLoadingResponses, 
    loadingError, 
    moduleResponsesArray, 
    stepType, 
    stepId, 
    initialValue,
    extractValueFromResponse,
    extractedValue,
    isDataLoaded
    // setValue REMOVIDO para evitar re-ejecuciones no deseadas
  ]);

  // Validation
  const validateValue = useCallback((valueToValidate: T): string | null => {
    // Required validation
    if (required) {
      if (valueToValidate === null || valueToValidate === undefined) {
        return 'Este campo es obligatorio.';
      }
      if (typeof valueToValidate === 'string' && valueToValidate.trim() === '') {
        return 'Este campo es obligatorio.';
      }
      if (Array.isArray(valueToValidate) && valueToValidate.length === 0) {
        return 'Debe seleccionar al menos una opción.';
      }
    }

    // Custom validation rules
    for (const rule of validationRules) {
      if (!rule.validate(valueToValidate)) {
        return rule.message;
      }
    }

    return null;
  }, [required, validationRules]);

  // Save response
  const saveResponse = useCallback(async (valueToSave?: T): Promise<{ success: boolean; data?: unknown }> => {
    const finalValue = valueToSave !== undefined ? valueToSave : value;
    
    if (!researchId || !participantId) {
      const errorMsg = 'ID de investigación o participante no disponible.';
      console.error(`❌ [useStandardizedForm] Missing IDs:`, { researchId, participantId });
      setError(errorMsg);
      return { success: false };
    }

    if (isMock) {
      return { success: true, data: { value: finalValue } };
    }

    const validationError = validateValue(finalValue);
    if (validationError) {
      console.error(`❌ [useStandardizedForm] Validation error:`, validationError);
      setError(validationError);
      return { success: false };
    }

    setError(null);
    setApiError(null);

    try {
      
      const result = await saveOrUpdateResponse(
        stepId,
        stepType,
        stepName || stepId,
        finalValue,
        responseId || undefined,
        moduleId
      );

      if (apiError) {
        console.error(`❌ [useStandardizedForm] API Error after save:`, apiError);
        setError(apiError);
        return { success: false };
      }

      if (result && typeof result === 'object' && result !== null && 'id' in result && !responseId) {
        const newId = (result as { id: string }).id;
        setResponseId(newId);
        setHasExistingData(true);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al guardar.';
      console.error(`💥 [useStandardizedForm] Exception during save:`, err);
      setError(errorMsg);
      return { success: false };
    }
  }, [
    value,
    researchId,
    participantId,
    isMock,
    validateValue,
    saveOrUpdateResponse,
    stepId,
    stepType,
    stepName,
    responseId,
    moduleId,
    apiError,
    setApiError,
    fetchResponses
  ]);

  // Validate and save
  const validateAndSave = useCallback(async (valueToSave?: T): Promise<{ success: boolean; data?: unknown }> => {
    const finalValue = valueToSave !== undefined ? valueToSave : value;
    const validationError = validateValue(finalValue);
    
    if (validationError) {
      console.error(`❌ [useStandardizedForm] validateAndSave validation error:`, validationError);
      setError(validationError);
      return { success: false };
    }
    
    return saveResponse(finalValue);
  }, [value, validateValue, saveResponse]);

  // Auto-save effect
  useEffect(() => {
    if (enableAutoSave && isDataLoaded && !isSaving && !isMock) {
      const validationError = validateValue(value);
      if (!validationError) {
        saveResponse(value);
      }
    }
  }, [enableAutoSave, isDataLoaded, isSaving, isMock, value, validateValue, saveResponse]);

  // Clear error when value changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [value, error]);

  // Actions
  const actions: StandardizedFormActions<T> = {
    setValue,
    setError,
    clearError: () => setError(null),
    saveResponse,
    validateAndSave,
    reset: () => {
      setValue(initialValue, false);
      setError(null);
      setResponseId(null);
      setHasExistingData(false);
      setIsDataLoaded(false);
      userHasInteracted.current = false;
      initialLoadComplete.current = false;
      if (stepId) {
        clearUserInteraction(stepId, stepType);
      }
    }
  };

  // State
  const state: StandardizedFormState<T> = {
    value,
    isLoading: isLoadingResponses,
    isSaving,
    isDataLoaded,
    error: error || apiError || loadingError || null,
    responseId,
    hasExistingData
  };

  return [state, actions];
}

// 🚨 NUEVO: Export utility functions para uso externo si es necesario
export const userInteractionUtils = {
  hasUserInteracted,
  setUserInteracted,
  clearUserInteraction,
  // Limpiar todas las interacciones (útil para debugging/testing)
  clearAllUserInteractions: () => {
    try {
      const keys = Object.keys(sessionStorage);
      const interactionKeys = keys.filter(key => key.startsWith(USER_INTERACTION_KEY_PREFIX));
      interactionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      console.warn('[userInteractionUtils] Error clearing all interactions:', e);
    }
  }
};

// Utility functions for common value extractors
export const valueExtractors = {
  // For simple numeric scales (CSAT, NPS, Linear Scale)
  numericScale: (response: unknown): number | null => {
    if (typeof response === 'number') return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      
      // Handle DynamoDB format {"N": "4"}
      if ('N' in obj && typeof obj.N === 'string') {
        const parsed = parseInt(obj.N, 10);
        if (!isNaN(parsed)) return parsed;
      }
      
      // Handle standard format {"value": 4}
      if ('value' in obj && typeof obj.value === 'number') return obj.value;
      
      // Handle nested structures
      if ('data' in obj && typeof obj.data === 'object' && obj.data !== null) {
        const dataObj = obj.data as Record<string, unknown>;
        if ('response' in dataObj && typeof dataObj.response === 'object' && dataObj.response !== null) {
          const innerResp = dataObj.response as Record<string, unknown>;
          if ('value' in innerResp && typeof innerResp.value === 'number') return innerResp.value;
        }
        if ('value' in dataObj && typeof dataObj.value === 'number') return dataObj.value;
      }
    }
    return null;
  },

  // For text responses (short/long text)
  textValue: (response: unknown): string => {
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      if ('value' in obj && typeof obj.value === 'string') return obj.value;
      if ('text' in obj && typeof obj.text === 'string') return obj.text;
      if ('questionId' in obj && 'value' in obj && typeof obj.value === 'string') return obj.value;
    }
    return '';
  },

  // For single choice responses
  singleChoice: (response: unknown): string | null => {
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      if ('value' in obj && typeof obj.value === 'string') return obj.value;
      if ('choice' in obj && typeof obj.choice === 'string') return obj.choice;
    }
    return null;
  },

  // For multiple choice responses
  multipleChoice: (response: unknown): unknown[] => {
    if (Array.isArray(response)) return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      if ('values' in obj && Array.isArray(obj.values)) return obj.values;
      if ('choices' in obj && Array.isArray(obj.choices)) return obj.choices;
    }
    return [];
  },

  // For ranking responses
  ranking: (response: unknown): string[] => {
    if (Array.isArray(response) && response.every(item => typeof item === 'string')) {
      return response as string[];
    }
    return [];
  }
};

// Common validation rules
export const validationRules = {
  required: <T>(message = 'Este campo es obligatorio.'): ValidationRule<T> => ({
    validate: (value: T) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length >= min,
    message: message || `Debe tener al menos ${min} caracteres.`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length <= max,
    message: message || `No puede exceder ${max} caracteres.`
  }),

  minSelections: <T>(min: number, message?: string): ValidationRule<T[]> => ({
    validate: (value: T[]) => value.length >= min,
    message: message || `Debe seleccionar al menos ${min} opciones.`
  }),

  maxSelections: <T>(max: number, message?: string): ValidationRule<T[]> => ({
    validate: (value: T[]) => value.length <= max,
    message: message || `No puede seleccionar más de ${max} opciones.`
  }),

  range: (min: number, max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min && value <= max,
    message: message || `El valor debe estar entre ${min} y ${max}.`
  })
}; 
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import {
  StandardizedFormActions,
  StandardizedFormProps,
  StandardizedFormState,
  UseStandardizedFormOptions,
  ValidationRule
} from '../types/hooks.types';
import { useModuleResponses } from './useModuleResponses';
import { useResponseAPI } from './useResponseAPI';

const USER_INTERACTION_KEY_PREFIX = 'user_interaction_';
const CACHE_VERSION_KEY = 'form_cache_version';
const CURRENT_CACHE_VERSION = '2.0.0';

function invalidateOldCache(): void {
  try {
    const storedVersion = sessionStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== CURRENT_CACHE_VERSION) {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(USER_INTERACTION_KEY_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });

      sessionStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }
  } catch (e) {
    console.warn('[useStandardizedForm] Error during cache invalidation:', e);
  }
}

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

  useEffect(() => {
    invalidateOldCache();
  }, []);

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
    refetch: fetchResponses
  } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId && !isMock)
  });

  const setValue = useCallback((newValue: T, isUserInteraction: boolean = false) => {
    if (value !== newValue) {
      if (isUserInteraction) {
        userHasInteracted.current = true;
        setUserInteracted(stepId, stepType);
      }

      setValueInternal(newValue);
    }
  }, [value, stepId, stepType]);

  const extractedValue = useMemo(() => {
    if (savedResponse) {
      try {
        if (typeof savedResponse === 'string') {
          return extractValueFromResponse(savedResponse);
        }

        if (typeof savedResponse === 'object' && savedResponse !== null && 'response' in savedResponse) {
          return extractValueFromResponse((savedResponse as { response: unknown }).response);
        }

        return extractValueFromResponse(savedResponse);
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

    if (savedResponse) {
      setValue(extractedValue, false);
      setIsDataLoaded(true);
      setHasExistingData(true);
      initialLoadComplete.current = true;
      return;
    }

    if (isLoadingResponses) {
      return;
    }

    if (!loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const response = r as { stepType?: string; stepId?: string; stepTitle?: string; id?: string };

        return response.stepType === stepType && response.stepTitle === stepName;
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
    stepName,
    initialValue,
    extractValueFromResponse,
    extractedValue,
    isDataLoaded
  ]);

  const validateValue = useCallback((valueToValidate: T): string | null => {
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

    for (const rule of validationRules) {
      if (!rule.validate(valueToValidate)) {
        return rule.message;
      }
    }

    return null;
  }, [required, validationRules]);

  const saveResponse = useCallback(async (valueToSave?: T): Promise<{ success: boolean; error: string | null; data: unknown | null }> => {
    const finalValue = valueToSave !== undefined ? valueToSave : value;

    if (!researchId || !participantId) {
      const errorMsg = 'ID de investigación o participante no disponible.';
      console.error(`❌ [useStandardizedForm] Missing IDs:`, { researchId, participantId });
      setError(errorMsg);
      return { success: false, error: errorMsg, data: null };
    }

    if (isMock) {
      return { success: true, data: { value: finalValue }, error: null };
    }

    const validationError = validateValue(finalValue);
    if (validationError) {
      console.error(`❌ [useStandardizedForm] Validation error:`, validationError);
      setError(validationError);
      return { success: false, error: validationError, data: null };
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

      if (result === null || result === undefined) {
        console.error(`❌ [useStandardizedForm] API Error: saveOrUpdateResponse returned null. Check useResponseAPI logs.`);
        const finalError = apiError || 'Error desconocido durante el guardado en la API.';
        if (!apiError) {
          setError(finalError);
        }
        return { success: false, error: finalError, data: null };
      }

      if (result && typeof result === 'object' && 'id' in result && !responseId) {
        const newId = (result as { id: string }).id;
        setResponseId(newId);
        setHasExistingData(true);
      }

      if (fetchResponses) {
        fetchResponses();
      }

      return { success: true, data: result, error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al guardar.';
      console.error(`💥 [useStandardizedForm] Exception during save:`, err);
      setError(errorMsg);
      return { success: false, error: errorMsg, data: null };
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

  const validateAndSave = useCallback(async (valueToSave?: T): Promise<{ success: boolean; error: string | null; data: unknown | null }> => {
    const finalValue = valueToSave !== undefined ? valueToSave : value;
    const validationError = validateValue(finalValue);

    if (validationError) {
      console.error(`❌ [useStandardizedForm] validateAndSave validation error:`, validationError);
      setError(validationError);
      return { success: false, error: validationError, data: null };
    }

    return saveResponse(finalValue);
  }, [value, validateValue, saveResponse]);

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

  const refetch = useCallback(() => {
    if (researchId && participantId && !isMock) {
      fetchResponses();
    }
  }, [researchId, participantId, isMock, fetchResponses]);

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
    },

    forceRefresh: () => {
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

      if (fetchResponses && researchId && participantId) {
        fetchResponses();
      }
    },
    refetch
  };

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

export const userInteractionUtils = {
  hasUserInteracted,
  setUserInteracted,
  clearUserInteraction,
  clearAllUserInteractions: () => {
    try {
      const keys = Object.keys(sessionStorage);
      const interactionKeys = keys.filter(key => key.startsWith(USER_INTERACTION_KEY_PREFIX));
      interactionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      console.warn('[userInteractionUtils] Error clearing all interactions:', e);
    }
  },
  nukeAllFormData: () => {
    try {

      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith(USER_INTERACTION_KEY_PREFIX) ||
            key === CACHE_VERSION_KEY ||
            key.includes('form_') ||
            key.includes('response_')) {
          sessionStorage.removeItem(key);
        }
      });

      sessionStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);

      if (typeof window !== 'undefined') {
        alert('🧹 Datos de formulario limpiados. Por favor, recarga la página para empezar desde cero.');
      }

    } catch (e) {
      console.error('[userInteractionUtils] Error during nuclear reset:', e);
    }
  }
};

export const valueExtractors = {
  numericScale: (response: unknown): number | null => {
    if (typeof response === 'number') return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;

      if ('N' in obj && typeof obj.N === 'string') {
        const parsed = parseInt(obj.N, 10);
        if (!isNaN(parsed)) return parsed;
      }

      if ('value' in obj && typeof obj.value === 'number') return obj.value;

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

  singleChoice: (response: unknown): string | null => {
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      if ('value' in obj && typeof obj.value === 'string') return obj.value;
      if ('choice' in obj && typeof obj.choice === 'string') return obj.choice;
    }
    return null;
  },
  multipleChoice: (response: unknown): unknown[] => {
    if (Array.isArray(response)) return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      if ('values' in obj && Array.isArray(obj.values)) return obj.values;
      if ('choices' in obj && Array.isArray(obj.choices)) return obj.choices;
    }
    return [];
  },

  ranking: (response: unknown): string[] => {
    if (Array.isArray(response) && response.every(item => typeof item === 'string')) {
      return response as string[];
    }
    return [];
  }
};

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

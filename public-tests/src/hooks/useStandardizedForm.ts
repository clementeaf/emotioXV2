import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { useResponseAPI } from './useResponseAPI';
import { useModuleResponses } from './useModuleResponses';

// Tipos base para el hook estandarizado
export interface StandardizedFormProps {
  stepId: string;
  stepType: string;
  stepName?: string;
  researchId?: string;
  participantId?: string;
  savedResponse?: { id?: string; response?: unknown } | null;
  savedResponseId?: string | null;
  required?: boolean;
  isMock?: boolean;
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface StandardizedFormState<T> {
  value: T;
  isLoading: boolean;
  isSaving: boolean;
  isDataLoaded: boolean;
  error: string | null;
  responseId: string | null;
  hasExistingData: boolean;
}

export interface StandardizedFormActions<T> {
  setValue: (value: T) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  saveResponse: (value?: T) => Promise<{ success: boolean; data?: unknown }>;
  validateAndSave: (value?: T) => Promise<{ success: boolean; data?: unknown }>;
  reset: () => void;
}

export interface UseStandardizedFormOptions<T> {
  initialValue: T;
  extractValueFromResponse: (response: unknown) => T;
  validationRules?: ValidationRule<T>[];
  enableAutoSave?: boolean;
  moduleId?: string;
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

  // Store data
  const researchIdFromStore = useParticipantStore(state => state.researchId);
  const participantIdFromStore = useParticipantStore(state => state.participantId);
  
  const researchId = propResearchId || researchIdFromStore;
  const participantId = propParticipantId || participantIdFromStore;

  // State
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(savedResponseId || null);
  const [hasExistingData, setHasExistingData] = useState(false);

  // API hooks
  const {
    saveOrUpdateResponse,
    isLoading: isSaving,
    error: apiError,
    setError: setApiError
  } = useResponseAPI({ researchId: researchId || '', participantId: participantId || '' });

  const {
    data: moduleResponsesArray,
    isLoading: isLoadingResponses,
    error: loadingError
  } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId && !isMock)
  });

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

  // Load existing response from API if no saved response provided
  useEffect(() => {
    if (isMock || savedResponse) {
      setValue(extractedValue);
      setIsDataLoaded(true);
      setHasExistingData(!!savedResponse);
      return;
    }

    if (!isLoadingResponses && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const response = r as { stepType?: string; stepId?: string; id?: string };
        return response.stepType === stepType || response.stepId === stepId;
      });

      if (foundResponse) {
        const foundResp = foundResponse as { response?: unknown; id?: string };
        try {
          const extractedVal = extractValueFromResponse(foundResp.response);
          setValue(extractedVal);
          setResponseId(foundResp.id || null);
          setHasExistingData(true);
        } catch (err) {
          console.warn('[useStandardizedForm] Error extracting value from API response:', err);
          setValue(initialValue);
        }
      } else {
        setValue(initialValue);
        setHasExistingData(false);
      }
      setIsDataLoaded(true);
    }
  }, [
    isMock, 
    savedResponse, 
    extractedValue, 
    isLoadingResponses, 
    loadingError, 
    moduleResponsesArray, 
    stepType, 
    stepId, 
    initialValue
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
      setError(errorMsg);
      return { success: false };
    }

    if (isMock) {
      console.log('[useStandardizedForm] Mock mode - not saving to API:', finalValue);
      return { success: true, data: { value: finalValue } };
    }

    const validationError = validateValue(finalValue);
    if (validationError) {
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
        setError(apiError);
        return { success: false };
      }

      if (result && typeof result === 'object' && result !== null && 'id' in result && !responseId) {
        setResponseId((result as { id: string }).id);
        setHasExistingData(true);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al guardar.';
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
    setApiError
  ]);

  // Validate and save
  const validateAndSave = useCallback(async (valueToSave?: T): Promise<{ success: boolean; data?: unknown }> => {
    const finalValue = valueToSave !== undefined ? valueToSave : value;
    const validationError = validateValue(finalValue);
    
    if (validationError) {
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
      setValue(initialValue);
      setError(null);
      setResponseId(null);
      setHasExistingData(false);
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

// Utility functions for common value extractors
export const valueExtractors = {
  // For simple numeric scales (CSAT, NPS, Linear Scale)
  numericScale: (response: unknown): number | null => {
    if (typeof response === 'number') return response;
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
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
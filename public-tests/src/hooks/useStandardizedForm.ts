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
    console.log(`🔒 [useStandardizedForm] User interaction persisted for ${stepId}`);
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

  // Store data
  const researchIdFromStore = useParticipantStore(state => state.researchId);
  const participantIdFromStore = useParticipantStore(state => state.participantId);
  
  const researchId = propResearchId || researchIdFromStore;
  const participantId = propParticipantId || participantIdFromStore;

  // 🚨 NUEVO: Debug logging para IDs
  console.log(`🔍 [useStandardizedForm] ID resolution for ${stepId}:`, {
    propResearchId,
    researchIdFromStore, 
    finalResearchId: researchId,
    propParticipantId,
    participantIdFromStore,
    finalParticipantId: participantId
  });

  // State
  const [value, setValueInternal] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(savedResponseId || null);
  const [hasExistingData, setHasExistingData] = useState(false);
  
  // 🚨 ACTUALIZADO: Usar sessionStorage para persistir entre re-mounts
  const userHasInteracted = useRef<boolean>(hasUserInteracted(stepId, stepType));
  const initialLoadComplete = useRef<boolean>(false);
  
  // 🚨 NUEVO: Log inicial para debugging
  useEffect(() => {
    const persistedInteraction = hasUserInteracted(stepId, stepType);
    if (persistedInteraction) {
      userHasInteracted.current = true;
      console.log(`🔒 [useStandardizedForm] Restored user interaction state for ${stepId} from sessionStorage`);
    }
  }, [stepId, stepType]);

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
      console.log(`🔄 [useStandardizedForm] setValue: ${stepId}`, {
        newValue: JSON.stringify(newValue),
        isUserInteraction,
        userHasInteracted: userHasInteracted.current,
        initialLoadComplete: initialLoadComplete.current
      });
      
      // 🚨 Si es interacción del usuario, marcar flag Y persistir
      if (isUserInteraction) {
        userHasInteracted.current = true;
        setUserInteracted(stepId, stepType); // 🚨 PERSISTIR en sessionStorage
        console.log(`👤 [useStandardizedForm] User interaction detected for ${stepId} - PERSISTED`);
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

  // Load existing response - SUPER PROTECTED VERSION with sessionStorage persistence
  useEffect(() => {
    // 🚨 GUARD 0: Si faltan IDs esenciales, limpiar protección y permitir carga cuando estén disponibles
    if (!researchId || !participantId) {
      console.log(`⏳ [useStandardizedForm] Missing essential IDs for ${stepId} - researchId: ${researchId}, participantId: ${participantId}`);
      // Si faltan IDs, limpiar la protección para permitir carga futura
      if (userHasInteracted.current && (!researchId || !participantId)) {
        console.log(`🧹 [useStandardizedForm] Clearing user interaction due to missing IDs`);
        clearUserInteraction(stepId, stepType);
        userHasInteracted.current = false;
      }
      return;
    }
    
    // 🚨 NUEVO GUARD 0.5: Si tenemos IDs válidos Y datos para cargar, pero la protección está activa, limpiar sessionStorage
    if (userHasInteracted.current && !isLoadingResponses && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const response = r as { stepType?: string; stepId?: string; id?: string };
        return (
          response.stepType === stepType ||
          response.stepId === stepId ||
          (response.stepType && stepType && response.stepType.includes(stepType)) ||
          (response.stepType && stepType && stepType.includes(response.stepType)) ||
          (response.stepId && stepId && response.stepId.includes(stepId))
        );
      });
      
      if (foundResponse) {
        console.log(`🔓 [useStandardizedForm] Found valid data to load but user interaction is blocking. Clearing protection for ${stepId}`);
        clearUserInteraction(stepId, stepType);
        userHasInteracted.current = false;
        // No return here - let it continue to load the data
      }
    }
    
    // 🚨 GUARD 1: Si el usuario ya interactuó (incluso en sesiones anteriores), NO sobrescribir NUNCA
    if (userHasInteracted.current) {
      console.log(`🚫 [useStandardizedForm] User has interacted with ${stepId} (persisted), REFUSING to reload data to preserve user changes`);
      return;
    }
    
    // 🚨 GUARD 2: Si ya se completó la carga inicial, NO volver a cargar
    if (initialLoadComplete.current) {
      console.log(`🚫 [useStandardizedForm] Initial load complete for ${stepId}, skipping reload`);
      return;
    }
    
    // 🚨 GUARD 3: Si ya se marcó como data cargada, NO recargar  
    if (isDataLoaded) {
      console.log(`🚫 [useStandardizedForm] Data already loaded for ${stepId}, skipping reload`);
      return;
    }
    
    // 🚨 GUARD 4: Si ya hay un valor establecido (no inicial) y el usuario interactuó, NO sobrescribir
    if (value !== null && value !== initialValue && (userHasInteracted.current || (stepId && hasUserInteracted(stepId, stepType)))) {
      console.log(`🚫 [useStandardizedForm] User value exists (${value}) and user interacted, PRESERVING current value`);
      setIsDataLoaded(true);
      setHasExistingData(true);
      initialLoadComplete.current = true;
      return;
    }
    
    console.log(`🔍 [useStandardizedForm] Loading data for ${stepId} (${stepType}):`, {
      isMock,
      hasSavedResponse: !!savedResponse,
      isLoadingResponses,
      hasModuleResponsesArray: !!moduleResponsesArray,
      arrayLength: Array.isArray(moduleResponsesArray) ? moduleResponsesArray.length : 'not array',
      isDataLoaded,
      userHasInteracted: userHasInteracted.current,
      initialLoadComplete: initialLoadComplete.current,
      persistedInteraction: hasUserInteracted(stepId, stepType)
    });

    // Handle mock mode
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
      console.log(`✅ [useStandardizedForm] Loaded from savedResponse:`, extractedValue);
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
          console.log(`✅ [useStandardizedForm] Loaded from API (priority):`, {
            stepId,
            stepType,
            rawResponse: foundResp.response,
            extractedVal,
            responseId: foundResp.id,
            foundResponseStepType: (foundResponse as { stepType?: string }).stepType
          });
          
          setValue(extractedVal, false);
          setResponseId(foundResp.id || null);
          setHasExistingData(true);
          setIsDataLoaded(true);
          initialLoadComplete.current = true;
          
          // 🧹 CLEAN CONFLICTING LOCALSTORAGE
          try {
            const localStorageKey = `response_${stepId}`;
            if (localStorage.getItem(localStorageKey)) {
              console.log(`🧹 [useStandardizedForm] Cleaning conflicting localStorage: ${localStorageKey}`);
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

    // No API response found - use initial value
    console.log(`📭 [useStandardizedForm] No API response found, using initial value:`, initialValue);
    setValue(initialValue, false);
    setHasExistingData(false);
    setIsDataLoaded(true);
    initialLoadComplete.current = true;
    
  }, [
    // ✅ MANTENER DEPENDENCIAS MÍNIMAS PARA EVITAR RE-EJECUCIONES
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
    
    console.log(`🔍 [useStandardizedForm] saveResponse called:`, {
      stepId,
      stepType,
      stepName,
      finalValue,
      valueType: typeof finalValue,
      valueKeys: typeof finalValue === 'object' && finalValue ? Object.keys(finalValue) : 'not object',
      researchId,
      participantId,
      responseId
    });
    
    if (!researchId || !participantId) {
      const errorMsg = 'ID de investigación o participante no disponible.';
      console.error(`❌ [useStandardizedForm] Missing IDs:`, { researchId, participantId });
      setError(errorMsg);
      return { success: false };
    }

    if (isMock) {
      console.log('[useStandardizedForm] Mock mode - not saving to API:', finalValue);
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
      console.log(`📤 [useStandardizedForm] Calling saveOrUpdateResponse with:`, {
        stepId,
        stepType,
        stepName: stepName || stepId,
        finalValue,
        responseId: responseId || undefined,
        moduleId
      });
      
      const result = await saveOrUpdateResponse(
        stepId,
        stepType,
        stepName || stepId,
        finalValue,
        responseId || undefined,
        moduleId
      );

      console.log(`📋 [useStandardizedForm] saveOrUpdateResponse result:`, result);

      if (apiError) {
        console.error(`❌ [useStandardizedForm] API Error after save:`, apiError);
        setError(apiError);
        return { success: false };
      }

      if (result && typeof result === 'object' && result !== null && 'id' in result && !responseId) {
        const newId = (result as { id: string }).id;
        console.log(`📋 [useStandardizedForm] Setting new responseId:`, newId);
        setResponseId(newId);
        setHasExistingData(true);
      }

      // 🚨 DESACTIVADO: NO refrescar inmediatamente después del guardado
      // para evitar sobrescribir el valor del usuario con datos obsoletos de la API
      if (false && researchId && participantId && fetchResponses) {
        console.log(`🔄 [useStandardizedForm] Refreshing module responses after successful save`);
        fetchResponses(researchId, participantId);
      } else {
        console.log(`🚫 [useStandardizedForm] Skipping automatic refresh to preserve user value`);
      }

      console.log(`✅ [useStandardizedForm] Save successful!`);
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
    
    console.log(`🔍 [useStandardizedForm] validateAndSave called with:`, {
      valueToSave,
      valueToSaveType: typeof valueToSave,
      valueToSaveKeys: typeof valueToSave === 'object' && valueToSave ? Object.keys(valueToSave) : 'not object',
      currentStateValue: value,
      currentStateValueType: typeof value,
      currentStateValueKeys: typeof value === 'object' && value ? Object.keys(value) : 'not object',
      finalValue,
      finalValueType: typeof finalValue,
      finalValueKeys: typeof finalValue === 'object' && finalValue ? Object.keys(finalValue) : 'not object'
    });
    
    const validationError = validateValue(finalValue);
    
    if (validationError) {
      console.error(`❌ [useStandardizedForm] validateAndSave validation error:`, validationError);
      setError(validationError);
      return { success: false };
    }
    
    console.log(`✅ [useStandardizedForm] validateAndSave validation passed, calling saveResponse with:`, finalValue);
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
      // 🚨 NUEVO: Limpiar user interaction de sessionStorage
      clearUserInteraction(stepId, stepType);
      console.log(`🧹 [useStandardizedForm] Reset complete for ${stepId} - user interaction cleared`);
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
      console.log(`🧹 [userInteractionUtils] Cleared ${interactionKeys.length} user interaction flags`);
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
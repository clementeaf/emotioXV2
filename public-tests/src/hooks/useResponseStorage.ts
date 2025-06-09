import { useCallback } from 'react';
import { ResponseData, UseResponseStorageReturn } from '../types/hooks.types';

/**
 * Hook unificado para manejo de respuestas en localStorage
 * Reemplaza los múltiples sistemas (temp_, cognitive_, auto_)
 */
export const useResponseStorage = (): UseResponseStorageReturn => {
  
  const saveResponse = useCallback((
    stepId: string, 
    stepType: string, 
    answer: unknown, 
    isPartial = false
  ) => {
    // ❌ COMPLETELY DISABLED - NO localStorage for responses
    console.log(`🚫 [ResponseStorage] localStorage saving DISABLED for ${stepId}`);
  }, []);

  const loadResponse = useCallback((stepId: string): ResponseData | null => {
    // ❌ COMPLETELY DISABLED - NO localStorage for responses
    console.log(`🚫 [ResponseStorage] localStorage loading DISABLED for ${stepId}`);
    return null;
  }, []);

  const clearResponse = useCallback((stepId: string) => {
    // ❌ COMPLETELY DISABLED - NO localStorage for responses
    console.log(`🚫 [ResponseStorage] localStorage clearing DISABLED for ${stepId}`);
  }, []);

  const hasResponse = useCallback((stepId: string): boolean => {
    // ❌ COMPLETELY DISABLED - NO localStorage for responses
    console.log(`🚫 [ResponseStorage] localStorage hasResponse DISABLED for ${stepId}`);
    return false;
  }, []);

  return {
    saveResponse,
    loadResponse,
    clearResponse,
    hasResponse
  };
}; 
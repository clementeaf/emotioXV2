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
  }, []);

  const loadResponse = useCallback((stepId: string): ResponseData | null => {
    // ❌ COMPLETELY DISABLED - NO localStorage for responses
    return null;
  }, []);

  const clearResponse = useCallback((stepId: string) => {
    // ❌ COMPLETELY DISABLED - NO localStorage for responses
  }, []);

  const hasResponse = useCallback((stepId: string): boolean => {
    // ❌ COMPLETELY DISABLED - NO localStorage for responses
    return false;
  }, []);

  return {
    saveResponse,
    loadResponse,
    clearResponse,
    hasResponse
  };
};

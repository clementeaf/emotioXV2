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
    try {
      const responseData: ResponseData = {
        stepId,
        stepType,
        answer,
        timestamp: Date.now(),
        partial: isPartial
      };
      
      localStorage.setItem(`response_${stepId}`, JSON.stringify(responseData));
    } catch (error) {
      console.error(`[ResponseStorage] Error saving response for ${stepId}:`, error);
    }
  }, []);

  const loadResponse = useCallback((stepId: string): ResponseData | null => {
    try {
      const stored = localStorage.getItem(`response_${stepId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`[ResponseStorage] Error loading response for ${stepId}:`, error);
      return null;
    }
  }, []);

  const clearResponse = useCallback((stepId: string) => {
    try {
      localStorage.removeItem(`response_${stepId}`);
    } catch (error) {
      console.error(`[ResponseStorage] Error clearing response for ${stepId}:`, error);
    }
  }, []);

  const hasResponse = useCallback((stepId: string): boolean => {
    return localStorage.getItem(`response_${stepId}`) !== null;
  }, []);

  return {
    saveResponse,
    loadResponse,
    clearResponse,
    hasResponse
  };
}; 
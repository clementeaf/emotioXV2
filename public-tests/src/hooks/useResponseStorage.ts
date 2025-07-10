import { useCallback } from 'react';
import { ResponseData, UseResponseStorageReturn } from '../types/hooks.types';

/**
 * Hook unificado para manejo de respuestas en localStorage
 * Reemplaza los múltiples sistemas (temp_, cognitive_, auto_)
 * NUEVO: Integración con questionKey para evitar mezcla de respuestas
 */
export const useResponseStorage = (): UseResponseStorageReturn => {

  const saveResponse = useCallback((questionKey: string, responseData: unknown) => {
    try {
      const key = `response_${questionKey}`;
      const data: ResponseData = {
        questionKey,
        stepId: questionKey, // Usar questionKey como stepId
        stepType: 'response', // Tipo genérico
        response: responseData,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`[useResponseStorage] ✅ Respuesta guardada para questionKey: ${questionKey}`);
    } catch (error) {
      console.error(`[useResponseStorage] ❌ Error guardando respuesta para questionKey: ${questionKey}`, error);
    }
  }, []);

  const loadResponse = useCallback((questionKey: string): ResponseData | null => {
    try {
      const key = `response_${questionKey}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored) as ResponseData;
        console.log(`[useResponseStorage] ✅ Respuesta cargada para questionKey: ${questionKey}`);
        return data;
      }
      return null;
    } catch (error) {
      console.error(`[useResponseStorage] ❌ Error cargando respuesta para questionKey: ${questionKey}`, error);
      return null;
    }
  }, []);

  const clearResponse = useCallback((questionKey: string) => {
    try {
      const key = `response_${questionKey}`;
      localStorage.removeItem(key);
      console.log(`[useResponseStorage] ✅ Respuesta eliminada para questionKey: ${questionKey}`);
    } catch (error) {
      console.error(`[useResponseStorage] ❌ Error eliminando respuesta para questionKey: ${questionKey}`, error);
    }
  }, []);

  const hasResponse = useCallback((questionKey: string): boolean => {
    try {
      const key = `response_${questionKey}`;
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`[useResponseStorage] ❌ Error verificando respuesta para questionKey: ${questionKey}`, error);
      return false;
    }
  }, []);

  const clearAllResponses = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const responseKeys = keys.filter(key => key.startsWith('response_'));
      responseKeys.forEach(key => localStorage.removeItem(key));
      console.log(`[useResponseStorage] ✅ Todas las respuestas eliminadas (${responseKeys.length} respuestas)`);
    } catch (error) {
      console.error(`[useResponseStorage] ❌ Error eliminando todas las respuestas`, error);
    }
  }, []);

  return {
    saveResponse,
    loadResponse,
    clearResponse,
    hasResponse,
    clearAllResponses
  };
};

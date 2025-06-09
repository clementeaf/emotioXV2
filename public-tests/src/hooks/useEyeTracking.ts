import { useState, useEffect, useCallback } from 'react';
import { apiClient, APIStatus } from '../lib/api';
import { EyeTrackingFormData } from '../lib/types';
import { UseEyeTrackingResult } from '../types/hooks.types';

/**
 * Hook para gestionar los datos de Eye Tracking
 * @param researchId ID de la investigación
 * @returns Datos, estado de carga, errores y función para refrescar
 */
export function useEyeTracking(researchId: string): UseEyeTrackingResult {
  const [data, setData] = useState<EyeTrackingFormData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar los datos
  const loadEyeTrackingData = useCallback(async () => {
    if (!researchId) {
      setError('ID de investigación no proporcionado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[useEyeTracking] Cargando datos para investigación ${researchId}`);
      
      const response = await apiClient.getEyeTracking(researchId);
      
      if (response.error || response.apiStatus !== APIStatus.SUCCESS) {
        const errorMessage = response.message || 'Error desconocido al cargar datos de Eye Tracking';
        setError(errorMessage);
        console.error(`[useEyeTracking] Error:`, errorMessage);
        return;
      }
      
      console.log(`[useEyeTracking] Datos cargados exitosamente:`, response.data);
      setData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error(`[useEyeTracking] Excepción:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [researchId]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadEyeTrackingData();
  }, [loadEyeTrackingData]);

  return {
    data,
    isLoading,
    error,
    refresh: loadEyeTrackingData
  };
}

/**
 * Hook para gestionar los datos de reclutamiento de Eye Tracking
 * @param researchId ID de la investigación
 * @returns Datos, estado de carga, errores y función para refrescar
 */
export function useEyeTrackingRecruit(researchId: string) {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar los datos
  const loadEyeTrackingRecruitData = useCallback(async () => {
    if (!researchId) {
      setError('ID de investigación no proporcionado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[useEyeTrackingRecruit] Cargando datos para investigación ${researchId}`);
      
      const response = await apiClient.getEyeTrackingRecruit(researchId);
      
      if (response.error || response.apiStatus !== APIStatus.SUCCESS) {
        const errorMessage = response.message || 'Error desconocido al cargar datos de reclutamiento';
        setError(errorMessage);
        console.error(`[useEyeTrackingRecruit] Error:`, errorMessage);
        return;
      }
      
      console.log(`[useEyeTrackingRecruit] Datos cargados exitosamente:`, response.data);
      setData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error(`[useEyeTrackingRecruit] Excepción:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [researchId]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadEyeTrackingRecruitData();
  }, [loadEyeTrackingRecruitData]);

  return {
    data,
    isLoading,
    error,
    refresh: loadEyeTrackingRecruitData
  };
} 
'use client';

import { useState, useEffect, useCallback } from 'react';

import { isDevelopmentMode, shouldUseSimulatedMode } from '@/lib/utils';

interface UseDataWithFallbackOptions<TData, TMockData = TData> {
  /** Función para cargar datos reales */
  loadData: () => Promise<TData>;
  /** Función para generar datos simulados */
  getMockData: () => Promise<TMockData> | TMockData;
  /** Key para almacenar la preferencia de datos simulados en localStorage */
  localStorageKey?: string;
  /** Si debe intentar cargar datos reales primero, incluso en modo simulado */
  tryRealDataFirst?: boolean;
  /** Si debe cargar automáticamente al inicializar el hook */
  autoLoad?: boolean;
}

interface UseDataWithFallbackResult<TData, TMockData = TData> {
  /** Datos cargados (reales o simulados) */
  data: TData | TMockData | null;
  /** Si los datos están cargando */
  isLoading: boolean;
  /** Error ocurrido durante la carga */
  error: Error | null;
  /** Si se están usando datos simulados */
  isSimulatedData: boolean;
  /** Función para recargar los datos */
  reloadData: (useReal?: boolean) => Promise<void>;
  /** Función para cambiar a datos simulados */
  switchToMockData: () => Promise<void>;
  /** Función para cambiar a datos reales */
  switchToRealData: () => Promise<void>;
  /** Función para manejar errores cargando datos simulados */
  handleError: (error: Error) => Promise<void>;
}

/**
 * Hook para cargar datos con manejo de errores y fallback a datos simulados
 */
export function useDataWithFallback<TData, TMockData = TData>({
  loadData,
  getMockData,
  localStorageKey = 'use_simulated_data',
  tryRealDataFirst = false,
  autoLoad = true
}: UseDataWithFallbackOptions<TData, TMockData>): UseDataWithFallbackResult<TData, TMockData> {
  const [data, setData] = useState<TData | TMockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<Error | null>(null);
  const [isSimulatedData, setIsSimulatedData] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const isDevMode = isDevelopmentMode();

  // Función para cargar datos con manejo de errores
  const loadDataWithErrorHandling = useCallback(async (forceMock: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Determinar si debemos usar datos simulados
      const shouldUseMock = 
        forceMock || 
        (isDevMode && shouldUseSimulatedMode()) ||
        (isDevMode && localStorage.getItem(localStorageKey) === 'true');
      
      // Si estamos en modo simulado o se fuerza el uso de datos simulados
      if (shouldUseMock) {
        if (tryRealDataFirst) {
          try {
            // Intentar cargar datos reales primero, con un tiempo límite
            const realDataPromise = loadData();
            const timeoutPromise = new Promise<TData>((_, reject) => {
              setTimeout(() => reject(new Error('Timeout loading real data')), 3000);
            });
            
            const realData = await Promise.race([realDataPromise, timeoutPromise]);
            setData(realData);
            setIsSimulatedData(false);
            console.log('Cargados datos reales exitosamente (modo mixto)');
          } catch (e) {
            // Si falla, cargar datos simulados como respaldo
            console.log('Error cargando datos reales en modo mixto, usando simulados:', e);
            const mockData = await getMockData();
            setData(mockData);
            setIsSimulatedData(true);
          }
        } else {
          // Directamente cargamos datos simulados
          console.log('Usando datos simulados...');
          const mockData = await getMockData();
          setData(mockData);
          setIsSimulatedData(true);
        }
      } else {
        // Cargar datos reales
        console.log('Cargando datos reales...');
        const realData = await loadData();
        setData(realData);
        setIsSimulatedData(false);
      }
    } catch (e) {
      console.error('Error cargando datos:', e);
      const errorObj = e instanceof Error ? e : new Error(String(e));
      setError(errorObj);
      
      // En desarrollo, si hay error, incrementar contador de reintentos
      if (isDevMode && retryCount === 0) {
        setRetryCount(prev => prev + 1);
      }
      
      // Propagar el error para manejo externo si es necesario
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, [loadData, getMockData, isDevMode, localStorageKey, retryCount, tryRealDataFirst]);

  // Cargar datos simulados como respuesta a un error
  const handleError = useCallback(async (e: Error) => {
    setIsLoading(true);
    setError(e);
    
    try {
      console.log('Manejando error cargando datos simulados...', e);
      const mockData = await getMockData();
      setData(mockData);
      setIsSimulatedData(true);
      
      // Guardar preferencia en localStorage si estamos en desarrollo
      if (isDevMode) {
        localStorage.setItem(localStorageKey, 'true');
      }
    } catch (mockError) {
      console.error('Error cargando datos simulados:', mockError);
      // Mantener el error original
    } finally {
      setIsLoading(false);
    }
  }, [getMockData, isDevMode, localStorageKey]);

  // Recargar datos (puede ser forzado a reales o simulados)
  const reloadData = useCallback(async (useReal: boolean = false) => {
    try {
      if (useReal) {
        if (isDevMode) {
          localStorage.setItem(localStorageKey, 'false');
        }
        await loadDataWithErrorHandling(false);
      } else {
        await loadDataWithErrorHandling(isSimulatedData);
      }
    } catch (e) {
      // El error ya está manejado en loadDataWithErrorHandling
    }
  }, [loadDataWithErrorHandling, isDevMode, isSimulatedData, localStorageKey]);

  // Cambiar a datos simulados
  const switchToMockData = useCallback(async () => {
    try {
      if (isDevMode) {
        localStorage.setItem(localStorageKey, 'true');
      }
      await loadDataWithErrorHandling(true);
    } catch (e) {
      // El error ya está manejado en loadDataWithErrorHandling
    }
  }, [loadDataWithErrorHandling, isDevMode, localStorageKey]);

  // Cambiar a datos reales
  const switchToRealData = useCallback(async () => {
    try {
      if (isDevMode) {
        localStorage.setItem(localStorageKey, 'false');
      }
      await loadDataWithErrorHandling(false);
    } catch (e) {
      // El error ya está manejado en loadDataWithErrorHandling
    }
  }, [loadDataWithErrorHandling, isDevMode, localStorageKey]);

  // Cargar datos al montar el componente si autoLoad es true
  useEffect(() => {
    if (autoLoad) {
      loadDataWithErrorHandling().catch(e => {
        // El error ya está manejado en loadDataWithErrorHandling
      });
    }
  }, [autoLoad, loadDataWithErrorHandling]);

  return {
    data,
    isLoading,
    error,
    isSimulatedData,
    reloadData,
    switchToMockData,
    switchToRealData,
    handleError
  };
} 
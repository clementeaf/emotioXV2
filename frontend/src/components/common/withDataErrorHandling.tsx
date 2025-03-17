'use client';

import { useState, useEffect, ComponentType } from 'react';
import { DataErrorFallback } from './DataErrorFallback';
import { SimulatedDataBanner } from './SimulatedDataBanner';
import { isDevelopmentMode, shouldUseSimulatedMode } from '@/lib/utils';

/**
 * Opciones para el HOC withDataErrorHandling
 */
export interface WithDataErrorHandlingOptions<TData, TMockData = TData> {
  /** Función para cargar datos reales */
  loadData: () => Promise<TData>;
  /** Función para generar datos simulados */
  getMockData: () => Promise<TMockData> | TMockData;
  /** Key para almacenar la preferencia de datos simulados en localStorage */
  localStorageKey?: string;
  /** Si debe mostrar un banner cuando se usan datos simulados */
  showSimulatedBanner?: boolean;
  /** Texto del banner de datos simulados */
  simulatedBannerText?: string;
  /** Variante de estilo para el banner */
  bannerVariant?: 'default' | 'compact' | 'subtle' | 'floating';
  /** Si debe intentar cargar datos reales primero, incluso en modo simulado */
  tryRealDataFirst?: boolean;
}

/**
 * Props que se pasan al componente envuelto
 */
export interface WithDataErrorHandlingProps<TData, TMockData = TData> {
  /** Datos cargados (reales o simulados) */
  data: TData | TMockData;
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
}

/**
 * HOC que envuelve un componente y le proporciona manejo de errores
 * y datos simulados
 */
export function withDataErrorHandling<
  TProps extends object,
  TData,
  TMockData = TData
>(
  Component: ComponentType<TProps & WithDataErrorHandlingProps<TData, TMockData>>,
  options: WithDataErrorHandlingOptions<TData, TMockData>
) {
  // Valores por defecto para las opciones
  const {
    loadData,
    getMockData,
    localStorageKey = 'use_simulated_data',
    showSimulatedBanner = true,
    simulatedBannerText = "Mostrando datos simulados",
    bannerVariant = 'default',
    tryRealDataFirst = false
  } = options;

  // Componente envuelto que incluye el manejo de errores
  return function WithDataErrorHandlingComponent(props: TProps) {
    const [data, setData] = useState<TData | TMockData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [isSimulatedData, setIsSimulatedData] = useState<boolean>(false);
    const [retryCount, setRetryCount] = useState<number>(0);
    const isDevMode = isDevelopmentMode();

    // Cargar los datos
    const loadDataWithErrorHandling = async (forceMock: boolean = false) => {
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
        setError(e instanceof Error ? e : new Error(String(e)));
        
        // En desarrollo, si hay error, ofrecer datos simulados
        // pero no cargarlos automáticamente
        if (isDevMode && retryCount === 0) {
          setRetryCount(prev => prev + 1);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
      loadDataWithErrorHandling();
    }, []);

    // Cargar datos simulados como respuesta a un error
    const handleUseMockData = async () => {
      setIsLoading(true);
      try {
        console.log('Cargando datos simulados como respuesta a error...');
        const mockData = await getMockData();
        setData(mockData);
        setIsSimulatedData(true);
        setError(null);
        
        // Guardar preferencia en localStorage si estamos en desarrollo
        if (isDevMode) {
          localStorage.setItem(localStorageKey, 'true');
        }
      } catch (e) {
        console.error('Error cargando datos simulados:', e);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    };

    // Recargar datos (puede ser forzado a reales o simulados)
    const reloadData = async (useReal: boolean = false) => {
      if (useReal) {
        if (isDevMode) {
          localStorage.setItem(localStorageKey, 'false');
        }
        await loadDataWithErrorHandling(false);
      } else {
        await loadDataWithErrorHandling(isSimulatedData);
      }
    };

    // Cambiar a datos simulados
    const switchToMockData = async () => {
      if (isDevMode) {
        localStorage.setItem(localStorageKey, 'true');
      }
      await loadDataWithErrorHandling(true);
    };

    // Cambiar a datos reales
    const switchToRealData = async () => {
      if (isDevMode) {
        localStorage.setItem(localStorageKey, 'false');
      }
      await loadDataWithErrorHandling(false);
    };

    // Si hay error y no tenemos datos, mostrar el fallback
    if (error && !data) {
      return (
        <DataErrorFallback
          error={error}
          onRetry={() => reloadData(false)}
          onUseMockData={handleUseMockData}
          mockDataButtonText="Usar datos simulados"
        />
      );
    }

    // Render del componente con los datos y el banner si es necesario
    return (
      <>
        {isSimulatedData && showSimulatedBanner && (
          <SimulatedDataBanner
            message={simulatedBannerText}
            onSwitchToReal={switchToRealData}
            variant={bannerVariant}
          />
        )}
        
        <Component
          {...props}
          data={data as TData | TMockData}
          isLoading={isLoading}
          error={error}
          isSimulatedData={isSimulatedData}
          reloadData={reloadData}
          switchToMockData={switchToMockData}
          switchToRealData={switchToRealData}
        />
      </>
    );
  };
} 
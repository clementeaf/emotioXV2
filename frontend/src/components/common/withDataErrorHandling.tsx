'use client';

import { ComponentType, useEffect, useState } from 'react';

import { DataErrorFallback } from './DataErrorFallback';

/**
 * Opciones para el HOC withDataErrorHandling
 */
export interface WithDataErrorHandlingOptions<TData> {
  /** Función para cargar datos */
  loadData: () => Promise<TData>;
  /** Texto del botón de reintento */
  retryButtonText?: string;
  /** Texto del botón de datos simulados */
  mockDataButtonText?: string;
}

/**
 * Props que se pasan al componente envuelto
 */
export interface WithDataErrorHandlingProps<TData> {
  /** Datos cargados */
  data: TData | null;
  /** Si los datos están cargando */
  isLoading: boolean;
  /** Error ocurrido durante la carga */
  error: Error | null;
  /** Función para recargar los datos */
  reloadData: () => Promise<void>;
}

/**
 * HOC simplificado que envuelve un componente y le proporciona manejo de errores
 */
export function withDataErrorHandling<TProps extends object, TData>(
  Component: ComponentType<TProps & WithDataErrorHandlingProps<TData>>,
  options: WithDataErrorHandlingOptions<TData>
) {
  const {
    loadData,
    retryButtonText = 'Reintentar',
    mockDataButtonText = 'Usar datos simulados'
  } = options;

  return function WithDataErrorHandlingComponent(props: TProps) {
    const [data, setData] = useState<TData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const loadDataWithErrorHandling = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadData();
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      loadDataWithErrorHandling();
    }, []);

    const reloadData = async () => {
      await loadDataWithErrorHandling();
    };

    // Si hay error y no tenemos datos, mostrar el fallback
    if (error && !data) {
      return (
        <DataErrorFallback
          error={error}
          onRetry={reloadData}
          mockDataButtonText={mockDataButtonText}
        />
      );
    }

    return (
      <Component
        {...props}
        data={data}
        isLoading={isLoading}
        error={error}
        reloadData={reloadData}
      />
    );
  };
}

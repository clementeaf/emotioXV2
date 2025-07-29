import { useState, useEffect } from 'react';
import { TrustFlowData } from '../../../shared/interfaces/websocket-events.interface';

export const useTrustFlowData = (researchId: string) => {
  const [data, setData] = useState<TrustFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carga de datos
    setIsLoading(false);
  }, [researchId]);

  return {
    data,
    isLoading,
    error,
    // Valores por defecto para evitar errores de renderizado
    defaultData: []
  };
};

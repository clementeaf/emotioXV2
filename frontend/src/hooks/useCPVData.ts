import { useState, useEffect } from 'react';
import { CPVData } from '../../../shared/interfaces/websocket-events.interface';

export const useCPVData = (researchId: string) => {
  const [data, setData] = useState<CPVData | null>(null);
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
    defaultData: {
      cpvValue: 0,
      satisfaction: 0,
      retention: 0,
      impact: 'Bajo',
      trend: 'Negativa',
      csatPercentage: 0,
      cesPercentage: 0,
      cvValue: 0,
      nevValue: 0,
      npsValue: 0,
      peakValue: 0
    }
  };
};

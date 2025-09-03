/**
 * Componente de prueba para AlovaJS - INVISIBLE y TEMPORAL
 * Solo para verificar conectividad sin afectar producción
 */

import React, { useEffect } from 'react';
import { useAvailableFormsQueryAlova } from '../hooks/useApiQueries-alova';

interface TestAlovaProps {
  researchId: string;
}

export const TestAlova: React.FC<TestAlovaProps> = ({ researchId }) => {
  const { data, loading, error } = useAvailableFormsQueryAlova(researchId, {
    enabled: !!researchId
  });

  useEffect(() => {
    if (data) {
      console.log('[TestAlova] ✅ AlovaJS conectado correctamente:', {
        researchId,
        dataReceived: true,
        dataKeys: Object.keys(data),
        hasSteps: 'steps' in data,
        timestamp: new Date().toISOString()
      });
    }
    
    if (error) {
      console.warn('[TestAlova] ❌ Error en conexión AlovaJS:', {
        researchId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    if (loading) {
      console.log('[TestAlova] ⏳ Cargando datos con AlovaJS...', {
        researchId,
        timestamp: new Date().toISOString()
      });
    }
  }, [data, loading, error, researchId]);

  // Componente INVISIBLE - no afecta UI
  return (
    <div style={{ display: 'none' }} data-testid="alova-test">
      {/* Solo para testing, completamente invisible */}
      <pre>{JSON.stringify({ 
        hasData: !!data, 
        isLoading: loading, 
        hasError: !!error,
        researchId 
      }, null, 2)}</pre>
    </div>
  );
};

// Debug info
if (import.meta.env.DEV) {
  console.log('[TestAlova] Componente de prueba AlovaJS creado - INVISIBLE');
}
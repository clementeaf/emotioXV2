'use client';

import { useState } from 'react';
import { useDataWithFallback } from '@/hooks/useDataWithFallback';
import { SimulatedDataBanner } from './SimulatedDataBanner';
import { DataErrorFallback } from './DataErrorFallback';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Tipo para los datos
interface ExampleData {
  id: string;
  title: string;
  description: string;
  value: number;
}

// Props para el componente
interface DataDisplayExampleProps {
  apiEndpoint?: string;
  title?: string;
  showSimulatedToggle?: boolean;
}

/**
 * Componente de ejemplo que muestra cómo usar el hook useDataWithFallback
 */
export function DataDisplayExample({
  apiEndpoint = '/api/example-data',
  title = 'Datos de ejemplo',
  showSimulatedToggle = true
}: DataDisplayExampleProps) {
  const [forceError, setForceError] = useState(false);
  
  // Función para cargar datos reales desde la API
  const loadRealData = async (): Promise<ExampleData[]> => {
    // Si se está forzando un error, simular uno
    if (forceError) {
      throw new Error('Error forzado para demostración');
    }
    
    const response = await fetch(apiEndpoint);
    if (!response.ok) {
      throw new Error(`Error cargando datos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  };
  
  // Función para generar datos simulados
  const getMockData = (): ExampleData[] => {
    return [
      { id: 'mock-1', title: 'Ejemplo 1', description: 'Datos simulados para ejemplo', value: 42 },
      { id: 'mock-2', title: 'Ejemplo 2', description: 'Más datos simulados', value: 73 },
      { id: 'mock-3', title: 'Ejemplo 3', description: 'Otro elemento simulado', value: 19 },
      { id: 'mock-4', title: 'Ejemplo 4', description: 'Último ejemplo simulado', value: 88 },
    ];
  };
  
  // Usar el hook para cargar los datos con manejo de errores y datos simulados
  const {
    data,
    isLoading,
    error,
    isSimulatedData,
    reloadData,
    switchToMockData,
    switchToRealData
  } = useDataWithFallback<ExampleData[]>({
    loadData: loadRealData,
    getMockData,
    localStorageKey: 'use_simulated_example_data'
  });
  
  // Contenido principal del componente usando los datos
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (error && !data) {
      return (
        <DataErrorFallback
          error={error}
          onRetry={() => reloadData(false)}
          onUseMockData={switchToMockData}
          mockDataButtonText="Ver datos de ejemplo"
        />
      );
    }
    
    return (
      <div className="space-y-4">
        {isSimulatedData && (
          <SimulatedDataBanner
            message="Mostrando datos de ejemplo simulados"
            onSwitchToReal={switchToRealData}
            variant="compact"
          />
        )}
        
        {/* Lista de elementos */}
        <div className="space-y-2">
          {data && data.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-neutral-900">{item.title}</h3>
                  <p className="text-sm text-neutral-500">{item.description}</p>
                </div>
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {item.value}
                </div>
              </div>
            </Card>
          ))}
          
          {(!data || data.length === 0) && (
            <div className="text-center p-8 text-neutral-500">
              No hay datos disponibles.
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        
        <div className="flex gap-2">
          {showSimulatedToggle && (
            <Button
              size="sm"
              variant="outline"
              onClick={isSimulatedData ? switchToRealData : switchToMockData}
              className={isSimulatedData ? "border-amber-300 text-amber-700" : ""}
            >
              {isSimulatedData ? "Usar datos reales" : "Usar datos simulados"}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setForceError(!forceError);
              reloadData(false);
            }}
          >
            {forceError ? "Desactivar error" : "Forzar error"}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => reloadData(false)}
          >
            Recargar
          </Button>
        </div>
      </div>
      
      {/* Contenido principal */}
      {renderContent()}
    </div>
  );
}

/**
 * Componente de ejemplo que usa el HOC withDataErrorHandling
 */
export function HocDataDisplayExample() {
  // Este sería un ejemplo de uso del HOC, pero lo implementaremos más adelante
  return null;
} 
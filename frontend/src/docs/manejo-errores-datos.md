# Documentación: Manejo de Errores y Datos Simulados en EmotioX

Este documento explica cómo implementar correctamente el manejo de errores y datos simulados en los componentes que muestran datos en EmotioX. Existen múltiples herramientas que puedes utilizar según las necesidades específicas de tu componente.

## Índice
1. [Componentes específicos](#componentes-específicos)
2. [Hook personalizado](#hook-personalizado)
3. [Higher Order Component (HOC)](#higher-order-component-hoc)
4. [Ejemplos de implementación](#ejemplos-de-implementación)
5. [Mejores prácticas](#mejores-prácticas)

## Componentes específicos

### DataErrorFallback

Componente que muestra un mensaje de error cuando falla la carga de datos, ofreciendo opciones para recargar datos o usar datos simulados.

```tsx
import { DataErrorFallback } from '@/components/common';

<DataErrorFallback
  error={error}
  onRetry={() => loadData()}
  onUseMockData={() => loadMockData()}
  variant="default" // 'default' | 'compact' | 'subtle'
  mockDataButtonText="Usar datos simulados"
/>
```

### SimulatedDataBanner

Componente que muestra un banner para indicar al usuario que está viendo datos simulados.

```tsx
import { SimulatedDataBanner } from '@/components/common';

<SimulatedDataBanner
  message="Estás viendo datos simulados"
  onSwitchToReal={() => loadRealData()}
  variant="default" // 'default' | 'compact' | 'subtle' | 'floating'
  showSwitchOption={true}
/>
```

## Hook personalizado

El hook `useDataWithFallback` proporciona una forma sencilla de gestionar la carga de datos con manejo de errores y fallback a datos simulados.

```tsx
import { useDataWithFallback } from '@/hooks/useDataWithFallback';

function MyDataComponent() {
  const {
    data,
    isLoading,
    error,
    isSimulatedData,
    reloadData,
    switchToMockData,
    switchToRealData
  } = useDataWithFallback({
    loadData: async () => {
      // Función para cargar datos reales
      const response = await fetch('/api/data');
      return response.json();
    },
    getMockData: () => {
      // Función para generar datos simulados
      return [{ id: 1, name: 'Ejemplo simulado' }];
    },
    localStorageKey: 'mi_componente_usar_simulados'
  });

  if (isLoading) return <div>Cargando...</div>;
  
  if (error && !data) {
    return (
      <DataErrorFallback
        error={error}
        onRetry={() => reloadData()}
        onUseMockData={switchToMockData}
      />
    );
  }

  return (
    <>
      {isSimulatedData && (
        <SimulatedDataBanner 
          onSwitchToReal={switchToRealData} 
        />
      )}
      <div>Mis datos: {JSON.stringify(data)}</div>
    </>
  );
}
```

## Higher Order Component (HOC)

El HOC `withDataErrorHandling` envuelve un componente y le proporciona props para manejar la carga de datos, errores y datos simulados.

```tsx
import { withDataErrorHandling } from '@/components/common/withDataErrorHandling';

// Componente base que recibe los props del HOC
function MyComponent({ data, isLoading, error, isSimulatedData, reloadData }) {
  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <div>
      {data && data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={reloadData}>Recargar</button>
    </div>
  );
}

// Componente envuelto con el HOC
export const MyDataComponent = withDataErrorHandling(MyComponent, {
  loadData: async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  getMockData: () => [{ id: 1, name: 'Ejemplo simulado' }],
  showSimulatedBanner: true
});
```

## Ejemplos de implementación

### Ejemplo básico con hook

```tsx
function StatsCard() {
  const {
    data: stats,
    isLoading,
    error,
    isSimulatedData,
    reloadData
  } = useDataWithFallback({
    loadData: () => statsAPI.getStats(),
    getMockData: () => ({
      visits: 1234,
      users: 567,
      conversion: 12.5
    })
  });
  
  if (isLoading) return <StatsCardSkeleton />;
  
  if (error && !stats) {
    return (
      <DataErrorFallback
        error={error}
        onRetry={reloadData}
        variant="compact"
      />
    );
  }
  
  return (
    <div className="relative">
      {isSimulatedData && (
        <SimulatedDataBanner
          variant="compact"
        />
      )}
      <div className="grid grid-cols-3 gap-4">
        <StatItem label="Visitas" value={stats.visits} />
        <StatItem label="Usuarios" value={stats.users} />
        <StatItem label="Conversión" value={`${stats.conversion}%`} />
      </div>
    </div>
  );
}
```

### Ejemplo completo

Consulta el componente `DataDisplayExample` en `frontend/src/components/common/DataDisplayExample.tsx` para ver un ejemplo completo de implementación.

## Mejores prácticas

1. **Centraliza la generación de datos simulados** - Coloca las funciones que generan datos simulados en archivos específicos, como `mock-data.ts`, para mantener la consistencia.

2. **Usa nombres descriptivos para las claves de localStorage** - Por ejemplo, `use_simulated_research_data` en lugar de solo `use_simulated`.

3. **Informa claramente al usuario** - Siempre muestra un indicador cuando se están viendo datos simulados.

4. **Proporciona mecanismos para recargar datos** - Ofrece botones o controles para intentar cargar datos reales.

5. **Mantén los datos simulados realistas** - Los datos simulados deben ser representativos de los datos reales para proporcionar una experiencia útil.

6. **Considera el modo de desarrollo vs. producción** - En producción, debes ser más restrictivo con las opciones de datos simulados. 
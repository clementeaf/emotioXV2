/**
 * Componentes lazy loading simplificados
 * Después de limpieza radical - solo componentes esenciales
 */
import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export const LazyCreateResearchForm = lazy(() => 
  import('@/components/research/research-management/CreateResearchFormOptimized').then(module => ({
    default: module.default || module.CreateResearchFormOptimized
  }))
);

function withLazyLoading<T extends React.ComponentType<any>>(
  Component: React.LazyExoticComponent<T>,
  fallback: React.ReactNode
) {
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

export const CreateResearchFormLazy = withLazyLoading(
  LazyCreateResearchForm,
  <div className="space-y-6 max-w-4xl mx-auto p-6">
    <div className="flex items-center justify-between">
      <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
      <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
    </div>
    <div className="animate-pulse bg-gray-200 h-80 w-full rounded"></div>
  </div>
);

export function usePreloadComponents() {
  const preloadCreateResearchForm = React.useCallback(() => {
    LazyCreateResearchForm;
  }, []);

  const preloadResults = React.useCallback(() => {
    import('@/components/research/CognitiveTaskResults');
    import('@/components/research/SmartVOCResults');
  }, []);

  return {
    preloadCreateResearchForm,
    preloadResults
  };
}
/**
 * Lazy loading components con suspense y error boundaries
 */
import React, { lazy, Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Lazy load de componentes pesados
export const LazyCognitiveTask = lazy(() => 
  import('@/components/research/CognitiveTask').then(module => ({
    default: module.CognitiveTaskForm
  }))
);

export const LazySmartVOC = lazy(() => 
  import('@/components/research/SmartVOC').then(module => ({
    default: module.SmartVOCForm
  }))
);

export const LazyEyeTracking = lazy(() => 
  import('@/components/research/EyeTracking/EyeTrackingForm').then(module => ({
    default: module.EyeTrackingForm
  }))
);

export const LazyCreateResearchForm = lazy(() => 
  import('@/components/research/research-management/CreateResearchFormOptimized').then(module => ({
    default: module.default || module.CreateResearchFormOptimized
  }))
);

export const LazyCognitiveTaskResults = lazy(() => 
  import('@/components/research/CognitiveTaskResults/OptimizedCognitiveResults').then(module => ({
    default: module.OptimizedCognitiveResults
  }))
);

export const LazySmartVOCResults = lazy(() => 
  import('@/components/research/SmartVOCResults').then(module => ({
    default: module.SmartVOCResults
  }))
);

export const LazyGroupedResponsesViewer = lazy(() => 
  import('@/components/research/responses/GroupedResponsesViewer').then(module => ({
    default: module.GroupedResponsesViewer
  }))
);

// Higher Order Component para wrappear componentes lazy con suspense y error boundary
export function withLazyLoading<P extends object>(
  LazyComponent: React.ComponentType<P>,
  fallback?: React.ReactNode,
  errorFallback?: React.ReactNode
) {
  return function LazyWrapper(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback || <LoadingSkeleton />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Componentes envueltos listos para usar
export const CognitiveTaskLazy = withLazyLoading(
  LazyCognitiveTask,
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-8 w-64 rounded"></div>
    <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
  </div>
);

export const SmartVOCLazy = withLazyLoading(
  LazySmartVOC,
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
    <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
  </div>
);

export const EyeTrackingLazy = withLazyLoading(
  LazyEyeTracking,
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-8 w-56 rounded"></div>
    <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
  </div>
);

export const CreateResearchFormLazy = withLazyLoading(
  LazyCreateResearchForm,
  <div className="space-y-6 max-w-4xl mx-auto p-6">
    <div className="flex items-center justify-between">
      <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
      <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
      <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
    </div>
    <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
    <div className="flex justify-between">
      <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
      <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
    </div>
  </div>
);

export const CognitiveTaskResultsLazy = withLazyLoading(
  LazyCognitiveTaskResults,
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-8 w-72 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
      <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
    </div>
  </div>
);

export const SmartVOCResultsLazy = withLazyLoading(
  LazySmartVOCResults,
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-8 w-64 rounded"></div>
    <div className="animate-pulse bg-gray-200 h-96 w-full rounded"></div>
  </div>
);

export const GroupedResponsesViewerLazy = withLazyLoading(
  LazyGroupedResponsesViewer,
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-8 w-56 rounded"></div>
    <div className="animate-pulse bg-gray-200 h-80 w-full rounded"></div>
  </div>
);

// Hook para precargar componentes
export function usePreloadComponents() {
  const preloadCognitiveTask = React.useCallback(() => {
    LazyCognitiveTask;
  }, []);

  const preloadSmartVOC = React.useCallback(() => {
    LazySmartVOC;
  }, []);

  const preloadEyeTracking = React.useCallback(() => {
    LazyEyeTracking;
  }, []);

  const preloadCreateResearchForm = React.useCallback(() => {
    LazyCreateResearchForm;
  }, []);

  const preloadResults = React.useCallback(() => {
    LazyCognitiveTaskResults;
    LazySmartVOCResults;
    LazyGroupedResponsesViewer;
  }, []);

  const preloadAll = React.useCallback(() => {
    preloadCognitiveTask();
    preloadSmartVOC();
    preloadEyeTracking();
    preloadCreateResearchForm();
    preloadResults();
  }, [
    preloadCognitiveTask,
    preloadSmartVOC,
    preloadEyeTracking,
    preloadCreateResearchForm,
    preloadResults
  ]);

  return {
    preloadCognitiveTask,
    preloadSmartVOC,
    preloadEyeTracking,
    preloadCreateResearchForm,
    preloadResults,
    preloadAll
  };
}
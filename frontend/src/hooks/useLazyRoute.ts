import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook para manejar navegación con lazy loading inteligente
 */
export function useLazyRoute() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [preloadedRoutes, setPreloadedRoutes] = useState(new Set<string>());

  // Precargar una ruta específica
  const preloadRoute = useCallback((route: string) => {
    if (preloadedRoutes.has(route)) return;

    // Precargar el componente basado en la ruta
    switch (true) {
      case route.includes('/cognitive-task'):
        import('@/components/research/CognitiveTask');
        break;
      case route.includes('/smart-voc'):
        import('@/components/research/SmartVOC');
        break;
      case route.includes('/eye-tracking'):
        import('@/components/research/EyeTracking/EyeTrackingForm');
        break;
      case route.includes('/new'):
        import('@/components/research/CreateResearchFormOptimized');
        break;
      case route.includes('/results'):
        import('@/components/research/CognitiveTaskResults/OptimizedCognitiveResults');
        import('@/components/research/SmartVOCResults');
        break;
      default:
        break;
    }

    setPreloadedRoutes(prev => new Set(Array.from(prev).concat([route])));
  }, [preloadedRoutes]);

  // Navegación con preload
  const navigateWithPreload = useCallback(async (route: string) => {
    setIsNavigating(true);
    
    // Precargar antes de navegar
    preloadRoute(route);
    
    // Pequeño delay para permitir que el preload inicie
    await new Promise(resolve => setTimeout(resolve, 100));
    
    router.push(route);
    setIsNavigating(false);
  }, [router, preloadRoute]);

  // Precargar rutas comunes al montar
  useEffect(() => {
    const commonRoutes = [
      '/dashboard',
      '/dashboard/research/new'
    ];

    // Precargar después de un delay para no bloquear la carga inicial
    const timer = setTimeout(() => {
      commonRoutes.forEach(route => {
        if (!preloadedRoutes.has(route)) {
          preloadRoute(route);
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [preloadRoute, preloadedRoutes]);

  return {
    isNavigating,
    navigateWithPreload,
    preloadRoute,
    preloadedRoutes: Array.from(preloadedRoutes)
  };
}

/**
 * Hook para precargar componentes basado en hover
 */
export function useHoverPreload() {
  const [preloadTimer, setPreloadTimer] = useState<NodeJS.Timeout | null>(null);

  const onHoverStart = useCallback((componentImport: () => Promise<any>) => {
    // Precargar después de 200ms de hover
    const timer = setTimeout(() => {
      componentImport().catch(() => {});
    }, 200);
    
    setPreloadTimer(timer);
  }, []);

  const onHoverEnd = useCallback(() => {
    if (preloadTimer) {
      clearTimeout(preloadTimer);
      setPreloadTimer(null);
    }
  }, [preloadTimer]);

  return {
    onHoverStart,
    onHoverEnd
  };
}

/**
 * Hook para optimización de bundle splitting
 */
export function useBundleOptimization() {
  const [loadedChunks, setLoadedChunks] = useState(new Set<string>());

  const trackChunkLoad = useCallback((chunkName: string) => {
    setLoadedChunks(prev => new Set(Array.from(prev).concat([chunkName])));
  }, []);

  const getLoadedChunks = useCallback(() => {
    return Array.from(loadedChunks);
  }, [loadedChunks]);

  const preloadCriticalChunks = useCallback(() => {
    // Precargar chunks críticos
    const criticalImports = [
      () => import('@/components/ui/Button'),
      () => import('@/components/ui/Input'),
      () => import('@/components/ui/LoadingSkeleton'),
    ];

    criticalImports.forEach((importFn, index) => {
      setTimeout(() => {
        importFn().then(() => {
          trackChunkLoad(`critical-${index}`);
        }).catch(() => {});
      }, index * 100);
    });
  }, [trackChunkLoad]);

  useEffect(() => {
    // Precargar chunks críticos después de la carga inicial
    const timer = setTimeout(preloadCriticalChunks, 1000);
    return () => clearTimeout(timer);
  }, [preloadCriticalChunks]);

  return {
    loadedChunks: getLoadedChunks(),
    trackChunkLoad,
    preloadCriticalChunks
  };
}
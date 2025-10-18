import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingPage } from '../components/commons';
import ProtectedRoute from '../components/ProtectedRoute';
import LayoutWrapper from '../components/LayoutWrapper';
import type { RouteConfig, RouteMappingResult } from '../config/types';


/**
 * Map route configuration to React Router elements
 * This function makes routes iterable and mappable
 */
export const mapRouteToElement = (
  route: RouteConfig
): RouteMappingResult => {
  const { path, element: Component, requiresAuth, loadingMessage } = route;

  let element = (
    <Suspense fallback={<LoadingPage message={loadingMessage || 'Cargando...'} />}>
      <Component />
    </Suspense>
  );

  if (requiresAuth) {
    element = (
      <ProtectedRoute>
        <LayoutWrapper>
          {element}
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  return {
    path,
    element,
    metadata: {
      title: route.title || 'EmotioX',
      description: route.description || '',
      loadingMessage: route.loadingMessage || 'Cargando...'
    }
  };
};

/**
 * Map multiple routes to elements
 * Makes the entire routing system iterable
 */
export const mapRoutesToElements = (
  routes: RouteConfig[]
): RouteMappingResult[] => {
  return routes.map(route => mapRouteToElement(route));
};

/**
 * Create a redirect route
 */
const createRedirectRoute = (from: string, to: string) => ({
  path: from,
  element: <Navigate to={to} replace />
});

export { createRedirectRoute };

/**
 * Filter routes by authentication requirement
 */
export const filterRoutesByAuth = (
  routes: RouteConfig[], 
  isAuthenticated: boolean
): RouteConfig[] => {
  return routes.filter(route => {
    if (route.requiresAuth) {
      return isAuthenticated;
    }
    return true;
  });
};

/**
 * Get route metadata for navigation
 */
export const getRouteMetadata = (path: string, routes: RouteConfig[]): RouteConfig | undefined => {
  return routes.find(route => route.path === path);
};

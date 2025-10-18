import { describe, it, expect, vi } from 'vitest';
// import { render } from '../../test/utils';
import {
  mapRouteToElement,
  mapRoutesToElements,
  createRedirectRoute,
  filterRoutesByAuth,
  getRouteMetadata
} from '../routeMapper';
import type { RouteConfig } from '../../config/types';

// Mock components
const MockComponent = () => <div>Mock Component</div>;

// Mock the layout component
vi.mock('../../components/layout', () => ({
  LazyLayout: ({ children }: any) => <div data-testid="layout">{children}</div>
}));

// Mock the commons components
vi.mock('../../components/commons', () => ({
  LoadingPage: ({ message }: any) => <div data-testid="loading">{message}</div>
}));

// Mock ProtectedRoute
vi.mock('../../components/ProtectedRoute', () => ({
  default: ({ children }: any) => <div data-testid="protected">{children}</div>
}));

describe('routeMapper', () => {
  const mockRoute: RouteConfig = {
    path: '/test',
    element: MockComponent,
    isPublic: true,
    title: 'Test Route',
    description: 'Test description',
    loadingMessage: 'Loading test...'
  };

  describe('mapRouteToElement', () => {
    it('maps route to element with basic props', () => {
      const result = mapRouteToElement(mockRoute);

      expect(result.path).toBe('/test');
      expect(result.metadata.title).toBe('Test Route');
      expect(result.metadata.description).toBe('Test description');
      expect(result.metadata.loadingMessage).toBe('Loading test...');
    });

    it('maps route with layout', () => {
      const routeWithLayout: RouteConfig = {
        ...mockRoute,
        layout: 'LazyLayout'
      };

      const result = mapRouteToElement(routeWithLayout);

      expect(result.path).toBe('/test');
      expect(result.element).toBeDefined();
    });

    it('maps route with authentication requirement', () => {
      const protectedRoute: RouteConfig = {
        ...mockRoute,
        requiresAuth: true
      };

      const result = mapRouteToElement(protectedRoute);

      expect(result.path).toBe('/test');
      expect(result.element).toBeDefined();
    });

    it('maps route with both layout and auth', () => {
      const fullRoute: RouteConfig = {
        ...mockRoute,
        layout: 'LazyLayout',
        requiresAuth: true
      };

      const result = mapRouteToElement(fullRoute);

      expect(result.path).toBe('/test');
      expect(result.element).toBeDefined();
    });
  });

  describe('mapRoutesToElements', () => {
    it('maps multiple routes to elements', () => {
      const routes: RouteConfig[] = [
        mockRoute,
        { ...mockRoute, path: '/test2' }
      ];

      const results = mapRoutesToElements(routes);

      expect(results).toHaveLength(2);
      expect(results[0].path).toBe('/test');
      expect(results[1].path).toBe('/test2');
    });

    it('handles empty routes array', () => {
      const results = mapRoutesToElements([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('createRedirectRoute', () => {
    it('creates redirect route with correct path', () => {
      const redirect = createRedirectRoute('/old', '/new');
      
      expect(redirect.path).toBe('/old');
      expect(redirect.element).toBeDefined();
    });

    it('creates redirect route with replace attribute', () => {
      const redirect = createRedirectRoute('/old', '/new');
      
      expect(redirect.element).toBeDefined();
    });
  });

  describe('filterRoutesByAuth', () => {
    it('filters routes by authentication requirement', () => {
      const routes: RouteConfig[] = [
        { ...mockRoute, requiresAuth: true },
        { ...mockRoute, path: '/public', requiresAuth: false },
        { ...mockRoute, path: '/another', requiresAuth: true }
      ];

      const authenticatedRoutes = filterRoutesByAuth(routes, true);
      const publicRoutes = filterRoutesByAuth(routes, false);

      expect(authenticatedRoutes).toHaveLength(3); // All routes when authenticated
      expect(publicRoutes).toHaveLength(1); // Only public route when not authenticated
    });

    it('handles routes without auth requirement', () => {
      const routes: RouteConfig[] = [
        { ...mockRoute, isPublic: true },
        { ...mockRoute, path: '/another', isPublic: true }
      ];

      const publicRoutes = filterRoutesByAuth(routes, false);
      
      expect(publicRoutes).toHaveLength(2);
    });
  });

  describe('getRouteMetadata', () => {
    it('gets route metadata by path', () => {
      const routes: RouteConfig[] = [
        mockRoute,
        { ...mockRoute, path: '/another' }
      ];

      const metadata = getRouteMetadata('/test', routes);
      
      expect(metadata).toEqual(mockRoute);
    });

    it('returns undefined for non-existent path', () => {
      const routes: RouteConfig[] = [mockRoute];
      
      const metadata = getRouteMetadata('/nonexistent', routes);
      
      expect(metadata).toBeUndefined();
    });

    it('handles empty routes array', () => {
      const metadata = getRouteMetadata('/test', []);
      
      expect(metadata).toBeUndefined();
    });
  });
});
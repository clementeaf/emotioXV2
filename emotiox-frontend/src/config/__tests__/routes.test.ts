import { describe, it, expect } from 'vitest';
import {
  routes,
  getPublicRoutes,
  getProtectedRoutes,
  getRouteByPath,
  getAllPaths,
  getRoutesByLayout
} from '../routes';

describe('Routes Configuration', () => {
  describe('routes array', () => {
    it('has correct number of routes', () => {
      expect(routes).toHaveLength(2);
    });

    it('has login route', () => {
      const loginRoute = routes.find(route => route.path === '/login');
      expect(loginRoute).toBeDefined();
      expect(loginRoute?.isPublic).toBe(true);
      expect(loginRoute?.title).toBe('Iniciar Sesión');
    });

    it('has dashboard route', () => {
      const dashboardRoute = routes.find(route => route.path === '/dashboard');
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute?.requiresAuth).toBe(true);
    });
  });

  describe('getPublicRoutes', () => {
    it('returns only public routes', () => {
      const publicRoutes = getPublicRoutes();
      
      expect(publicRoutes).toHaveLength(1);
      expect(publicRoutes[0].path).toBe('/login');
      expect(publicRoutes[0].isPublic).toBe(true);
    });

    it('filters out protected routes', () => {
      const publicRoutes = getPublicRoutes();
      
      const protectedRoutes = publicRoutes.filter(route => route.requiresAuth);
      expect(protectedRoutes).toHaveLength(0);
    });
  });

  describe('getProtectedRoutes', () => {
    it('returns only protected routes', () => {
      const protectedRoutes = getProtectedRoutes();
      
      expect(protectedRoutes).toHaveLength(1);
      expect(protectedRoutes[0].path).toBe('/dashboard');
      expect(protectedRoutes[0].requiresAuth).toBe(true);
    });

    it('filters out public routes', () => {
      const protectedRoutes = getProtectedRoutes();
      
      const publicRoutes = protectedRoutes.filter(route => route.isPublic);
      expect(publicRoutes).toHaveLength(0);
    });
  });

  describe('getRouteByPath', () => {
    it('finds route by path', () => {
      const loginRoute = getRouteByPath('/login');
      const dashboardRoute = getRouteByPath('/dashboard');
      
      expect(loginRoute?.path).toBe('/login');
      expect(dashboardRoute?.path).toBe('/dashboard');
    });

    it('returns undefined for non-existent path', () => {
      const route = getRouteByPath('/nonexistent');
      
      expect(route).toBeUndefined();
    });

    it('handles empty string path', () => {
      const route = getRouteByPath('');
      
      expect(route).toBeUndefined();
    });
  });

  describe('getAllPaths', () => {
    it('returns all route paths', () => {
      const paths = getAllPaths();
      
      expect(paths).toHaveLength(2);
      expect(paths).toContain('/login');
      expect(paths).toContain('/dashboard');
    });

    it('returns paths in correct order', () => {
      const paths = getAllPaths();
      
      expect(paths[0]).toBe('/login');
      expect(paths[1]).toBe('/dashboard');
    });
  });

  describe('getRoutesByLayout', () => {
    it('returns routes with specific layout', () => {
      const lazyLayoutRoutes = getRoutesByLayout('LazyLayout');

      // Since layout is now automatic for protected routes, this should return empty
      expect(lazyLayoutRoutes).toHaveLength(0);
    });

    it('returns empty array for non-existent layout', () => {
      const routes = getRoutesByLayout('NonExistentLayout');

      expect(routes).toHaveLength(0);
    });

    it('handles undefined layout', () => {
      const routes = getRoutesByLayout(undefined as any);

      // Routes without explicit layout property
      expect(routes).toHaveLength(2);
    });
  });

  describe('route properties', () => {
    it('has correct properties for login route', () => {
      const loginRoute = routes[0];
      
      expect(loginRoute.path).toBe('/login');
      expect(loginRoute.isPublic).toBe(true);
      expect(loginRoute.requiresAuth).toBeUndefined();
      expect(loginRoute.title).toBe('Iniciar Sesión');
      expect(loginRoute.description).toBe('Página de autenticación');
      expect(loginRoute.loadingMessage).toBe('Cargando login...');
    });

    it('has correct properties for dashboard route', () => {
      const dashboardRoute = routes[1];

      expect(dashboardRoute.path).toBe('/dashboard');
      expect(dashboardRoute.isPublic).toBe(false);
      expect(dashboardRoute.requiresAuth).toBe(true);
      expect(dashboardRoute.title).toBe('Dashboard');
      expect(dashboardRoute.description).toBe('Panel principal de la aplicación');
      expect(dashboardRoute.loadingMessage).toBe('Cargando dashboard...');
      // Layout is now automatic for protected routes, no explicit property needed
    });
  });
});

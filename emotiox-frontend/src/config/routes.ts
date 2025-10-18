import { lazy } from 'react';
import type { RouteConfig } from './types';

// Lazy load pages for better performance
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard.tsx'));
const ResearchPage = lazy(() => import('../pages/ResearchPage.tsx'));
const NewResearchPage = lazy(() => import('../pages/NewResearchPage.tsx'));

/**
 * Route configuration as iterable object
 * Each route can be mapped and iterated over
 */
export const routes: RouteConfig[] = [
  {
    path: '/login',
    element: Login,
    isPublic: true,
    title: 'Iniciar Sesión',
    description: 'Página de autenticación',
    loadingMessage: 'Cargando login...'
  },
  {
    path: '/dashboard',
    element: Dashboard,
    isPublic: false,
    requiresAuth: true,
    title: 'Dashboard',
    description: 'Panel principal de la aplicación',
    loadingMessage: 'Cargando dashboard...'
  },
  {
    path: '/dashboard/new-research',
    element: NewResearchPage,
    isPublic: false,
    requiresAuth: true,
    title: 'Nueva Investigación',
    description: 'Crear nueva investigación',
    loadingMessage: 'Cargando nueva investigación...'
  },
  {
    path: '/research',
    element: ResearchPage,
    isPublic: false,
    requiresAuth: true,
    title: 'Investigación',
    description: 'Página de investigación específica',
    loadingMessage: 'Cargando investigación...'
  }
];

/**
 * Get routes by visibility (public/private)
 */
export const getPublicRoutes = (): RouteConfig[] => 
  routes.filter(route => route.isPublic);

export const getProtectedRoutes = (): RouteConfig[] => 
  routes.filter(route => route.requiresAuth);

/**
 * Get route by path
 */
export const getRouteByPath = (path: string): RouteConfig | undefined =>
  routes.find(route => route.path === path);

/**
 * Get all route paths
 */
export const getAllPaths = (): string[] =>
  routes.map(route => route.path);

/**
 * Get routes with specific layout
 */
export const getRoutesByLayout = (layout: string): RouteConfig[] =>
  routes.filter(route => route.layout === layout);

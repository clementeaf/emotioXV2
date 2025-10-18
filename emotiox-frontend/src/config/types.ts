import type { ComponentType, LazyExoticComponent } from 'react';
import React from 'react';

/**
 * Route configuration interface
 */
export interface RouteConfig {
  path: string;
  element: ComponentType<any> | LazyExoticComponent<ComponentType<any>>;
  isPublic?: boolean;
  requiresAuth?: boolean;
  title?: string;
  description?: string;
  loadingMessage?: string;
  layout?: string;
  exact?: boolean;
  redirectTo?: string;
}

/**
 * Route metadata interface
 */
export interface RouteMetadata {
  title: string;
  description: string;
  loadingMessage: string;
}

/**
 * Layout configuration interface
 */
export interface LayoutConfig {
  name: string;
  component: ComponentType<any>;
  requiresAuth?: boolean;
}

/**
 * Route mapping result interface
 */
export interface RouteMappingResult {
  path: string;
  element: React.ReactElement;
  metadata: RouteMetadata;
}

import type { ReactNode } from 'react';

/**
 * User interface for layout components
 */
export interface User {
  name: string;
  initials: string;
  avatar?: string;
}

/**
 * Layout component props
 */
export interface LayoutProps {
  children?: ReactNode;
  user?: User;
  researchId?: string | null;
}

/**
 * Upbar component props
 */
export interface UpbarProps {
  user?: User;
}

/**
 * MainContent component props
 */
export interface MainContentProps {
  children?: ReactNode;
  layout?: 'single' | 'double';
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

/**
 * ResearchSidebar component props
 */
export interface ResearchSidebarProps {
  researchId: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

/**
 * Card component props
 */
export interface CardProps {
  children?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Padding options for Card component
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

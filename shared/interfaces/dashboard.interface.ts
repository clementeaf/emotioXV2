/**
 * Interfaces para el módulo de dashboard
 */

/**
 * Datos de investigación para el dashboard
 */
export interface ResearchData {
  id: string;
  name: string;
  technique?: string;
  createdAt?: string;
  status?: string;
}

/**
 * Investigación activa en el dashboard
 */
export interface ActiveResearch {
  id: string;
  name: string;
}

/**
 * Configuración del dashboard
 */
export interface DashboardConfig {
  researchId?: string;
  section?: string;
  isAimFramework: boolean;
  activeResearch?: ActiveResearch;
}

/**
 * Props para componentes de dashboard
 */
export interface DashboardStatsProps {
  totalResearch?: number;
  inProgress?: number;
  completed?: number;
  participants?: number;
}

/**
 * Props para el shell del dashboard
 */
export interface DashboardShellProps {
  children: any; // React.ReactNode when used in React context
}

/**
 * Props para el layout del dashboard
 */
export interface DashboardLayoutProps {
  researchId?: string;
  section?: string;
  isAimFramework?: boolean;
}

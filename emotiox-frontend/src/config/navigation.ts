import { 
  BarChart3, 
  FlaskConical, 
  Settings, 
  Building2, 
  Wrench,
  Users, 
  FileText, 
  TestTube, 
  TrendingUp,
  Download,
  Database,
  FileBarChart
} from 'lucide-react';

/**
 * Navigation items for the main sidebar
 */
export const mainNavigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/dashboard/new-research', label: 'Nueva Investigación', icon: FlaskConical },
  { path: '/dashboard/research/config', label: 'Configuración', icon: Settings },
  { path: '/dashboard/companies', label: 'Empresas', icon: Building2 },
  { path: '/dashboard/settings', label: 'Configuraciones', icon: Wrench }
];

/**
 * Research sections configuration
 */
export const researchSections = [
  {
    id: 'overview',
    title: 'Resumen',
    stages: [
      { id: 'overview', title: 'Vista General', icon: BarChart3 },
      { id: 'participants', title: 'Participantes', icon: Users },
      { id: 'results', title: 'Resultados', icon: TrendingUp }
    ]
  },
  {
    id: 'configuration',
    title: 'Configuración',
    stages: [
      { id: 'settings', title: 'Configuración General', icon: Settings },
      { id: 'techniques', title: 'Técnicas', icon: TestTube },
      { id: 'modules', title: 'Módulos', icon: FileText }
    ]
  },
  {
    id: 'analysis',
    title: 'Análisis',
    stages: [
      { id: 'data', title: 'Datos', icon: Database },
      { id: 'reports', title: 'Reportes', icon: FileBarChart },
      { id: 'export', title: 'Exportar', icon: Download }
    ]
  }
];

/**
 * Navigation item interface
 */
export interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Research stage interface
 */
export interface ResearchStage {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Research section interface
 */
export interface ResearchSection {
  id: string;
  title: string;
  stages: ResearchStage[];
}

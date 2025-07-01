/**
 * Interfaces relacionadas con las investigaciones
 */

/**
 * Estructura de un proyecto de investigación
 * Esta interfaz define la estructura básica de un proyecto de investigación
 * que se utilizará en componentes como ResearchTable, Sidebar, etc.
 */
export interface ResearchProject {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  progress: number;
  type?: string;
  technique?: string;
}

/**
 * Props para el componente ResearchTable
 */
export interface ResearchTableProps {
  className?: string;
  showActions?: boolean;
}

/**
 * Props para cualquier componente que muestre información de investigación
 */
export interface ResearchViewProps {
  researchId?: string;
  className?: string;
}

/**
 * Interfaz para tipos de investigación (usado en ResearchTypes)
 */
export interface ResearchType {
  name: string;
  count: number;
  color: string;
}

/**
 * Props para el componente ResearchTypes
 */
export interface ResearchTypesProps {
  className?: string;
}

/**
 * Interfaz para la lista de investigaciones en el componente clients/ResearchList
 */
export interface ClientResearch {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  date: string;
  researcher: string;
}

/**
 * Props para el componente ResearchList
 */
export interface ResearchListProps {
  className?: string;
  data?: ClientResearch[];
}

/**
 * Interfaz para el borrador de investigación (usado en useResearchStore y ResearchProvider)
 */
export interface ResearchDraft {
  id: string;
  step: 'basic' | 'configuration' | 'review';
  data: {
    basic?: {
      title?: string;
      description?: string;
      type?: string;
      name?: string;
      enterprise?: string;
    };
    configuration?: {
      technique?: string;
      [key: string]: any;
    };
  };
  lastUpdated: Date;
}

/**
 * Interfaz para el store de investigación
 */
export interface ResearchStore {
  currentDraft: ResearchDraft | null;
  hasDraft: boolean;

  createDraft: () => ResearchDraft;
  updateDraft: (data: Partial<ResearchDraft['data']>, step: ResearchDraft['step']) => void;
  clearDraft: () => void;
  getDraft: () => ResearchDraft | null;
}



/**
 * Interfaz para las secciones del sidebar
 */
export interface ResearchSection {
  id: string;
  title: string;
  stages?: {
    id: string;
    title: string;
  }[];
}

/**
 * Contexto de investigación
 */
export interface ResearchContextType {
  currentDraft: ResearchDraft | null;
  hasDraft: boolean;
  createDraft: () => ResearchDraft;
  updateDraft: (data: Partial<ResearchDraft['data']>, step: ResearchDraft['step']) => void;
  clearDraft: () => void;
  getDraft: () => ResearchDraft | null;
}

// Research stages configuration - centralized and reusable
import { BUILD_STAGES, STAGE_TITLES, STAGE_COMPONENTS } from './stages-registry';
import { RESEARCH_TECHNIQUES, TECHNIQUE_BUILD_SEQUENCES, getTechniqueStages } from './techniques-registry';

export interface StageConfig {
  id: string;
  title: string;
}

export interface ResearchSection {
  id: string;
  title: string;
  stages: StageConfig[];
}

// Re-export from unified registries
export { BUILD_STAGES, STAGE_TITLES, STAGE_COMPONENTS };
export { RESEARCH_TECHNIQUES, TECHNIQUE_BUILD_SEQUENCES };

export type ResearchTechnique = string; // Now any string since techniques are dynamic

// Base sections structure - BUILD stages will be dynamic based on technique
export const BASE_SECTIONS: ResearchSection[] = [
  {
    id: 'build',
    title: 'Build',
    stages: [] // Will be populated dynamically
  },
  {
    id: 'recruit',
    title: 'Recruit',
    stages: [
      { id: 'eye-tracking-recruit', title: 'Configuración de estudio' }
    ]
  },
  {
    id: 'results',
    title: 'Results',
    stages: [
      { id: 'smart-voc-results', title: 'SmartVOC' },
      { id: 'cognitive-task-results', title: 'Cognitive Task' }
    ]
  },
  {
    id: 'research-status',
    title: 'Research Status',
    stages: [
      { id: 'research-in-progress', title: 'Investigación en curso' }
    ]
  },
];

// Function to get BUILD stages based on research technique
export const getBuildStages = (technique: string): StageConfig[] => {
  const stages = getTechniqueStages(technique);
  return stages.map((stageKey: string) => BUILD_STAGES[stageKey as keyof typeof BUILD_STAGES]).filter(Boolean);
};


// Default values and constants
export const DEFAULT_SECTION = 'welcome-screen';

// Component rendering configuration interface (moved to stages-registry.ts)
export interface StageComponentConfig {
  component: string;
  props?: Record<string, any>;
  containerStyles?: React.CSSProperties;
}
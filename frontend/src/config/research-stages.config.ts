// Research stages configuration - centralized and reusable

export interface StageConfig {
  id: string;
  title: string;
}

export interface ResearchSection {
  id: string;
  title: string;
  stages: StageConfig[];
}

// Available BUILD stages - easy to add new ones
export const BUILD_STAGES = {
  'screener': { id: 'screener', title: 'Screener' },
  'welcome-screen': { id: 'welcome-screen', title: 'Welcome Screen' },
  'implicit-association': { id: 'implicit-association', title: 'Implicit Association' },
  'smart-voc': { id: 'smart-voc', title: 'Smart VOC' },
  'cognitive': { id: 'cognitive', title: 'Cognitive Tasks' },
  'thank-you': { id: 'thank-you', title: 'Thank You Screen' }
} as const;

// Research technique constants
export const RESEARCH_TECHNIQUES = {
  DEFAULT: 'default',
  BIOMETRIC_COGNITIVE: 'biometric-cognitive',
  EYE_TRACKING: 'eye-tracking'
} as const;

export type ResearchTechnique = typeof RESEARCH_TECHNIQUES[keyof typeof RESEARCH_TECHNIQUES];

// Stage sequences for different techniques - easy to modify
export const TECHNIQUE_BUILD_SEQUENCES: Record<string, string[]> = {
  [RESEARCH_TECHNIQUES.DEFAULT]: [
    'welcome-screen',
    'smart-voc',
    'cognitive',
    'thank-you'
  ],
  [RESEARCH_TECHNIQUES.BIOMETRIC_COGNITIVE]: [
    'screener',
    'welcome-screen',
    'implicit-association',
    'smart-voc',
    'cognitive',
    'thank-you'
  ]
};

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
  const sequence = TECHNIQUE_BUILD_SEQUENCES[technique] || TECHNIQUE_BUILD_SEQUENCES[RESEARCH_TECHNIQUES.DEFAULT];
  return sequence.map((stageKey: string) => BUILD_STAGES[stageKey as keyof typeof BUILD_STAGES]);
};

// Centralized stage titles for ResearchStageManager
export const STAGE_TITLES: Record<string, string> = {
  // Build stages
  'screener': 'Configuración de Screener',
  'welcome-screen': 'Configuración de pantalla de bienvenida',
  'implicit-association': 'Configuración de Asociación Implícita',
  'smart-voc': 'Configuración de Smart VOC',
  'cognitive': 'Configuración de tareas cognitivas',
  'thank-you': 'Configuración de pantalla de agradecimiento',

  // Recruit stages
  'eye-tracking': 'Configuración de seguimiento ocular',
  'eye-tracking-recruit': 'Configuración de estudio',
  'configuration': 'Configuración del Reclutamiento',
  'participants': 'Gestión de Participantes',

  // Results stages
  'smart-voc-results': 'Resultados de SmartVOC',
  'cognitive-task-results': 'Resultados de Tareas Cognitivas',

  // Research Status
  'research-in-progress': 'Investigación en curso',

  // Default
  'default': 'Configuración de investigación'
};

// Default values and constants
export const DEFAULT_SECTION = 'welcome-screen';

// Component rendering configuration
export interface StageComponentConfig {
  component: string;
  props?: Record<string, any>;
  containerStyles?: React.CSSProperties;
}

// Centralized component mapping for ResearchStageManager
export const STAGE_COMPONENTS: Record<string, StageComponentConfig> = {
  // Build stages
  'screener': {
    component: 'ScreenerForm'
  },
  'welcome-screen': {
    component: 'WelcomeScreenForm'
  },
  'smart-voc': {
    component: 'SmartVOCForm',
    containerStyles: { maxWidth: '768px', width: '100%' }
  },
  'cognitive': {
    component: 'CognitiveTaskForm',
    containerStyles: { maxWidth: '768px', width: '100%' }
  },
  'thank-you': {
    component: 'ThankYouScreenForm'
  },

  // Recruit stages
  'eye-tracking': {
    component: 'DisabledEyeTrackingForm'
  },
  'eye-tracking-recruit': {
    component: 'RecruitEyeTrackingForm'
  },
  'configuration': {
    component: 'ConfigurationPlaceholder'
  },
  'participants': {
    component: 'ParticipantsPlaceholder'
  },

  // Results stages
  'smart-voc-results': {
    component: 'SmartVOCResults'
  },
  'cognitive-task-results': {
    component: 'CognitiveTaskResults'
  },

  // Research Status
  'research-in-progress': {
    component: 'ResearchInProgressPage',
    props: { standalone: true }
  },

  // Default
  'default': {
    component: 'DefaultPlaceholder'
  }
};
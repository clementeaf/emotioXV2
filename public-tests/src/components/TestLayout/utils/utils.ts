import { AvailableFormsResponse, StepConfiguration } from '../../../lib/types';

export const QUESTION_TYPE_MAP = {
  // Screens especiales
  welcome_screen: 'screen',
  thank_you_screen: 'screen',

  // Demographics
  demographics: 'demographics',

  // SmartVOC questions
  smartvoc: 'smartvoc',
  smartvoc_csat: 'smartvoc_csat',
  smartvoc_ces: 'smartvoc_ces',
  smartvoc_cv: 'smartvoc_cv',
  smartvoc_nev: 'smartvoc_nev',
  smartvoc_nps: 'smartvoc_nps',
  smartvoc_voc: 'smartvoc_voc',

  // Cognitive Task questions
  cognitive_short_text: 'cognitive_short_text',
  cognitive_long_text: 'cognitive_long_text',
  cognitive_multiple_choice: 'cognitive_multiple_choice',
  cognitive_single_choice: 'cognitive_single_choice',
  cognitive_linear_scale: 'cognitive_linear_scale',
  cognitive_rating: 'cognitive_rating',
  cognitive_ranking: 'cognitive_ranking',
  cognitive_navigation_flow: 'cognitive_navigation_flow',
  cognitive_preference_test: 'cognitive_preference_test',

  // Tipos adicionales para StepsComponents
  scale: 'scale',
  hierarchy: 'hierarchy',
  detailed: 'detailed',
  text: 'text',
  choice: 'choice',
  pending: 'pending'
} as const;

export type QuestionType = typeof QUESTION_TYPE_MAP[keyof typeof QUESTION_TYPE_MAP];

/**
 * Obtiene el step data actual basado en el questionKey
 */
export const getCurrentStepData = (
  formsData: AvailableFormsResponse | undefined,
  currentQuestionKey: string
): StepConfiguration | undefined => {
  if (!formsData?.stepsConfiguration) {
    return undefined;
  }

  return formsData.stepsConfiguration.find(
    (step: StepConfiguration) => step.questionKey === currentQuestionKey
  );
};

/**
 * Obtiene el tipo de componente basado en el questionKey y contentConfiguration
 */
export const getQuestionType = (questionKey: string, contentConfiguration?: Record<string, unknown>): QuestionType => {
  // 🎯 FIX: Mapeo dinámico basado en contentConfiguration.type
  if (contentConfiguration?.type) {
    const type = String(contentConfiguration.type);
    
    // Mapear tipos cognitivos
    if (type === 'short_text') return 'cognitive_short_text';
    if (type === 'long_text') return 'cognitive_long_text';
    if (type === 'single_choice') return 'cognitive_single_choice';
    if (type === 'multiple_choice') return 'cognitive_multiple_choice';
    if (type === 'linear_scale') return 'cognitive_linear_scale';
    if (type === 'ranking') return 'cognitive_ranking';
    if (type === 'navigation_flow') return 'cognitive_navigation_flow';
    if (type === 'preference_test') return 'cognitive_preference_test';
    
    // Mapear tipos SmartVOC
    if (type === 'smartvoc_csat') return 'smartvoc_csat';
    if (type === 'smartvoc_ces') return 'smartvoc_ces';
    if (type === 'smartvoc_cv') return 'smartvoc_cv';
    if (type === 'smartvoc_nev') return 'smartvoc_nev';
    if (type === 'smartvoc_nps') return 'smartvoc_nps';
    if (type === 'smartvoc_voc') return 'smartvoc_voc';
  }
  
  // Fallback al mapeo original
  return QUESTION_TYPE_MAP[questionKey as keyof typeof QUESTION_TYPE_MAP] || 'unknown';
};

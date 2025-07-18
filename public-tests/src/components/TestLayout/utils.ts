import { AvailableFormsResponse, StepConfiguration } from '../../lib/types';

export const QUESTION_TYPE_MAP = {
  // Screens especiales
  welcome_screen: 'screen',
  thank_you_screen: 'screen',

  // Demographics
  demographics: 'demographics',

  // SmartVOC questions
  smartvoc_csat: 'smartvoc',
  smartvoc_ces: 'smartvoc',
  smartvoc_cv: 'smartvoc',
  smartvoc_nps: 'smartvoc',
  smartvoc_nc: 'smartvoc',
  smartvoc_nev: 'smartvoc',
  smartvoc_voc: 'smartvoc',

  // Cognitive Task questions
  cognitive_short_text: 'cognitive',
  cognitive_long_text: 'cognitive',
  cognitive_multiple_choice: 'cognitive',
  cognitive_single_choice: 'cognitive',
  cognitive_linear_scale: 'cognitive',
  cognitive_rating: 'cognitive',
  cognitive_ranking: 'cognitive',
  cognitive_navigation_flow: 'cognitive_navigation_flow',
  cognitive_preference_test: 'cognitive',

  // Tipos adicionales para StepsComponents
  scale: 'scale',
  emoji: 'emoji',
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
 * Obtiene el tipo de componente basado en el questionKey
 */
export const getQuestionType = (questionKey: string): QuestionType => {
  return QUESTION_TYPE_MAP[questionKey as keyof typeof QUESTION_TYPE_MAP] || 'unknown';
};

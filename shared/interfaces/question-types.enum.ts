// Exportación explícita como objeto para compatibilidad con ESModule
export const QuestionType = {
  // SmartVOC types
  SMARTVOC_CSAT: 'smartvoc_csat',
  SMARTVOC_CV: 'smartvoc_cv',
  SMARTVOC_NPS: 'smartvoc_nps',
  SMARTVOC_ESAT: 'smartvoc_esat',
  SMARTVOC_OSAT: 'smartvoc_osat',
  SMARTVOC_VOC: 'smartvoc_voc',

  // Cognitive Task types
  COGNITIVE_LONG_TEXT: 'cognitive_long_text',
  COGNITIVE_MULTIPLE_CHOICE: 'cognitive_multiple_choice',
  COGNITIVE_SINGLE_CHOICE: 'cognitive_single_choice',
  COGNITIVE_RATING: 'cognitive_rating',
  COGNITIVE_RANKING: 'cognitive_ranking',

  // Demographics
  DEMOGRAPHICS: 'demographics',

  // Flow types
  WELCOME_SCREEN: 'welcome_screen',
  THANK_YOU_SCREEN: 'thank_you_screen',

  // Legacy types (para compatibilidad con datos existentes)
  WELCOME: 'welcome',
  THANKYOU: 'thankyou',
  DEMOGRAPHIC: 'demographic'
} as const;

// Tipo para TypeScript
export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

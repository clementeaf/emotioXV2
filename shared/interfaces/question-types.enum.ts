export const QuestionType = {
  SMARTVOC_CSAT: 'smartvoc_csat',
  SMARTVOC_CES: 'smartvoc_ces',
  SMARTVOC_CV: 'smartvoc_cv',
  SMARTVOC_NEV: 'smartvoc_nev',
  SMARTVOC_NPS: 'smartvoc_nps',
  SMARTVOC_VOC: 'smartvoc_voc',
  SMARTVOC_NC: 'smartvoc_nc',

  // Cognitive Task types
  COGNITIVE_LONG_TEXT: 'cognitive_long_text',
  COGNITIVE_MULTIPLE_CHOICE: 'cognitive_multiple_choice',
  COGNITIVE_SINGLE_CHOICE: 'cognitive_single_choice',
  COGNITIVE_RATING: 'cognitive_rating',
  COGNITIVE_RANKING: 'cognitive_ranking',
  DEMOGRAPHICS: 'demographics',
  WELCOME_SCREEN: 'welcome_screen',
  THANK_YOU_SCREEN: 'thank_you_screen',
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

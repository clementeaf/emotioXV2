import { buildQuestionDictionary } from '@shared/utils/buildQuestionDictionary';
import { QuestionDictionary } from 'shared/interfaces/question-dictionary.interface';
import { CognitiveTaskType } from 'shared/types/cognitive-task.types';
import { SmartVOCType } from 'shared/types/smart-voc.types';

// Mapeo de tipos legacy o alternativos a los tipos técnicos estándar para Cognitive Task
const cognitiveTypeMap: Record<string, CognitiveTaskType> = {
  'SHORT_TEXT': 'cognitive_short_text',
  'LONG_TEXT': 'cognitive_long_text',
  'MULTIPLE_CHOICE': 'cognitive_multiple_choice',
  'SINGLE_CHOICE': 'cognitive_single_choice',
  'LINEAR_SCALE': 'cognitive_linear_scale',
  'RANKING': 'cognitive_ranking',
  'IMAGE_SELECTION': 'cognitive_image_selection',
};

function normalizeCognitiveType(type: string): CognitiveTaskType {
  return cognitiveTypeMap[type?.toUpperCase()] || (type as CognitiveTaskType) || 'cognitive_short_text';
}

// Mapeo de tipos legacy o alternativos a los tipos técnicos estándar para SmartVOC
const smartVocTypeMap: Record<string, SmartVOCType> = {
  'VOC': 'smartvoc_voc',
  'CSAT': 'smartvoc_csat',
  'CES': 'smartvoc_ces',
  'CV': 'smartvoc_cv',
  'NPS': 'smartvoc_nps',
  'NEV': 'smartvoc_nev',
};

function normalizeSmartVocType(type: string): SmartVOCType {
  return smartVocTypeMap[type?.toUpperCase()] || (type as SmartVOCType) || 'smartvoc_voc';
}

/**
 * Construye el diccionario global de preguntas a partir de las listas de cada módulo.
 * No modifica el flujo de guardado modular, solo unifica la metadata para renderizado y trazabilidad.
 */
export function buildGlobalQuestionDictionary({
  welcomeScreenQuestions = [],
  cognitiveTaskQuestions = [],
  smartVocQuestions = [],
  thankYouScreenQuestions = [],
  eyeTrackingQuestions = []
}: {
  welcomeScreenQuestions?: any[];
  cognitiveTaskQuestions?: any[];
  smartVocQuestions?: any[];
  thankYouScreenQuestions?: any[];
  eyeTrackingQuestions?: any[];
}): QuestionDictionary {
  // Normalizar tipos de Cognitive Task
  const normalizedCognitiveQuestions = cognitiveTaskQuestions.map(q => ({
    ...q,
    module: 'cognitive_task',
    type: normalizeCognitiveType(q.type)
  }));

  // Normalizar tipos de SmartVOC
  const normalizedSmartVocQuestions = smartVocQuestions.map(q => ({
    ...q,
    module: 'smartvoc',
    type: normalizeSmartVocType(q.type)
  }));

  // Unir todas las preguntas de todos los módulos
  const allQuestions = [
    ...welcomeScreenQuestions.map(q => ({ ...q, module: 'welcome_screen' })),
    ...normalizedCognitiveQuestions,
    ...normalizedSmartVocQuestions,
    ...thankYouScreenQuestions.map(q => ({ ...q, module: 'thank_you_screen' })),
    ...eyeTrackingQuestions.map(q => ({ ...q, module: 'eye_tracking' })),
  ];

  // Construir el diccionario global
  return buildQuestionDictionary(allQuestions);
}

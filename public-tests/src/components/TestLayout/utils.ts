import { DemographicQuestion, Question, SidebarStep, StepData, StepSearchResult } from './types';

export const MOCK_CURRENT_STEP = 1;

const ORDER = [
  'WELCOME_SCREEN',
  'EYE_TRACKING_CONFIG',
  'SMART_VOC_FORM',
  'COGNITIVE_TASK',
  'THANK_YOU_SCREEN'
];

export const QUESTION_TYPE_MAP = {
  // SmartVOC - Escalas
  smartvoc_csat: 'scale',
  smartvoc_ces: 'scale',
  smartvoc_cv: 'scale',
  smartvoc_nps: 'scale',
  smartvoc_nc: 'scale',
  cognitive_linear_scale: 'scale',

  // SmartVOC - Emoji
  smartvoc_nev: 'emoji',

  // SmartVOC - Texto
  smartvoc_voc: 'text',
  cognitive_short_text: 'text',
  cognitive_long_text: 'text',

  // Opciones
  cognitive_single_choice: 'choice',
  cognitive_multiple_choice: 'choice',

  // Pendientes
  cognitive_ranking: 'pending',
  cognitive_navigation_flow: 'pending',
  cognitive_preference_test: 'pending'
} as const;

export type QuestionType = typeof QUESTION_TYPE_MAP[keyof typeof QUESTION_TYPE_MAP];

export function getSidebarSteps(data: StepData[] | undefined): SidebarStep[] {
  if (!data) return [];
  return data
    .slice()
    .sort((a, b) => ORDER.indexOf(a.originalSk) - ORDER.indexOf(b.originalSk))
    .flatMap(step => {
      if (step.originalSk === 'EYE_TRACKING_CONFIG') {
        return [{ label: 'Preguntas demográficas', questionKey: 'demographics' }];
      }
      if (
        (step.originalSk === 'SMART_VOC_FORM' || step.originalSk === 'COGNITIVE_TASK') &&
        Array.isArray(step.config?.questions)
      ) {
        return (step.config.questions as Question[]).map((q, index) => {
          // NUEVO: Generar questionKey único para cada pregunta SmartVOC
          let questionKey = q.questionKey || '';

          // Si no hay questionKey, generarlo basándose en el tipo de pregunta
          if (!questionKey && q.type) {
            const type = q.type.toLowerCase();
            if (type === 'csat') questionKey = 'smartvoc_csat';
            else if (type === 'ces') questionKey = 'smartvoc_ces';
            else if (type === 'cv') questionKey = 'smartvoc_cv';
            else if (type === 'nps') questionKey = 'smartvoc_nps';
            else if (type === 'nev') questionKey = 'smartvoc_nev';
            else if (type === 'voc') questionKey = 'smartvoc_voc';
            else questionKey = `smartvoc_${type}_${index}`;
          }

          return {
            label: q.title || 'Pregunta',
            questionKey
          };
        });
      }
      // WELCOME_SCREEN y THANK_YOU_SCREEN
      return [{
        label: String(step.config?.title || step.derivedType || 'Paso'),
        questionKey: step.originalSk === 'WELCOME_SCREEN' ? 'welcome_screen' :
                   step.originalSk === 'THANK_YOU_SCREEN' ? 'thank_you_screen' :
                   String(step.config?.questionKey || '')
      }];
    });
}

export function findStepByQuestionKey(
  data: StepData[] | undefined,
  questionKey: string
): StepSearchResult {
  if (!data) return undefined;
  for (const step of data) {
    if (
      (step.originalSk === 'SMART_VOC_FORM' || step.originalSk === 'COGNITIVE_TASK') &&
      step.config && Array.isArray(step.config.questions)
    ) {
      const found = (step.config.questions as Question[]).find(
        (q) => q.questionKey === questionKey
      );
      if (found) {
        return { ...found };
      }
    }
    // 2. Buscar en preguntas anidadas genérico
    if (step.config && Array.isArray(step.config.questions)) {
      const found = (step.config.questions as Question[]).find(
        (q) => q.questionKey === questionKey
      );
      if (found) {
        return found;
      }
    }
    // 3. Caso especial: EYE_TRACKING_CONFIG y demographics
    if (
      step.originalSk === 'EYE_TRACKING_CONFIG' &&
      questionKey === 'demographics' &&
      step.config && step.config.demographicQuestions &&
      typeof step.config.demographicQuestions === 'object'
    ) {
      const questionsObj = step.config.demographicQuestions;
      const demographicQuestions: DemographicQuestion[] = Object.entries(questionsObj).map(([key, value]) => ({
        key,
        ...(value as Omit<DemographicQuestion, 'key'>)
      }));
      return {
        demographicQuestions,
        parentStep: step
      };
    }
    // 4. Buscar en el nivel raíz
    if (step.questionKey === questionKey) {
      return step;
    }
    // 5. Buscar en config.questionKey
    if (step.config && step.config.questionKey === questionKey) {
      return step.config;
    }
  }
  return undefined;
}

export function getStepType(obj: StepSearchResult): 'parent' | 'demographics' | 'screen' | 'question' | 'smart-voc' | 'unknown' {
  if (obj && typeof obj === 'object') {
    if ('demographicQuestions' in obj) return 'demographics';
    if ('parentStep' in obj) return 'parent';
    if ('questionKey' in obj && (obj.questionKey === 'welcome_screen' || obj.questionKey === 'thank_you_screen')) return 'screen';
    if ('questionKey' in obj && obj.questionKey?.startsWith('smartvoc_')) return 'smart-voc';
    if ('questionKey' in obj) return 'question';
  }
  return 'unknown';
}

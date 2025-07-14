import { DemographicQuestion, Question, SidebarStep, StepData, StepSearchResult } from './types';

export const MOCK_CURRENT_STEP = 1;

const ORDER = [
  'WELCOME_SCREEN',
  'EYE_TRACKING_CONFIG',
  'SMART_VOC_FORM',
  'COGNITIVE_TASK',
  'THANK_YOU_SCREEN'
];

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
        return (step.config.questions as Question[]).map(q => ({
          label: q.title || 'Pregunta',
          questionKey: q.questionKey || ''
        }));
      }
      // WELCOME_SCREEN y THANK_YOU_SCREEN
      return [{
        label: String(step.config?.title || step.derivedType || 'Paso'),
        questionKey: String(step.config?.questionKey || '')
      }];
    });
}

export function findStepByQuestionKey(
  data: StepData[] | undefined,
  questionKey: string
): StepSearchResult {
  if (!data) return undefined;
  for (const step of data) {
    // 1. Buscar en preguntas anidadas para cognitive_task y smart_voc_form (PRIORIDAD)
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

export function getStepType(obj: StepSearchResult): 'parent' | 'demographics' | 'screen' | 'question' | 'unknown' {
  if (obj && typeof obj === 'object') {
    if ('demographicQuestions' in obj) return 'demographics';
    if ('parentStep' in obj) return 'parent';
    if ('questionKey' in obj && (obj.questionKey === 'welcome_screen' || obj.questionKey === 'thank_you_screen')) return 'screen';
    if ('questionKey' in obj) return 'question';
  }
  return 'unknown';
}

import { SidebarStep, StepData } from './types';

export const MOCK_CURRENT_STEP = 1;

export interface Question {
  title?: string;
  questionKey?: string;
  // otros campos si los necesitas
}

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

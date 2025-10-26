/**
 * Utilidades para datos iniciales de formularios
 * Centraliza todos los formularios por defecto del sistema
 */

import { QuestionType } from 'shared/interfaces/question-types.enum';
import type { SmartVOCFormData } from '@/api/domains/smart-voc';

/**
 * Datos iniciales para formulario SmartVOC
 * Define las 6 preguntas SmartVOC con configuración por defecto
 */
export const INITIAL_SMARTVOC_DATA: SmartVOCFormData = {
  researchId: '',
  questions: [
    {
      id: QuestionType.SMARTVOC_CSAT,
      type: 'scale',
      questionKey: 'smartvoc_csat',
      title: '',
      description: '',
      instructions: '',
      showConditionally: false,
      config: {
        type: 'stars'
      }
    },
    {
      id: QuestionType.SMARTVOC_CES,
      type: 'scale',
      questionKey: 'smartvoc_ces',
      title: '',
      description: '',
      instructions: '',
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 1, end: 5 },
        startLabel: '',
        endLabel: ''
      }
    },
    {
      id: QuestionType.SMARTVOC_CV,
      type: 'scale',
      questionKey: 'smartvoc_cv',
      title: '',
      description: '',
      instructions: '',
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 1, end: 5 },
        startLabel: '',
        endLabel: ''
      }
    },
    {
      id: QuestionType.SMARTVOC_NEV,
      type: 'multiple_choice',
      questionKey: 'smartvoc_nev',
      title: '',
      description: '',
      instructions: '',
      showConditionally: false,
      config: {
        type: 'emojis'
      }
    },
    {
      id: QuestionType.SMARTVOC_NPS,
      type: 'scale',
      questionKey: 'smartvoc_nps',
      title: '',
      description: '',
      instructions: '',
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 0, end: 10 },
        startLabel: '',
        endLabel: ''
      }
    },
    {
      id: QuestionType.SMARTVOC_VOC,
      type: 'text',
      questionKey: 'smartvoc_voc',
      title: '',
      description: '',
      instructions: '',
      showConditionally: false,
      config: {
        type: 'text'
      }
    }
  ],
  randomizeQuestions: false,
  smartVocRequired: true,
  metadata: {
    createdAt: new Date().toISOString(),
    estimatedCompletionTime: '5-10'
  }
};

/**
 * Datos iniciales para pantalla de bienvenida
 */
export const INITIAL_WELCOME_SCREEN_DATA = {
  researchId: '',
  questionKey: 'welcome_screen',
  type: 'screen',
  title: '',
  description: '',
  instructions: '',
  showConditionally: false
};

/**
 * Datos iniciales para pantalla de agradecimiento
 */
export const INITIAL_THANK_YOU_SCREEN_DATA = {
  researchId: '',
  questionKey: 'thank_you_screen',
  type: 'screen',
  title: '',
  description: '',
  instructions: '',
  showConditionally: false
};

/**
 * Datos iniciales para tareas cognitivas
 */
export const INITIAL_COGNITIVE_TASK_DATA = {
  researchId: '',
  questions: [
    {
      id: '3.1',
      type: 'short_text',
      title: '',
      description: '',
      answerPlaceholder: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    },
    {
      id: '3.2',
      type: 'long_text',
      title: '',
      answerPlaceholder: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    },
    {
      id: '3.3',
      type: 'single_choice',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.4',
      type: 'multiple_choice',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.5',
      type: 'linear_scale',
      title: '',
      required: false,
      showConditionally: false,
      scaleConfig: {
        startValue: 1,
        endValue: 5,
        startLabel: '',
        endLabel: ''
      },
      deviceFrame: false,
      files: []
    },
    {
      id: '3.6',
      type: 'ranking',
      title: '',
      required: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ]
    },
    {
      id: '3.7',
      type: 'file_upload',
      title: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    },
    {
      id: '3.8',
      type: 'preference_test',
      title: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    }
  ],
  randomizeQuestions: false,
  cognitiveTaskRequired: true,
  metadata: {
    createdAt: new Date().toISOString(),
    estimatedCompletionTime: '10-15'
  }
};

/**
 * Datos iniciales para eye tracking
 */
export const INITIAL_EYE_TRACKING_DATA = {
  researchId: '',
  buildConfig: {
    deviceFrame: false,
    instructions: '',
    showConditionally: false
  },
  recruitConfig: {
    maxParticipants: 50,
    instructions: '',
    showConditionally: false
  },
  metadata: {
    createdAt: new Date().toISOString(),
    estimatedCompletionTime: '15-20'
  }
};

/**
 * Mapeo de QuestionKeys a datos iniciales
 */
const INITIAL_DATA_MAP: Record<string, any> = {
  'welcome_screen': INITIAL_WELCOME_SCREEN_DATA,
  'thank_you_screen': INITIAL_THANK_YOU_SCREEN_DATA,
  'thankyou_screen': INITIAL_THANK_YOU_SCREEN_DATA,
  'smartvoc': INITIAL_SMARTVOC_DATA,
  'smartvoc_csat': INITIAL_SMARTVOC_DATA,
  'smartvoc_ces': INITIAL_SMARTVOC_DATA,
  'smartvoc_cv': INITIAL_SMARTVOC_DATA,
  'smartvoc_nev': INITIAL_SMARTVOC_DATA,
  'smartvoc_nps': INITIAL_SMARTVOC_DATA,
  'smartvoc_voc': INITIAL_SMARTVOC_DATA,
  'cognitive_task': INITIAL_COGNITIVE_TASK_DATA,
  'eye_tracking': INITIAL_EYE_TRACKING_DATA,
};

/**
 * Obtener datos iniciales basado en questionKey
 * @param questionKey - Identificador único del tipo de formulario
 * @returns Datos iniciales correspondientes
 */
export const getInitialDataByQuestionKey = (questionKey: string): any => {
  const initialData = INITIAL_DATA_MAP[questionKey];
  
  if (!initialData) {
    throw new Error(`No se encontraron datos iniciales para questionKey: ${questionKey}`);
  }
  
  return initialData;
};

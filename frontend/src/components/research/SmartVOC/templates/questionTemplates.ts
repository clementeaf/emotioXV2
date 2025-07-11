import { QuestionType, SmartVOCQuestion } from '../types';

/**
 * Plantillas disponibles para crear nuevas preguntas
 * Estas NO son preguntas por defecto, sino plantillas que el usuario puede usar para crear preguntas
 */
export const QUESTION_TEMPLATES: Partial<Record<QuestionType, Omit<SmartVOCQuestion, 'id'>>> = {
  [QuestionType.SMARTVOC_CSAT]: {
    type: QuestionType.SMARTVOC_CSAT,
    title: 'Customer Satisfaction Score (CSAT)',
    description: '¿Cómo calificaría su nivel general de satisfacción con [empresa]?',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'stars',
      companyName: ''
    }
  },
  [QuestionType.SMARTVOC_CES]: {
    type: QuestionType.SMARTVOC_CES,
    title: 'Customer Effort Score (CES)',
    description: 'Fue fácil para mí resolver mi problema hoy.',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 7 }
    }
  },
  [QuestionType.SMARTVOC_CV]: {
    type: QuestionType.SMARTVOC_CV,
    title: 'Cognitive Value (CV)',
    description: 'Esta experiencia superó mis expectativas.',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 7 },
      startLabel: 'Muy en desacuerdo',
      endLabel: 'Muy de acuerdo'
    }
  },
  [QuestionType.SMARTVOC_NPS]: {
    type: QuestionType.SMARTVOC_NPS,
    title: 'NPS',
    description: 'Net Promoter Score',
    instructions: '¿Qué tan probable es que recomiendes nuestro producto/servicio?',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 0, end: 10 },
      startLabel: 'Muy improbable',
      endLabel: 'Muy probable'
    }
  },
  [QuestionType.SMARTVOC_NEV]: {
    type: QuestionType.SMARTVOC_NEV,
    title: 'NEV',
    description: 'Net Emotional Value',
    instructions: '¿Qué emoción experimentaste?',
    showConditionally: false,
    config: {
      type: 'emojis',
      emotions: ['Felicidad', 'Tristeza', 'Enojo', 'Miedo', 'Sorpresa', 'Disgusto']
    }
  },
  [QuestionType.SMARTVOC_VOC]: {
    type: QuestionType.SMARTVOC_VOC,
    title: 'VOC',
    description: 'Voice of Customer',
    instructions: 'Cuéntanos tu experiencia',
    showConditionally: false,
    config: {
      type: 'text',
      maxLength: 500
    }
  },
  [QuestionType.SMARTVOC_NC]: {
    type: QuestionType.SMARTVOC_NC,
    title: 'NC',
    description: 'Nivel de Confianza/Satisfacción',
    instructions: '¿Qué tan satisfecho estás?',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 5 },
      startLabel: 'Muy insatisfecho',
      endLabel: 'Muy satisfecho'
    }
  },
};

/**
 * Obtiene los tipos de preguntas disponibles que no han sido creados aún
 */
export const getAvailableQuestionTypes = (existingTypes: QuestionType[]): QuestionType[] => {
  return Object.keys(QUESTION_TEMPLATES).filter(
    type => !existingTypes.includes(type as QuestionType)
  ) as QuestionType[];
};

/**
 * Crea una nueva pregunta basada en una plantilla
 */
export const createQuestionFromTemplate = (
  type: QuestionType,
  customInstructions?: string
): SmartVOCQuestion => {
  const template = QUESTION_TEMPLATES[type];
  if (!template) {
    throw new Error(`No existe plantilla para el tipo: ${type}`);
  }
  const uniqueId = `${type.toLowerCase()}_${Date.now()}`;
  return {
    ...template,
    id: uniqueId,
    instructions: customInstructions || template.instructions
  };
};
